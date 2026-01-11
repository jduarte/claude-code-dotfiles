/**
 * Database layer for SQLite operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Term, TermRow, rowToTerm, termToRow, CategoryCount } from './types.js';

const DB_DIR = path.join(process.env.HOME || '', '.claude', 'salsify-glossary', 'db');
const DB_PATH = path.join(DB_DIR, 'glossary.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure db directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function initializeSchema(database: Database.Database): void {
  // Main terms table
  database.exec(`
    CREATE TABLE IF NOT EXISTS terms (
      acronym TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      owner TEXT,
      related_terms TEXT,
      links TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_category ON terms(category);
  `);

  // Full-text search virtual table
  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS terms_fts USING fts5(
      acronym,
      name,
      description,
      content='terms',
      content_rowid='rowid'
    );
  `);

  // Triggers to keep FTS in sync
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS terms_ai AFTER INSERT ON terms BEGIN
      INSERT INTO terms_fts(rowid, acronym, name, description)
      VALUES (NEW.rowid, NEW.acronym, NEW.name, NEW.description);
    END;

    CREATE TRIGGER IF NOT EXISTS terms_ad AFTER DELETE ON terms BEGIN
      INSERT INTO terms_fts(terms_fts, rowid, acronym, name, description)
      VALUES ('delete', OLD.rowid, OLD.acronym, OLD.name, OLD.description);
    END;

    CREATE TRIGGER IF NOT EXISTS terms_au AFTER UPDATE ON terms BEGIN
      INSERT INTO terms_fts(terms_fts, rowid, acronym, name, description)
      VALUES ('delete', OLD.rowid, OLD.acronym, OLD.name, OLD.description);
      INSERT INTO terms_fts(rowid, acronym, name, description)
      VALUES (NEW.rowid, NEW.acronym, NEW.name, NEW.description);
    END;
  `);

  // Audit log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      query TEXT NOT NULL,
      found INTEGER NOT NULL,
      result_count INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_query ON audit_log(query);
  `);
}

// CRUD Operations

export function getTerm(acronym: string): Term | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM terms WHERE acronym = ? COLLATE NOCASE').get(acronym) as TermRow | undefined;
  return row ? rowToTerm(row) : null;
}

export function getAllTerms(): Term[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM terms ORDER BY acronym').all() as TermRow[];
  return rows.map(rowToTerm);
}

export function getTermsByCategory(category: string): Term[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM terms WHERE category = ? COLLATE NOCASE ORDER BY acronym').all(category) as TermRow[];
  return rows.map(rowToTerm);
}

export function getCategories(): CategoryCount[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM terms
    GROUP BY category
    ORDER BY category
  `).all() as Array<{ category: string; count: number }>;
  return rows;
}

export function getAllAcronyms(): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT acronym FROM terms').all() as Array<{ acronym: string }>;
  return rows.map(r => r.acronym);
}

export function upsertTerm(term: Term): void {
  const db = getDatabase();
  const row = termToRow(term);

  db.prepare(`
    INSERT INTO terms (acronym, name, description, category, owner, related_terms, links, updated_at)
    VALUES (@acronym, @name, @description, @category, @owner, @related_terms, @links, CURRENT_TIMESTAMP)
    ON CONFLICT(acronym) DO UPDATE SET
      name = @name,
      description = @description,
      category = @category,
      owner = @owner,
      related_terms = @related_terms,
      links = @links,
      updated_at = CURRENT_TIMESTAMP
  `).run(row);
}

export function deleteTerm(acronym: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM terms WHERE acronym = ?').run(acronym);
  return result.changes > 0;
}

export function deleteAllTerms(): void {
  const db = getDatabase();
  db.prepare('DELETE FROM terms').run();
}

// Bulk operations for sync

export function bulkUpsertTerms(terms: Term[]): void {
  const db = getDatabase();
  const upsert = db.prepare(`
    INSERT INTO terms (acronym, name, description, category, owner, related_terms, links, updated_at)
    VALUES (@acronym, @name, @description, @category, @owner, @related_terms, @links, CURRENT_TIMESTAMP)
    ON CONFLICT(acronym) DO UPDATE SET
      name = @name,
      description = @description,
      category = @category,
      owner = @owner,
      related_terms = @related_terms,
      links = @links,
      updated_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction((terms: Term[]) => {
    for (const term of terms) {
      upsert.run(termToRow(term));
    }
  });

  transaction(terms);
}

export function getTermCount(): number {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM terms').get() as { count: number };
  return result.count;
}
