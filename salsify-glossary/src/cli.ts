#!/usr/bin/env node
/**
 * Salsify Glossary CLI
 *
 * Command-line interface for managing and querying the glossary
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';

import { getDatabase, closeDatabase, getTermCount } from './database.js';
import { search } from './search.js';
import { getAuditStats, getDailyActivity } from './audit.js';
import {
  performSync,
  validateGlossary,
  loadGlossaryFile,
  addTermToFile,
  getGlossaryPath,
} from './sync.js';
import { exportToMarkdown, exportToJson, exportToCsv } from './export.js';
import { getCategories, getTermsByCategory, getAllTerms } from './database.js';
import { Term } from './types.js';

const program = new Command();

program
  .name('salsify-glossary')
  .description('Salsify Glossary CLI - Manage and query company acronyms')
  .version('1.0.0');

// Search command (unified search combining exact match, full-text search, and fuzzy matching)
program
  .command('search <query>')
  .description('Search the glossary for acronyms or terms (supports exact match, full-text search, and fuzzy matching)')
  .action((query: string) => {
    getDatabase();
    performSync();

    const result = search(query);

    // Exact match found
    if (result.exactMatch) {
      printTerm(result.exactMatch);
      closeDatabase();
      return;
    }

    // No results at all
    if (result.totalCount === 0) {
      if (result.suggestion) {
        const suggestionResult = search(result.suggestion.acronym);
        if (suggestionResult.exactMatch) {
          console.log(chalk.yellow(`Term "${query}" not found.`));
          console.log(chalk.cyan(`Did you mean "${result.suggestion.acronym}"?\n`));
          printTerm(suggestionResult.exactMatch);
          closeDatabase();
          return;
        }
      }
      console.log(chalk.red(`No terms found matching "${query}".`));
      closeDatabase();
      return;
    }

    // Multiple results from search
    if (result.suggestion && result.suggestion.acronym !== result.terms[0]?.acronym) {
      console.log(chalk.cyan(`Did you mean "${result.suggestion.acronym}"?\n`));
    }

    console.log(chalk.green(`Found ${result.terms.length} term(s):\n`));

    for (const term of result.terms) {
      printTerm(term);
      console.log('');
    }

    closeDatabase();
  });

// List command
program
  .command('list')
  .description('List all terms, optionally filtered by category')
  .option('-c, --category <category>', 'Filter by category')
  .action((options: { category?: string }) => {
    getDatabase();
    performSync();

    let terms: Term[];

    if (options.category) {
      terms = getTermsByCategory(options.category);
      if (terms.length === 0) {
        console.log(chalk.yellow(`No terms found in category "${options.category}"`));
        const categories = getCategories();
        console.log(chalk.cyan('Available categories: ' + categories.map(c => c.category).join(', ')));
        closeDatabase();
        return;
      }
      console.log(chalk.green(`\n${options.category} (${terms.length} terms)\n`));
    } else {
      terms = getAllTerms();
      console.log(chalk.green(`\nAll Terms (${terms.length})\n`));
    }

    for (const term of terms) {
      console.log(chalk.bold(term.acronym) + ': ' + term.name);
    }

    closeDatabase();
  });

// Categories command
program
  .command('categories')
  .description('List all categories with term counts')
  .action(() => {
    getDatabase();
    performSync();

    const categories = getCategories();

    if (categories.length === 0) {
      console.log(chalk.yellow('No categories found.'));
      closeDatabase();
      return;
    }

    console.log(chalk.green('\nGlossary Categories\n'));

    for (const cat of categories) {
      console.log(`  ${chalk.bold(cat.category)}: ${cat.count} term(s)`);
    }

    const total = categories.reduce((sum, c) => sum + c.count, 0);
    console.log(chalk.dim(`\nTotal: ${total} terms across ${categories.length} categories`));

    closeDatabase();
  });

// Add command
interface AddTermAnswers {
  acronym: string;
  name: string;
  description: string;
  categoryChoice: string;
  newCategory?: string;
  owner: string;
  relatedTerms: string;
}

program
  .command('add')
  .description('Interactively add a new term to the glossary')
  .action(async () => {
    getDatabase();

    const categories = getCategories();
    const existingCategories = categories.map(c => c.category);

    const answers = await inquirer.prompt<AddTermAnswers>([
      {
        type: 'input',
        name: 'acronym',
        message: 'Acronym:',
        validate: (input: string) => input.length > 0 || 'Acronym is required',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Full name:',
        validate: (input: string) => input.length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
      },
      {
        type: 'list',
        name: 'categoryChoice',
        message: 'Category:',
        choices: [...existingCategories, new inquirer.Separator(), 'Create new category'],
      },
      {
        type: 'input',
        name: 'newCategory',
        message: 'New category name:',
        when: (ans) => ans.categoryChoice === 'Create new category',
        validate: (input: string) => input.length > 0 || 'Category name is required',
      },
      {
        type: 'input',
        name: 'owner',
        message: 'Owner (optional):',
      },
      {
        type: 'input',
        name: 'relatedTerms',
        message: 'Related terms (comma-separated, optional):',
      },
    ]);

    const term: Term = {
      acronym: answers.acronym.toUpperCase(),
      name: answers.name,
      description: answers.description || undefined,
      category: answers.newCategory || answers.categoryChoice,
      owner: answers.owner || undefined,
      relatedTerms: answers.relatedTerms
        ? answers.relatedTerms.split(',').map((t: string) => t.trim().toUpperCase())
        : undefined,
    };

    const result = addTermToFile(term);

    if (result.success) {
      console.log(chalk.green(`\nSuccessfully added "${term.acronym}" to the glossary!`));
    } else {
      console.log(chalk.red(`\nFailed to add term: ${result.error}`));
    }

    closeDatabase();
  });

// Export command
program
  .command('export')
  .description('Export the glossary to a file')
  .option('-f, --format <format>', 'Output format: md, json, csv', 'md')
  .option('-o, --output <file>', 'Output file path')
  .action((options: { format: string; output?: string }) => {
    getDatabase();
    performSync();

    let content: string;
    let extension: string;

    switch (options.format.toLowerCase()) {
      case 'json':
        content = exportToJson();
        extension = 'json';
        break;
      case 'csv':
        content = exportToCsv();
        extension = 'csv';
        break;
      case 'md':
      case 'markdown':
      default:
        content = exportToMarkdown();
        extension = 'md';
        break;
    }

    if (options.output) {
      fs.writeFileSync(options.output, content, 'utf-8');
      console.log(chalk.green(`Exported to ${options.output}`));
    } else {
      console.log(content);
    }

    closeDatabase();
  });

// Sync command
program
  .command('sync')
  .description('Manually sync JSON file to SQLite database')
  .action(() => {
    getDatabase();

    console.log(chalk.cyan('Syncing glossary...'));
    const result = performSync();

    if (result.errors.length > 0) {
      console.log(chalk.red('Sync errors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
    } else {
      console.log(chalk.green(`Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`));
    }

    closeDatabase();
  });

// Audit command
program
  .command('audit')
  .description('Show lookup statistics and audit log analysis')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .action((options: { days: string }) => {
    getDatabase();

    const days = parseInt(options.days, 10);
    const stats = getAuditStats(days);
    const activity = getDailyActivity(Math.min(days, 14));

    console.log(chalk.green(`\nAudit Statistics (last ${days} days)\n`));

    console.log(`  Total lookups: ${stats.totalLookups}`);
    console.log(`  Unique terms queried: ${stats.uniqueTerms}`);
    console.log(`  Not found: ${stats.notFoundCount}`);

    if (stats.topQueries.length > 0) {
      console.log(chalk.cyan('\nTop Queries:'));
      for (const q of stats.topQueries.slice(0, 5)) {
        console.log(`  ${q.query}: ${q.count} time(s)`);
      }
    }

    if (stats.notFoundQueries.length > 0) {
      console.log(chalk.yellow('\nNot Found (candidates for new terms):'));
      for (const q of stats.notFoundQueries.slice(0, 5)) {
        console.log(`  ${q.query}: ${q.count} time(s)`);
      }
    }

    if (activity.length > 0) {
      console.log(chalk.cyan('\nDaily Activity:'));
      for (const day of activity.slice(0, 7)) {
        console.log(`  ${day.date}: ${day.count} lookup(s)`);
      }
    }

    closeDatabase();
  });

// Validate command
program
  .command('validate')
  .description('Validate the glossary JSON file against the schema')
  .action(() => {
    const data = loadGlossaryFile();

    if (!data) {
      console.log(chalk.red(`Could not load glossary file from ${getGlossaryPath()}`));
      process.exit(1);
    }

    const result = validateGlossary(data);

    if (result.valid) {
      console.log(chalk.green('Glossary is valid!'));
      console.log(chalk.dim(`${data.terms.length} terms found`));
    } else {
      console.log(chalk.red('Validation errors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show glossary status and statistics')
  .action(() => {
    getDatabase();
    performSync();

    const termCount = getTermCount();
    const categories = getCategories();

    console.log(chalk.green('\nSalsify Glossary Status\n'));
    console.log(`  Glossary file: ${getGlossaryPath()}`);
    console.log(`  Total terms: ${termCount}`);
    console.log(`  Categories: ${categories.length}`);

    if (categories.length > 0) {
      console.log(chalk.cyan('\nTerms by category:'));
      for (const cat of categories) {
        console.log(`  ${cat.category}: ${cat.count}`);
      }
    }

    closeDatabase();
  });

/**
 * Print a term with formatting
 */
function printTerm(term: Term): void {
  console.log(chalk.bold.blue(term.acronym) + ': ' + chalk.bold(term.name));

  if (term.description) {
    console.log(chalk.dim(term.description));
  }

  console.log(chalk.gray(`Category: ${term.category}`));

  if (term.owner) {
    console.log(chalk.gray(`Owner: ${term.owner}`));
  }

  if (term.relatedTerms && term.relatedTerms.length > 0) {
    console.log(chalk.gray(`Related: ${term.relatedTerms.join(', ')}`));
  }

  if (term.links && term.links.length > 0) {
    console.log(chalk.cyan('Links:'));
    for (const link of term.links) {
      console.log(chalk.cyan(`  - ${link.description}: ${link.url}`));
    }
  }
}

// Parse arguments and run
program.parse();
