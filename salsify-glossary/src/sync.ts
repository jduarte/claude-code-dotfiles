/**
 * Sync layer for JSON to SQLite synchronization with file watching
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { GlossaryData, Term, SyncResult } from './types.js';
import { bulkUpsertTerms, getAllTerms, deleteTerm, getDatabase, reopenDatabase } from './database.js';

const DATA_DIR = path.join(process.env.HOME || '', '.claude', 'salsify-glossary', 'data');
const GLOSSARY_PATH = path.join(DATA_DIR, 'glossary.json');
const SCHEMA_PATH = path.join(DATA_DIR, 'glossary.schema.json');

let watcher: chokidar.FSWatcher | null = null;
let syncInProgress = false;

// Initialize AJV validator
const ajv = new Ajv.default({ allErrors: true, strict: false });
addFormats.default(ajv);

/**
 * Load and validate the glossary JSON file
 */
export function loadGlossaryFile(): GlossaryData | null {
  if (!fs.existsSync(GLOSSARY_PATH)) {
    console.error(`Glossary file not found: ${GLOSSARY_PATH}`);
    return null;
  }

  try {
    const content = fs.readFileSync(GLOSSARY_PATH, 'utf-8');
    const data = JSON.parse(content) as GlossaryData;
    return data;
  } catch (error) {
    console.error('Error reading glossary file:', error);
    return null;
  }
}

/**
 * Load the JSON schema
 */
function loadSchema(): object | null {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.warn(`Schema file not found: ${SCHEMA_PATH}`);
    return null;
  }

  try {
    const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading schema file:', error);
    return null;
  }
}

/**
 * Validate glossary data against the schema
 */
export function validateGlossary(data: GlossaryData): { valid: boolean; errors: string[] } {
  const schema = loadSchema();

  if (!schema) {
    // If no schema, skip validation
    return { valid: true, errors: [] };
  }

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    const errors = validate.errors.map((err: ErrorObject) =>
      `${err.instancePath || 'root'}: ${err.message}`
    );
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Sync JSON data to SQLite database
 */
export function syncToDatabase(data: GlossaryData): SyncResult {
  const result: SyncResult = {
    added: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  // Validate first
  const validation = validateGlossary(data);
  if (!validation.valid) {
    result.errors = validation.errors;
    return result;
  }

  try {
    // Get current terms from database
    const existingTerms = getAllTerms();
    const existingAcronyms = new Set(existingTerms.map(t => t.acronym));
    const newAcronyms = new Set(data.terms.map(t => t.acronym));

    // Find terms to delete (in DB but not in JSON)
    const toDelete = existingTerms.filter(t => !newAcronyms.has(t.acronym));

    // Determine added vs updated
    for (const term of data.terms) {
      if (existingAcronyms.has(term.acronym)) {
        result.updated++;
      } else {
        result.added++;
      }
    }

    // Delete removed terms
    for (const term of toDelete) {
      deleteTerm(term.acronym);
      result.deleted++;
    }

    // Upsert all terms from JSON
    bulkUpsertTerms(data.terms);

    console.log(`Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
  } catch (error) {
    result.errors.push(`Sync error: ${error}`);
    console.error('Sync error:', error);
  }

  return result;
}

/**
 * Perform a full sync from JSON to SQLite
 */
export function performSync(): SyncResult {
  if (syncInProgress) {
    return { added: 0, updated: 0, deleted: 0, errors: ['Sync already in progress'] };
  }

  syncInProgress = true;

  try {
    // Reopen database to ensure fresh connection sees latest WAL changes
    reopenDatabase();

    const data = loadGlossaryFile();

    if (!data) {
      return {
        added: 0,
        updated: 0,
        deleted: 0,
        errors: ['Could not load glossary file'],
      };
    }

    return syncToDatabase(data);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Start file watcher for live sync
 */
export function startFileWatcher(onChange?: (result: SyncResult) => void): void {
  if (watcher) {
    console.log('File watcher already running');
    return;
  }

  // Perform initial sync
  const initialResult = performSync();
  if (onChange) {
    onChange(initialResult);
  }

  // Watch for changes
  watcher = chokidar.watch(GLOSSARY_PATH, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', () => {
    console.log('Glossary file changed, syncing...');
    const result = performSync();
    if (onChange) {
      onChange(result);
    }
  });

  watcher.on('error', error => {
    console.error('File watcher error:', error);
  });

  console.log(`Watching for changes: ${GLOSSARY_PATH}`);
}

/**
 * Stop file watcher
 */
export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log('File watcher stopped');
  }
}

/**
 * Check if glossary file exists
 */
export function glossaryFileExists(): boolean {
  return fs.existsSync(GLOSSARY_PATH);
}

/**
 * Get the glossary file path
 */
export function getGlossaryPath(): string {
  return GLOSSARY_PATH;
}

/**
 * Get the schema file path
 */
export function getSchemaPath(): string {
  return SCHEMA_PATH;
}

/**
 * Add a term to the JSON file
 */
export function addTermToFile(term: Term): { success: boolean; error?: string } {
  try {
    const data = loadGlossaryFile();

    if (!data) {
      return { success: false, error: 'Could not load glossary file' };
    }

    // Check for duplicate
    const existing = data.terms.find(t => t.acronym.toUpperCase() === term.acronym.toUpperCase());
    if (existing) {
      return { success: false, error: `Term "${term.acronym}" already exists` };
    }

    // Add term
    data.terms.push(term);

    // Sort by acronym
    data.terms.sort((a, b) => a.acronym.localeCompare(b.acronym));

    // Write back
    fs.writeFileSync(GLOSSARY_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to add term: ${error}` };
  }
}
