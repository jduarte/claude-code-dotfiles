/**
 * Search layer with FTS5 full-text search and Levenshtein fuzzy matching
 */

import { distance } from 'fastest-levenshtein';
import { getDatabase, getTerm, getAllAcronyms } from './database.js';
import { Term, TermRow, rowToTerm, UnifiedSearchResult, BatchSearchResult, SearchResult } from './types.js';

const MAX_FUZZY_DISTANCE = 2;

/**
 * Unified search function that combines exact acronym matching, full-text search, and fuzzy matching
 */
export function search(query: string, limit: number = 20): UnifiedSearchResult {
  // First try exact acronym match (case-insensitive)
  const exactTerm = getTerm(query);

  if (exactTerm) {
    return {
      terms: [exactTerm],
      exactMatch: exactTerm,
      totalCount: 1,
    };
  }

  // No exact match - perform FTS5 full-text search
  const db = getDatabase();
  const sanitizedQuery = sanitizeFtsQuery(query);

  const rows = db.prepare(`
    SELECT t.*, bm25(terms_fts) as rank
    FROM terms_fts
    JOIN terms t ON terms_fts.acronym = t.acronym
    WHERE terms_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(sanitizedQuery, limit) as Array<TermRow & { rank: number }>;

  // Check for fuzzy acronym suggestion
  const suggestion = findClosestAcronym(query);

  if (rows.length > 0) {
    return {
      terms: rows.map(rowToTerm),
      suggestion: suggestion ?? undefined,
      totalCount: rows.length,
    };
  }

  // If no FTS results, try fuzzy matching on all terms
  const fuzzyResult = fuzzySearchAllTerms(query, limit);

  return {
    terms: fuzzyResult.terms,
    suggestion: suggestion ?? undefined,
    totalCount: fuzzyResult.terms.length,
  };
}

/**
 * Find the closest matching acronym using Levenshtein distance
 */
function findClosestAcronym(query: string): { acronym: string; distance: number } | null {
  const acronyms = getAllAcronyms();
  const queryUpper = query.toUpperCase();

  let closest: { acronym: string; distance: number } | null = null;

  for (const acronym of acronyms) {
    const d = distance(queryUpper, acronym.toUpperCase());

    if (d <= MAX_FUZZY_DISTANCE && (!closest || d < closest.distance)) {
      closest = { acronym, distance: d };
    }
  }

  return closest;
}

/**
 * Sanitize a query string for FTS5
 * FTS5 uses special characters like *, -, "", etc.
 */
function sanitizeFtsQuery(query: string): string {
  // Remove special FTS operators and wrap each word in quotes
  const words = query
    .replace(/[*"():^]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Use prefix matching for each word
  return words.map(w => `"${w}"*`).join(' ');
}

/**
 * Fuzzy search across all terms when FTS fails
 */
function fuzzySearchAllTerms(query: string, limit: number): SearchResult {
  const db = getDatabase();
  const allRows = db.prepare('SELECT * FROM terms').all() as TermRow[];
  const queryLower = query.toLowerCase();

  const scored = allRows
    .map(row => {
      const term = rowToTerm(row);
      const score = calculateRelevanceScore(term, queryLower);
      return { term, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    terms: scored.map(s => s.term),
    totalCount: scored.length,
  };
}

/**
 * Calculate a relevance score for fuzzy matching
 */
function calculateRelevanceScore(term: Term, queryLower: string): number {
  let score = 0;

  const acronymLower = term.acronym.toLowerCase();
  const nameLower = term.name.toLowerCase();
  const descLower = term.description?.toLowerCase() ?? '';

  // Exact matches get highest score
  if (acronymLower === queryLower) score += 100;
  if (nameLower === queryLower) score += 80;

  // Contains matches
  if (acronymLower.includes(queryLower)) score += 50;
  if (nameLower.includes(queryLower)) score += 40;
  if (descLower.includes(queryLower)) score += 20;

  // Word boundary matches in name
  const words = nameLower.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(queryLower)) score += 30;
  }

  // Levenshtein distance for typo tolerance
  const acronymDist = distance(acronymLower, queryLower);
  if (acronymDist <= MAX_FUZZY_DISTANCE) {
    score += (MAX_FUZZY_DISTANCE - acronymDist + 1) * 10;
  }

  return score;
}

/**
 * Batch search multiple queries at once
 */
export function batchSearch(queries: string[]): BatchSearchResult {
  const results: Record<string, UnifiedSearchResult> = {};
  const found: string[] = [];
  const notFound: string[] = [];

  for (const query of queries) {
    const result = search(query);
    results[query] = result;

    if (result.totalCount > 0) {
      found.push(query);
    } else {
      notFound.push(query);
    }
  }

  return { results, found, notFound };
}
