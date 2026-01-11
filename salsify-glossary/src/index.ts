#!/usr/bin/env node
/**
 * Salsify Glossary MCP Server
 *
 * Provides company acronym and term lookup functionality to Claude Code
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getDatabase, closeDatabase } from './database.js';
import { startFileWatcher, stopFileWatcher, glossaryFileExists } from './sync.js';
import {
  toolSearch,
  toolListByCategory,
  toolListCategories,
  getToolDefinitions,
} from './tools.js';

// Initialize server
const server = new Server(
  {
    name: 'salsify-glossary',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getToolDefinitions(),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'search': {
        const query = (args as { query: string | string[] }).query;
        if (!query || (typeof query !== 'string' && !Array.isArray(query))) {
          throw new Error('query parameter is required (string or array of strings)');
        }
        result = toolSearch(query);
        break;
      }

      case 'list_by_category': {
        const category = (args as { category: string }).category;
        if (!category || typeof category !== 'string') {
          throw new Error('category parameter is required');
        }
        result = toolListByCategory(category);
        break;
      }

      case 'list_categories': {
        result = toolListCategories();
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Main entry point
async function main() {
  // Check if glossary file exists
  if (!glossaryFileExists()) {
    console.error('Warning: Glossary file not found. The server will start but lookups will fail.');
    console.error('Create a glossary.json file in ~/.claude/salsify-glossary/data/');
  }

  // Initialize database
  getDatabase();

  // Start file watcher for live sync
  startFileWatcher((result) => {
    if (result.errors.length > 0) {
      console.error('Sync errors:', result.errors);
    }
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    stopFileWatcher();
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopFileWatcher();
    closeDatabase();
    process.exit(0);
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Salsify Glossary MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
