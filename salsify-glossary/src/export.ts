/**
 * Export layer for generating Markdown and JSON outputs
 */

import { getAllTerms, getCategories } from './database.js';
import { Term, GlossaryData } from './types.js';

/**
 * Export glossary to Markdown format
 */
export function exportToMarkdown(): string {
  const terms = getAllTerms();
  const categories = getCategories();

  const lines: string[] = [];

  // Header
  lines.push('# Salsify Glossary');
  lines.push('');
  lines.push(`*${terms.length} terms across ${categories.length} categories*`);
  lines.push('');

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  for (const cat of categories) {
    const anchor = cat.category.toLowerCase().replace(/\s+/g, '-');
    lines.push(`- [${cat.category}](#${anchor}) (${cat.count})`);
  }
  lines.push('');

  // Group terms by category
  const termsByCategory = new Map<string, Term[]>();
  for (const term of terms) {
    const existing = termsByCategory.get(term.category) || [];
    existing.push(term);
    termsByCategory.set(term.category, existing);
  }

  // Output each category
  for (const cat of categories) {
    lines.push(`## ${cat.category}`);
    lines.push('');

    const categoryTerms = termsByCategory.get(cat.category) || [];

    for (const term of categoryTerms) {
      lines.push(`### ${term.acronym}`);
      lines.push('');
      lines.push(`**${term.name}**`);
      lines.push('');

      if (term.description) {
        lines.push(term.description);
        lines.push('');
      }

      // Metadata table
      const metadata: string[] = [];
      if (term.owner) {
        metadata.push(`| Owner | ${term.owner} |`);
      }
      if (term.relatedTerms && term.relatedTerms.length > 0) {
        metadata.push(`| Related | ${term.relatedTerms.join(', ')} |`);
      }

      if (metadata.length > 0) {
        lines.push('| | |');
        lines.push('|---|---|');
        lines.push(...metadata);
        lines.push('');
      }

      // Links
      if (term.links && term.links.length > 0) {
        lines.push('**Links:**');
        for (const link of term.links) {
          lines.push(`- [${link.description}](${link.url})`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Export glossary to JSON format
 */
export function exportToJson(pretty: boolean = true): string {
  const terms = getAllTerms();

  const data: GlossaryData = {
    $schema: './glossary.schema.json',
    terms,
  };

  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Export terms for a specific category
 */
export function exportCategory(category: string, format: 'markdown' | 'json' = 'markdown'): string {
  const allTerms = getAllTerms();
  const terms = allTerms.filter(t => t.category.toLowerCase() === category.toLowerCase());

  if (format === 'json') {
    return JSON.stringify(terms, null, 2);
  }

  // Markdown format
  const lines: string[] = [];
  lines.push(`# ${category}`);
  lines.push('');
  lines.push(`*${terms.length} terms*`);
  lines.push('');

  for (const term of terms) {
    lines.push(`## ${term.acronym}`);
    lines.push('');
    lines.push(`**${term.name}**`);
    lines.push('');

    if (term.description) {
      lines.push(term.description);
      lines.push('');
    }

    if (term.links && term.links.length > 0) {
      lines.push('**Links:**');
      for (const link of term.links) {
        lines.push(`- [${link.description}](${link.url})`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export a simple list of all acronyms
 */
export function exportAcronymList(): string {
  const terms = getAllTerms();
  return terms.map(t => `${t.acronym}: ${t.name}`).join('\n');
}

/**
 * Export as CSV format
 */
export function exportToCsv(): string {
  const terms = getAllTerms();

  const headers = ['Acronym', 'Name', 'Description', 'Category', 'Owner', 'Related Terms', 'Links'];
  const lines: string[] = [headers.join(',')];

  for (const term of terms) {
    const row = [
      escapeCsv(term.acronym),
      escapeCsv(term.name),
      escapeCsv(term.description || ''),
      escapeCsv(term.category),
      escapeCsv(term.owner || ''),
      escapeCsv(term.relatedTerms?.join('; ') || ''),
      escapeCsv(term.links?.map(l => l.url).join('; ') || ''),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Escape a value for CSV
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
