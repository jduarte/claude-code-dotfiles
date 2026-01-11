# Salsify Glossary MCP Server Dockerfile
# Multi-stage build for smaller final image

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy data files (schema only - glossary.json should be mounted)
COPY data/glossary.schema.json ./data/

# Create directories for data and db
RUN mkdir -p /app/data /app/db

# Volume for glossary data and database
VOLUME ["/app/data", "/app/db"]

# Environment variables
ENV NODE_ENV=production

# Default command runs the MCP server
CMD ["node", "dist/index.js"]
