---
name: peer-work-extract
description: This skill should be used when the user asks to "extract peer work", "gather peer feedback data", "peer review data", "peer contributions", "/peer-work-extract", "feedback for [name]", or needs to collect a peer's work contributions for a feedback assessment at Salsify. It automates data gathering from GitHub, Jira, Confluence, Google Drive, and Slack.
version: 1.0.0
---

# Peer Work Extract Skill

This skill extracts and analyzes a peer's work contributions across multiple data sources to support peer feedback assessments at Salsify.

## Input Handling

When the user wants to extract peer work data:

1. **Peer name**: Extract from the command arguments. Look up in `config/peers.json`
2. **Date range**: Default to last 3 months. Accept `--months N` or `--from/--to` overrides
3. **Agent selection**: Default to all agents. Accept `--agents` to limit scope
4. **Execution mode**: Default to parallel. Accept `--sequential` for one-at-a-time
5. **C2 template**: Optional `--c2 /path/to/file` pointing to a C2 competency framework file (MHTML, HTML, text, or markdown)

## Peer Resolution

Peers are defined in `config/peers.json` with identity mappings:
- `displayName` — human-readable name
- `github` — GitHub username for PR/review search
- `jiraAccountId` — Jira account ID for ticket search
- `confluenceUsername` — Confluence username for page search
- `email` — email for Google Drive document search
- `slackUserId` — Slack member ID for message search
- `team` — team name for context

Match peer name case-insensitively against both keys and displayName fields.

## Workflow

1. **Parse arguments** — extract peer name, date range, agent selection, C2 file path
2. **Load config** — read peers.json and settings.json
3. **Resolve peer** — look up identity mapping, validate required fields
3.5. **Parse C2 file** (if `--c2` provided) — read file, extract competency definitions with rubric levels, structure for compiler
4. **Launch data agents** — 5 specialized agents gather data in parallel:
   - `github-activity-analyzer` — PRs authored/reviewed via `gh` CLI
   - `jira-contribution-analyzer` — completed tickets via Jira API
   - `confluence-contribution-analyzer` — pages created/modified via Confluence API
   - `gdrive-document-analyzer` — documents owned via Google Drive MCP
   - `slack-activity-analyzer` — messages, channel activity, and communication patterns via Slack MCP
5. **Launch compiler** — `feedback-compiler` synthesizes all outputs into report (with C2 framework if provided)
6. **Present report** — narrative-driven feedback ready for submission

## Output Format

The final report follows the template in `references/output-template.md`:

### Executive Summary
Story-driven summary of contributions. Leads with the most significant narrative arc, weaves in numbers as supporting evidence.

### Contribution Narratives
3-5 major work arcs told as full case studies: context → action → impact. Each references specific artifacts (PRs, tickets, documents). Scaled to data richness.

### Thematic Highlights
Narrative-led highlights organized by theme:
- Technical Delivery
- Collaboration & Teamwork
- Leadership & Initiative
- Documentation & Knowledge Sharing
- Communication & Engagement

### Small but Meaningful Contributions
Items that demonstrate attention to detail and team citizenship, with context.

### Growth & Impact Observations
Trajectory, expanding scope, increasing complexity.

### Data Summary
Condensed metrics table for reference (supporting appendix, not centerpiece).

### C2 Competency Mapping (conditional — only when `--c2` provided)
Per-competency assessment with:
- Evidence narrative with artifact references
- Rubric alignment with quoted criteria text
- Suggested rating (Strong / Pretty Good / Could Improve)
- Justification
- Data gaps

### Questions for You (always included)
8-12 targeted, data-grounded follow-up questions in categories:
- Code Quality & Technical Judgment
- Communication & Collaboration
- Reliability & Execution
- Growth & Development
- Filling in the Gaps

When C2 is provided, questions are tagged with competency names.

## Important Guidelines

1. **Narrative-first**: Lead with stories, not statistics. Data supports narratives, not the other way around
2. **Be factual**: Every claim should trace to specific data from the agents
3. **Be constructive**: This is peer feedback, highlight strengths prominently
4. **Adaptive depth**: Scale report length and detail to data richness — don't pad thin data
5. **Connect the dots**: Link related items across sources (Jira ticket + PR + docs)
6. **Handle missing data**: If a source is unavailable, note it but don't diminish the report
7. **Respect privacy**: Only gather data from authorized sources using proper APIs
8. **Always include questions**: Follow-up questions are generated in every report to fill observability gaps
9. **C2 is optional**: Reports are fully functional without C2 mapping; it's an additive layer when provided
