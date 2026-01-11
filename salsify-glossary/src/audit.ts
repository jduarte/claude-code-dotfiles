/**
 * Audit logging layer for tracking glossary lookups
 */

import { getDatabase } from './database.js';
import { AuditLogEntry, AuditStats } from './types.js';

export type AuditAction = 'search' | 'list_by_category' | 'list_categories';

/**
 * Log an audit entry for a glossary operation
 */
export function logAudit(
  action: AuditAction,
  query: string,
  found: boolean,
  resultCount?: number
): void {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO audit_log (action, query, found, result_count)
    VALUES (?, ?, ?, ?)
  `).run(action, query, found ? 1 : 0, resultCount ?? null);
}

/**
 * Get recent audit log entries
 */
export function getAuditLog(limit: number = 100, offset: number = 0): AuditLogEntry[] {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT id, action, query, found, result_count, timestamp
    FROM audit_log
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Array<{
    id: number;
    action: string;
    query: string;
    found: number;
    result_count: number | null;
    timestamp: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    action: row.action as AuditAction,
    query: row.query,
    found: row.found === 1,
    result_count: row.result_count,
    timestamp: row.timestamp,
  }));
}

/**
 * Get audit statistics for analysis
 */
export function getAuditStats(days: number = 30): AuditStats {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString();

  // Total lookups
  const totalResult = db.prepare(`
    SELECT COUNT(*) as count FROM audit_log WHERE timestamp >= ?
  `).get(cutoff) as { count: number };

  // Unique terms queried
  const uniqueResult = db.prepare(`
    SELECT COUNT(DISTINCT query) as count FROM audit_log WHERE timestamp >= ?
  `).get(cutoff) as { count: number };

  // Not found count
  const notFoundResult = db.prepare(`
    SELECT COUNT(*) as count FROM audit_log WHERE found = 0 AND timestamp >= ?
  `).get(cutoff) as { count: number };

  // Top queries
  const topQueries = db.prepare(`
    SELECT query, COUNT(*) as count
    FROM audit_log
    WHERE timestamp >= ?
    GROUP BY query
    ORDER BY count DESC
    LIMIT 10
  `).all(cutoff) as Array<{ query: string; count: number }>;

  // Not found queries (candidates for new terms)
  const notFoundQueries = db.prepare(`
    SELECT query, COUNT(*) as count
    FROM audit_log
    WHERE found = 0 AND timestamp >= ?
    GROUP BY query
    ORDER BY count DESC
    LIMIT 10
  `).all(cutoff) as Array<{ query: string; count: number }>;

  return {
    totalLookups: totalResult.count,
    uniqueTerms: uniqueResult.count,
    notFoundCount: notFoundResult.count,
    topQueries,
    notFoundQueries,
  };
}

/**
 * Get audit entries for a specific query
 */
export function getAuditForQuery(query: string): AuditLogEntry[] {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT id, action, query, found, result_count, timestamp
    FROM audit_log
    WHERE query = ? COLLATE NOCASE
    ORDER BY timestamp DESC
    LIMIT 100
  `).all(query) as Array<{
    id: number;
    action: string;
    query: string;
    found: number;
    result_count: number | null;
    timestamp: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    action: row.action as AuditAction,
    query: row.query,
    found: row.found === 1,
    result_count: row.result_count,
    timestamp: row.timestamp,
  }));
}

/**
 * Get daily lookup activity
 */
export function getDailyActivity(days: number = 30): Array<{ date: string; count: number }> {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString();

  return db.prepare(`
    SELECT DATE(timestamp) as date, COUNT(*) as count
    FROM audit_log
    WHERE timestamp >= ?
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `).all(cutoff) as Array<{ date: string; count: number }>;
}

/**
 * Clean up old audit entries
 */
export function cleanupAuditLog(retentionDays: number = 90): number {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoff = cutoffDate.toISOString();

  const result = db.prepare(`
    DELETE FROM audit_log WHERE timestamp < ?
  `).run(cutoff);

  return result.changes;
}

/**
 * Get count of audit entries
 */
export function getAuditCount(): number {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM audit_log').get() as { count: number };
  return result.count;
}
