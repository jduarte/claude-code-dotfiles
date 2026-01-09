# Salsify Engineering Terms Glossary

This glossary helps the ADD review agents understand Salsify-specific terminology. When agents encounter unfamiliar terms not in this list, they should ask clarifying questions.

## Product Areas

### PXM (Product Experience Management)
Salsify's core product for managing product content and digital shelf analytics.

### DAM (Digital Asset Management)
System for managing digital assets like images, videos, and documents.

### Syndication
The process of distributing product content to various channels and retailers. Syndication depends on Target Schemas to know what data format each retailer expects.

### Digital Shelf
The online equivalent of a physical store shelf - where products appear in search and category pages.

### Channel
A destination for product data syndication. Each channel is associated with a Target Schema and represents a specific retailer/marketplace connection (e.g., Walmart, Amazon, Target).

### Connector
The code/service that handles communication with a specific retailer's systems. Connectors use Target Schemas to format data correctly for each retailer.

### Mapping
Customer-defined rules that connect their product attributes to Target Schema fields. When TS fields change, mappings can be affected (soft-deleted if field removed).

### Readiness Score
A percentage indicating how complete a product's data is relative to required Target Schema fields. Products need 100% readiness to be published.

## Target Schema Domain

### TS (Target Schema)
Salsify's canonical representation of a Retailer's product data specification. Defines what fields, data types, and values a retailer accepts.

### TS Import
The process of updating a live production Target Schema with new field definitions. Can impact existing mappings and channel readiness.

### TS Generation
The process of gathering retailer specification data (from resource files, APIs, etc.) and converting it to Target Schema JSON format. Precedes TS Import.

### TS Update
The combined process of TS Generation followed by TS Import. Can be automated or manual depending on the connector.

### TS Audit
Post-import log of changes made to a Target Schema. Available after imports complete but doesn't provide pre-import impact analysis.

### TS Diff
Comparison between two Target Schema versions showing what changed (fields added, removed, modified).

### Field
A single data point in a Target Schema (e.g., "productTitle", "price", "category"). Has properties like data type, required status, external ID.

### Field Group
A logical grouping of related fields within a Target Schema.

### Classifier / Classifier Field
A field that determines product categorization (e.g., product type, category). Changes to classifier values can affect which products are valid for syndication.

### External ID
The identifier used by the retailer for a field. Changes to external IDs can break existing mappings.

## Teams & Organizations

### NTC (Network Core)
Team responsible for Target Schema infrastructure, syndication core systems, and connector frameworks. Stewards many direct connections.

### TSR (Target Schema Registry)
Team/system responsible for managing Target Schema definitions. (Note: May also refer to the registry itself - context dependent)

### Ecosystem
Broader organization encompassing teams that work on retailer connections, syndication, and content distribution.

### BPA (Business Process Analyst)
Non-engineering role that helps operate and validate Target Schema updates. Part of the "Operator" persona for TS tooling.

### Operator
Umbrella term for anyone who operates TS tooling: Engineers, BPAs, PMs, Support staff. Different operators have different technical skill levels.

## Architecture & Services

### Dandelion
Salsify's main monolithic Rails application. Contains Target Schema models, admin interfaces, and much of the syndication logic.

### Eng Admin Pages
Internal admin interface within Dandelion for engineering operations. Located at paths like `/admin/dandelion/...`.

### Temporal
Durable workflow orchestration platform. Being adopted at Salsify for complex, long-running processes. Provides better observability and retry handling than Delayed Jobs.

### Delayed Job
Background job library currently used at Salsify. Being migrated to Temporal for complex workflows.

### Core
The foundational services and libraries that underpin Salsify's platform. Core teams own shared infrastructure and data models.

### Growth
Teams focused on customer acquisition, onboarding, and product-led growth initiatives.

### Platform
Infrastructure and tooling teams that support development across Salsify.

## Processes

### ADD (Architecture Design Document)
A formal document for proposing and documenting significant architectural decisions. Has three stages:
1. **Context** - Define problem, constraints, and requirements
2. **Options Analysis** - Evaluate and choose between options
3. **Solution Design** - Detail the chosen solution

### ADR (Architecture Decision Record)
Lightweight documentation of a single architectural decision. More granular than ADDs, used for specific API or schema changes.

### PDR (Product Design Review)
Separate process for product/design decisions. Owned by PM and Design. Technical ADDs should reference PDRs when relevant but PM/Design should use PDRs, not be Agree reviewers on technical ADDs.

### Catalog (ADD Catalog)
The central registry of all Architecture Design Documents at Salsify. Each ADD should have a catalog entry with metadata like stage, status, Jira link, and tags.

### Input Reviewer
Someone who provides feedback on an ADD but doesn't have blocking approval authority.

### Agree Reviewer
Someone who must approve the ADD for it to progress. Their checkbox must be checked to complete a stage.

### Checkpoint
Section at the end of each ADD stage verifying process requirements are met (catalog entry, reviewers, etc.).

## Infrastructure & Tools

### Engineering Portal
Backstage-powered internal developer platform for service discovery, documentation, and tooling.

### TechDocs
MkDocs-based documentation system integrated with the Engineering Portal.

### New Relic
Application performance monitoring (APM) tool used at Salsify.

### Feature Flags
System for controlling feature rollout. Used for gradual deployment and A/B testing.

### target-schema-semantic-diff
GitHub tool for comparing Target Schemas. Outputs detailed diffs but can be overwhelming for large schemas.

## Retailers & Connectors (Examples)

### Walmart
Major retailer with complex Target Schema. Updates quarterly with many changes. Walmart OmniSpec is one specific connector type.

### Amazon
Retailer with automated TS update notifications via Amazon SQS.

### Direct Connections
Connectors managed directly by Salsify (often NTC team) rather than through intermediary platforms.

## Common Patterns

### Kebab-case Tags
Tags in the ADD catalog should be `lower-kebab-case` format (e.g., `target-schemas`, not `targetSchemas` or `target_schema`).

### Pre-signed URL
Time-limited URL for accessing private resources (like S3 files) without requiring authentication. Used for report downloads.

### North Star Document
Long-term vision/strategy document. Referenced when making architectural decisions to ensure alignment with future direction.

## Known Incidents

### Walmart OmniSpec PCR Incident (September 2025)
A faulty TS Update removed a required field (`productId`) which went unnoticed during manual review. Caused ~175 publication failures across 55 organizations. Key motivator for TS Import Impact Analysis initiative.

---

## Adding to This Glossary

When the engineering-exhaustiveness-reviewer encounters Salsify-specific terms not in this glossary, it will ask clarifying questions. Once clarified, those terms should be added here for future reference.

**To add a term:**
1. Identify the appropriate category (or create a new one)
2. Add the term with a clear, concise definition
3. Include context for how it relates to ADD reviews

**Terms that need clarification (discovered during reviews):**
- Add terms here as they're encountered and resolved

---

## Context Loading Notes

This glossary is automatically loaded by ADD review agents. However, agents should also attempt to:

1. **Fetch referenced documents** when accessible (Confluence pages, Jira tickets)
2. **Note inaccessible references** (Google Docs require auth) and suggest alternatives
3. **Build context incrementally** by asking clarifying questions about unfamiliar terms
4. **Reference this glossary** before asking questions about terms already defined
