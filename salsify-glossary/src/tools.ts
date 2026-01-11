/**
 * MCP Tool definitions for the Salsify Glossary server
 */

import { search, batchSearch } from './search.js';
import { getTermsByCategory, getCategories } from './database.js';
import { logAudit } from './audit.js';
import { Term, UnifiedSearchResult } from './types.js';

/**
 * Format a term for display
 */
function formatTerm(term: Term): string {
  const lines: string[] = [];
  lines.push(`**${term.acronym}**: ${term.name}`);

  if (term.description) {
    lines.push(`\n${term.description}`);
  }

  lines.push(`\nCategory: ${term.category}`);

  if (term.owner) {
    lines.push(`Owner: ${term.owner}`);
  }

  if (term.relatedTerms && term.relatedTerms.length > 0) {
    lines.push(`Related: ${term.relatedTerms.join(', ')}`);
  }

  if (term.links && term.links.length > 0) {
    lines.push('\nLinks:');
    for (const link of term.links) {
      lines.push(`- ${link.description}: ${link.url}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a unified search result
 */
function formatSearchResult(query: string, result: UnifiedSearchResult): string {
  // Exact match found
  if (result.exactMatch) {
    return formatTerm(result.exactMatch);
  }

  // No results at all
  if (result.totalCount === 0) {
    if (result.suggestion) {
      const suggestionResult = search(result.suggestion.acronym);
      if (suggestionResult.exactMatch) {
        return `Term "${query}" not found. Did you mean "${result.suggestion.acronym}"?\n\n${formatTerm(suggestionResult.exactMatch)}`;
      }
    }
    return `No terms found matching "${query}".`;
  }

  // Multiple results from search
  const lines: string[] = [];

  if (result.suggestion && result.suggestion.acronym !== result.terms[0]?.acronym) {
    lines.push(`Did you mean "${result.suggestion.acronym}"?\n`);
  }

  lines.push(`Found ${result.terms.length} term(s) matching "${query}":\n`);

  for (const term of result.terms) {
    lines.push(`---\n${formatTerm(term)}\n`);
  }

  return lines.join('\n');
}

/**
 * Tool: search
 * Unified search combining exact acronym match, full-text search, and fuzzy matching
 * Accepts a single query string or an array of queries (always uses batch search internally)
 */
export function toolSearch(query: string | string[]): string {
  // Normalize to array
  const queries = Array.isArray(query) ? query : [query];

  // Always use batch search
  const result = batchSearch(queries);

  // Log the search
  logAudit('search', queries.join(','), result.found.length > 0, result.found.length);

  // Format as batch result
  const lines: string[] = [];
  lines.push(`## Batch Search Results\n`);
  lines.push(`Found: ${result.found.length}/${queries.length}`);

  if (result.notFound.length > 0) {
    lines.push(`Not found: ${result.notFound.join(', ')}\n`);
  }

  lines.push('---\n');

  for (const q of queries) {
    const searchResult = result.results[q];
    lines.push(`### ${q}`);
    lines.push(formatSearchResult(q, searchResult));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Tool: list_by_category
 * List all terms in a specific category
 */
export function toolListByCategory(category: string): string {
  const terms = getTermsByCategory(category);

  // Log the lookup
  logAudit('list_by_category', category, terms.length > 0, terms.length);

  if (terms.length === 0) {
    const categories = getCategories();
    const availableCategories = categories.map(c => c.category).join(', ');
    return `No terms found in category "${category}". Available categories: ${availableCategories}`;
  }

  const lines: string[] = [];
  lines.push(`## ${category} (${terms.length} terms)\n`);

  for (const term of terms) {
    lines.push(`- **${term.acronym}**: ${term.name}`);
  }

  return lines.join('\n');
}

/**
 * Tool: list_categories
 * List all categories with term counts
 */
export function toolListCategories(): string {
  const categories = getCategories();

  // Log the lookup
  logAudit('list_categories', '*', true, categories.length);

  if (categories.length === 0) {
    return 'No categories found. The glossary may be empty.';
  }

  const lines: string[] = [];
  lines.push('## Glossary Categories\n');

  for (const cat of categories) {
    lines.push(`- **${cat.category}**: ${cat.count} term(s)`);
  }

  const total = categories.reduce((sum, c) => sum + c.count, 0);
  lines.push(`\n*Total: ${total} terms across ${categories.length} categories*`);

  return lines.join('\n');
}

/**
 * Get tool definitions for MCP registration
 */
export function getToolDefinitions() {
  return [
    {
      name: 'search',
      description: 'Search the Salsify glossary for acronyms or terms. Combines exact acronym matching, full-text search across names and descriptions, and fuzzy matching for typos. Use this for any glossary lookup.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
            description: 'The acronym or search query (e.g., "PIM", "product management", "DAM") or an array of queries (e.g., ["PIM", "DAM", "TSR"])',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_by_category',
      description: 'List all terms in a specific category. Use list_categories first to see available categories.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'The category name (e.g., "Engineering", "Sales", "Product")',
          },
        },
        required: ['category'],
      },
    },
    {
      name: 'list_categories',
      description: 'List all available categories in the Salsify glossary with the count of terms in each.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}
