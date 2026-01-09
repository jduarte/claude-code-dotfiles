---
description: "Comprehensive ADD review using specialized agents"
argument-hint: "[confluence-url] [agents...] [--sequential]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task", "WebFetch", "mcp__atlassian__confluence_get_page", "mcp__atlassian__confluence_get_comments", "mcp__atlassian__confluence_get_labels", "mcp__atlassian__confluence_get_page_children", "mcp__atlassian__jira_get_issue", "mcp__atlassian__jira_search", "mcp__github__get_file_contents", "mcp__github__search_code"]
---

# Comprehensive ADD Review

Run a comprehensive Architecture Design Document (ADD) review using multiple specialized agents, each focusing on a different aspect of the ADD.

**Arguments:** "$ARGUMENTS"

## Review Workflow

### 1. Parse Arguments

Extract from arguments:
- **Confluence URL or Page ID**: Required - the ADD to review
- **Agent selection**: Optional - specific agents to run (default: all)
- **Execution mode**: `--sequential` for one-at-a-time (default: parallel)

URL formats supported:
- Full URL: `https://salsify.atlassian.net/wiki/spaces/ENG/pages/123456789/...`
- Short URL: `https://salsify.atlassian.net/wiki/x/ABC123`
- Page ID: `123456789`

### 2. Fetch ADD Content

Use `mcp__atlassian__confluence_get_page` to retrieve:
- Page content (body.storage or body.view format)
- Page metadata (title, version, lastModified)

Also fetch comments using `mcp__atlassian__confluence_get_comments`.

### 3. Fetch Referenced Documents (Context Loading)

**IMPORTANT:** Before running agents, attempt to load additional context:

1. **Extract all links** from the ADD content:
   - Confluence pages (can be fetched via MCP)
   - Jira tickets (can be fetched via MCP)
   - Google Docs (note as inaccessible, suggest user paste content)
   - GitHub links (can be fetched via MCP if configured)

2. **Fetch accessible references:**
   - Use `mcp__atlassian__confluence_get_page` for linked Confluence pages
   - Use `mcp__atlassian__jira_get_issue` for referenced Jira tickets
   - Use `WebFetch` for public URLs if needed

3. **Note inaccessible references:**
   - Google Docs require authentication - note the title and suggest alternatives
   - Private repos - note and suggest user provide content

4. **Load Salsify glossary:**
   - Reference `references/salsify-terms.md` for term definitions
   - Don't ask about terms already defined in the glossary

### 4. Detect Current Stage

Analyze the ADD to determine current stage:
- **Context**: Problem, Motivation, Constraints, Requirements defined
- **Options Analysis**: Options evaluated, decision made
- **Solution Design**: Technical design documented

Detection signals:
- Checkpoint section completion status
- Content presence vs placeholder text
- Reviewer approval checkboxes

### 5. Available Review Agents

| Agent | Shortcut | Focus |
|-------|----------|-------|
| format-compliance-reviewer | `format` | ADD template structure and process adherence |
| engineering-exhaustiveness-reviewer | `engineering` | Technical depth and Salsify-specific validity |
| comment-discussion-analyzer | `comments` | Confluence page comments and discussions |
| reviewer-status-tracker | `reviewers` | Reviewer engagement and approval status |
| cross-reference-validator | `refs` | Links, references, and metadata integrity |
| security-compliance-reviewer | `security` | Security and compliance considerations |
| implementation-readiness-analyzer | `readiness` | Readiness to transition to implementation |

### 6. Determine Applicable Agents

**Default (all):** Run all 7 agents in parallel

**By stage:**
- **Context stage**: format, engineering, comments, reviewers, refs, security
- **Options Analysis**: All agents
- **Solution Design**: All agents (readiness especially important)

**User selection:** Run only specified agents
```
/salsify-review-add <url> format engineering    # Only these two
/salsify-review-add <url> comments reviewers    # Quick status check
```

### 7. Launch Review Agents

**Parallel execution (default):**
Launch all applicable agents simultaneously using the Task tool. Each agent receives:
- ADD page content
- Current detected stage
- Page metadata (ID, title, URL)
- Loaded context from referenced documents
- Salsify glossary reference

**Sequential execution (`--sequential`):**
Launch agents one at a time, useful for:
- Debugging agent output
- Interactive review sessions
- Bandwidth-limited environments

### 8. Aggregate Results

After all agents complete, aggregate findings into the final report format below.

### 9. Present Final Report

