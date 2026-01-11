/**
 * Core types for the Salsify Glossary MCP Server
 */

export interface Link {
  url: string;
  description: string;
}

export interface Term {
  acronym: string;
  name: string;
  description?: string;
  category: string;
  owner?: string;
  relatedTerms?: string[];
  links?: Link[];
}

export interface GlossaryData {
  $schema?: string;
  terms: Term[];
}

export interface TermRow {
  acronym: string;
  name: string;
  description: string | null;
  category: string;
  owner: string | null;
  related_terms: string | null; // JSON string
  links: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  action: 'search' | 'list_by_category' | 'list_categories';
  query: string;
  found: boolean;
  result_count: number | null;
  timestamp: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface LookupResult {
  found: boolean;
  term?: Term;
  suggestion?: {
    acronym: string;
    distance: number;
  };
}

export interface SearchResult {
  terms: Term[];
  totalCount: number;
}

/**
 * Unified search result combining exact match, full-text search, and fuzzy matching
 */
export interface UnifiedSearchResult {
  terms: Term[];
  exactMatch?: Term;          // Set if query matched an acronym exactly
  suggestion?: { acronym: string; distance: number };  // Fuzzy suggestion if no exact match
  totalCount: number;
}

export interface BatchSearchResult {
  results: Record<string, UnifiedSearchResult>;
  found: string[];
  notFound: string[];
}

export interface AuditStats {
  totalLookups: number;
  uniqueTerms: number;
  notFoundCount: number;
  topQueries: Array<{ query: string; count: number }>;
  notFoundQueries: Array<{ query: string; count: number }>;
}

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
}

// Helper function to convert TermRow to Term
export function rowToTerm(row: TermRow): Term {
  return {
    acronym: row.acronym,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category,
    owner: row.owner ?? undefined,
    relatedTerms: row.related_terms ? JSON.parse(row.related_terms) : undefined,
    links: row.links ? JSON.parse(row.links) : undefined,
  };
}

// Helper function to convert Term to database values
export function termToRow(term: Term): Omit<TermRow, 'created_at' | 'updated_at'> {
  return {
    acronym: term.acronym,
    name: term.name,
    description: term.description ?? null,
    category: term.category,
    owner: term.owner ?? null,
    related_terms: term.relatedTerms ? JSON.stringify(term.relatedTerms) : null,
    links: term.links ? JSON.stringify(term.links) : null,
  };
}