```markdown
# ADD Review Summary

**Document:** [ADD Title](confluence-url)
**Stage:** [Context | Options Analysis | Solution Design]
**Readiness:** [Ready for approval | Needs work | Blocked]

---

## Options Evaluated

(Include this section for Options Analysis and Solution Design stages)

| Option | Decision | Summary |
|--------|----------|---------|
| [Option 1] | Chosen/Rejected | [1-line summary of what it is] |
| [Option 2] | Chosen/Rejected | [1-line summary] |
| [Option 3] | Chosen/Rejected | [1-line summary] |

**Chosen Approach:** [Name of chosen option]
**Rationale:** [1-2 sentence summary of why]

### Sub-decisions (if any)
- **[Category]:** [Choice] (over [alternatives])
- **[Category]:** [Choice] (over [alternatives])

---

## Key Discussion Threads

(Summarize the most important discussions from comments)

### 1. [Topic Name]
**Participants:** [Names]
**Summary:** [2-3 sentences capturing the discussion]
**Status:** [Resolved | Pending | Deferred]
**Link:** [Direct Confluence link with focusedCommentId]

### 2. [Topic Name]
...

---

## Critical Issues (X found)

| Agent | Issue | Action Required | Link |
|-------|-------|-----------------|------|
| [agent] | [Issue description] | [specific action] | [link if applicable] |

---

## Important Issues (X found)

| Agent | Issue | Link |
|-------|-------|------|
| [agent] | [Issue description] | [link] |

---

## Questions for Author (X questions)

From engineering-exhaustiveness-reviewer:

### Term Clarification
1. [Question about unclear term] - (Note: check if term is in salsify-terms.md first)

### Architecture Questions
1. [Question about architecture decision]

### Assumption Questions
1. [Question about stated assumption]

---

## Unresolved Comments (X threads)

| From | Summary | Status | Link |
|------|---------|--------|------|
| [Name] | [Summary of concern] | Awaiting response | [View →](url) |

---

## Reviewer Status

| Stage | Input | Agree | Status |
|-------|-------|-------|--------|
| Context | [names] | [names] | Complete/Pending |
| Options Analysis | [names] | [names] | Complete/Pending |
| Solution Design | [names] | [names] | Not Started/Complete/Pending |

**Blocking:** [Name of person whose approval is blocking, if any]

---

## Suggestions (X found)

| Agent | Suggestion |
|-------|------------|
| [agent] | [Suggestion] |

---

## Strengths

- [What's done well]
- [What's done well]

---

## Context Loading Notes

**Successfully loaded:**
- [List of Confluence pages, Jira tickets fetched]

**Could not load (require authentication):**
- [PDR Title](google-doc-url) - Google Doc, suggest pasting content
- [Other inaccessible references]

**Terms from glossary used:**
- [List any Salsify-specific terms that were referenced from the glossary]

---

## Recommended Actions

Priority order:

1. **[Critical]** [Action] - [Link if applicable]
2. **[Critical]** [Action]
3. **[Important]** [Action]
4. **[Suggestion]** [Action]

---

## Quick Links

- **ADD:** [Title](confluence-url)
- **Catalog Entry:** [Link](catalog-url)
- **Jira Ticket:** [TICKET-123](jira-url)
- **Options Analysis:** [Section Link](url#Options-Analysis)
- **Solution Design:** [Section Link](url#Solution-Design)
```

## URL Construction Reference

When generating links in the report:

```
# Confluence page
https://salsify.atlassian.net/wiki/spaces/ENG/pages/{PAGE_ID}

# Confluence page with focused comment
https://salsify.atlassian.net/wiki/spaces/ENG/pages/{PAGE_ID}?focusedCommentId={COMMENT_ID}

# Confluence page section (use heading text as anchor, kebab-case)
https://salsify.atlassian.net/wiki/spaces/ENG/pages/{PAGE_ID}#Options-Analysis

# Jira ticket
https://salsify.atlassian.net/browse/{TICKET_KEY}

# ADD Catalog entry
https://salsify.atlassian.net/wiki/spaces/ENG/database/{CATALOG_ID}?entryId={ENTRY_ID}
```

## Usage Examples

**Full review (default - parallel):**
```
/salsify-review-add https://salsify.atlassian.net/wiki/spaces/ENG/pages/123456789
```

**Specific agents:**
```
/salsify-review-add <url> format engineering
# Reviews only format compliance and engineering exhaustiveness

/salsify-review-add <url> comments reviewers
# Quick check on discussions and reviewer status

/salsify-review-add <url> security readiness
# Focus on security and implementation readiness
```

**Sequential review:**
```
/salsify-review-add <url> --sequential
# Runs all agents one at a time
```

**Page ID only:**
```
/salsify-review-add 123456789
# Works with just the numeric page ID
```

## Agent Descriptions

**format-compliance-reviewer:**
- Validates ADD template structure
- Checks checkpoint completion
- Verifies required sections exist
- Validates reviewer setup

**engineering-exhaustiveness-reviewer:**
- Evaluates technical depth
- Validates Salsify-specific patterns
- Questions assumptions
- Batches clarifying questions at end
- References salsify-terms.md glossary

**comment-discussion-analyzer:**
- Retrieves all page comments
- Identifies unresolved discussions
- Tracks blocking feedback
- Groups by thread with action items
- **Generates direct links to comments**
- **Provides discussion summaries**

**reviewer-status-tracker:**
- Parses Input/Agree checkboxes
- Identifies missing reviewers
- Flags stale approvals
- Recommends follow-up actions

**cross-reference-validator:**
- Validates Jira ticket links
- Checks catalog entry
- Verifies ADR references
- Checks tag format
- **Attempts to fetch referenced documents**

**security-compliance-reviewer:**
- Scans for security keywords
- Checks if security review needed
- Validates compliance docs
- Flags potential security gaps

**implementation-readiness-analyzer:**
- Checks ADR status
- Validates implementation plan
- Verifies success criteria
- Evaluates monitoring planning

## Tips

- **Run early**: Review ADD as you write, not just at the end
- **Address critical first**: Fix blockers before moving to suggestions
- **Re-run after updates**: Verify issues are resolved
- **Use focused reviews**: Target specific agents when you know the concern
- **Check comments regularly**: Use `comments reviewers` for quick status
- **Paste Google Doc content**: If PDR or other Google Docs are referenced, paste content when prompted

## Notes

- Agents run autonomously and return detailed reports
- Each agent focuses on its specialty for deep analysis
- Results include specific references to ADD sections with direct links
- Agents use Confluence and Jira MCP tools for validation
- All agents reference the Salsify glossary for terminology
- All agents are defined in `/agents` directory
