---
description: "Extract and analyze a peer's work contributions for feedback assessments"
argument-hint: "<peer-name> [--months N] [--from YYYY-MM-DD --to YYYY-MM-DD] [--agents github,jira,confluence,gdrive,slack] [--c2 <filepath>] [--sequential] [--no-cache]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task", "mcp__atlassian__jira_search", "mcp__atlassian__confluence_search", "mcp__gdrive__search", "mcp__slack__slack_search_messages", "mcp__slack__slack_list_conversations", "mcp__slack__slack_get_full_conversation", "mcp__slack__slack_users_info", "mcp__slack__slack_get_thread"]
---

# Peer Work Extract

Extract and analyze a peer's work contributions across GitHub, Jira, Confluence, Google Drive, and Slack for peer feedback assessments.

**Arguments:** "$ARGUMENTS"

## Workflow

### 1. Parse Arguments

Extract from arguments:
- **Peer name**: Required - name to look up in `config/peers.json`
- **Date range**: One of:
  - `--months N` — last N months (default: 3)
  - `--from YYYY-MM-DD --to YYYY-MM-DD` — explicit date range
- **Agent selection**: `--agents github,jira,confluence,gdrive,slack` (default: all)
- **C2 template**: `--c2 /path/to/file` — optional path to C2 competency framework file
- **Execution mode**: `--sequential` for one-at-a-time (default: parallel)
- **Cache control**: `--no-cache` to skip reading cache (still writes to cache for future runs)

If no arguments or `--help` is provided, show usage:
```
Usage: /peer-work-extract <peer-name> [options]

Options:
  --months N                   Look back N months (default: 3)
  --from YYYY-MM-DD            Start date (inclusive)
  --to YYYY-MM-DD              End date (inclusive, default: today)
  --agents github,jira,...     Comma-separated list of agents to run
  --c2 /path/to/file           Path to C2 competency framework file (MHTML, HTML, text, or markdown)
  --sequential                 Run agents one at a time instead of parallel
  --no-cache                   Skip reading cache (still writes for future runs)

Available agents: github, jira, confluence, gdrive, slack

Available peers (from config/peers.json):
  [list peer names from config]
```

### 2. Load Configuration

Read the plugin config files:
- `config/peers.json` — peer identity mappings
- `config/settings.json` — default settings

### 3. Resolve Peer

Look up the peer name in `config/peers.json`:
- Match case-insensitively against peer keys and `displayName` fields
- If not found, list available peers and ask the user to add the peer to config

A resolved peer provides:
- `displayName` — full name for the report
- `github` — GitHub username
- `jiraAccountId` — Jira account ID
- `confluenceUsername` — Confluence/Atlassian username
- `email` — email for Google Drive search
- `slackUserId` — Slack member ID
- `team` — team name for context

### 3.5. Parse C2 File (if --c2 provided)

If the `--c2` flag was provided with a file path:

1. **Read the file** using the Read tool. Supported formats: MHTML, HTML, plain text, markdown.
2. **Extract competency definitions** from the file content. Look for:
   - Competency names (e.g., Craftsmanship, Productivity, Problem Solving, Engineering Judgement, Technical Direction, SDLC, Communication, Continuous Improvement)
   - Description of each competency
   - Rubric levels and their criteria (typically: Building, Proficient, Advanced, Outstanding)
3. **Structure the extracted framework** as a formatted block to pass to the compiler:
   ```
   ## C2 Competency Framework

   ### {Competency Name}
   **Description:** {what this competency measures}

   **Rubric Levels:**
   - **Building:** {criteria text}
   - **Proficient:** {criteria text}
   - **Advanced:** {criteria text}
   - **Outstanding:** {criteria text}

   {Repeat for each competency}
   ```
4. **If the file can't be read or parsed**, warn the user and continue without C2 mapping:
   ```
   > ⚠️ Could not read/parse C2 file at {path}. Continuing without C2 competency mapping.
   ```

### 4. Calculate Date Range

- If `--from` and `--to` provided: use those dates directly
- If `--months N` provided: from = today minus N months, to = today
- Default: from = today minus 3 months, to = today

### 5. Determine Agents to Run

**Default (all):** github, jira, confluence, gdrive, slack

**User selection:** `--agents github,jira` runs only those two

Map agent names to agent files:
| Short Name | Agent | Requires |
|------------|-------|----------|
| `github` | github-activity-analyzer | `github` field in peer config |
| `jira` | jira-contribution-analyzer | `jiraAccountId` field in peer config |
| `confluence` | confluence-contribution-analyzer | `confluenceUsername` field in peer config |
| `gdrive` | gdrive-document-analyzer | `email` field in peer config |
| `slack` | slack-activity-analyzer | `slackUserId` field in peer config |

If a selected agent requires a field that's missing from the peer config, skip that agent and note it in the output.

### 6. Launch Data Agents

**Parallel execution (default):**
Launch all applicable agents simultaneously using the Task tool. Each agent receives:
- Relevant peer identifier (GitHub username, Jira account ID, etc.)
- Peer display name
- Date range (from and to dates)
- Any relevant settings from `config/settings.json`
- **Cache directory**: `<plugin-root>/cache/<peer-slug>/<source>/` where `<peer-slug>` is the peer key from `config/peers.json` lowercased with spaces replaced by hyphens, `<plugin-root>` is the absolute path to this plugin's root directory, and `<source>` is the agent short name (github, jira, confluence, gdrive, slack)
- **Cache mode**: `enabled` (default when `cache.enabled` is true in settings.json) or `disabled` (when `--no-cache` flag is set)

Example Task tool calls (launch all in parallel):

For **github-activity-analyzer**:
```
Analyze GitHub activity for <displayName> (username: <github>) in org:salsify from YYYY-MM-DD to YYYY-MM-DD. Search for PRs authored, PRs reviewed, and review comments. Provide summary stats, top PRs, repository breakdown, and cross-team contributions.

**Cache directory:** <plugin-root>/cache/<peer-slug>/github/
**Cache mode:** enabled | disabled (--no-cache)
```

For **jira-contribution-analyzer**:
```
Analyze Jira contributions for <displayName> (accountId: <jiraAccountId>) from YYYY-MM-DD to YYYY-MM-DD. Search for completed tickets, analyze by type/priority, calculate story points, and identify notable work.

**Cache directory:** <plugin-root>/cache/<peer-slug>/jira/
**Cache mode:** enabled | disabled (--no-cache)
```

For **confluence-contribution-analyzer**:
```
Analyze Confluence contributions for <displayName> (username: <confluenceUsername>) from YYYY-MM-DD to YYYY-MM-DD. Search for pages created and modified, identify ADDs, and highlight documentation work.

**Cache directory:** <plugin-root>/cache/<peer-slug>/confluence/
**Cache mode:** enabled | disabled (--no-cache)
```

For **gdrive-document-analyzer**:
```
Analyze Google Drive documents for <displayName> (email: <email>) from YYYY-MM-DD to YYYY-MM-DD. Search for documents owned, categorize by type, and highlight significant artifacts.

**Cache directory:** <plugin-root>/cache/<peer-slug>/gdrive/
**Cache mode:** enabled | disabled (--no-cache)
```

For **slack-activity-analyzer**:
```
Analyze Slack activity for <displayName> (userId: <slackUserId>) from YYYY-MM-DD to YYYY-MM-DD. Search for messages authored, channels active in, thread participation, helpfulness signals, and cross-team engagement. Provide summary stats, channel breakdown, communication patterns, and notable contributions.

**Cache directory:** <plugin-root>/cache/<peer-slug>/slack/
**Cache mode:** enabled | disabled (--no-cache)
```

**Sequential execution (`--sequential`):**
Launch agents one at a time, waiting for each to complete before starting the next. Useful for debugging or when rate limits are a concern.

### 7. Launch Feedback Compiler

After ALL data agents have completed, launch the **feedback-compiler** agent with:
- All agent outputs concatenated
- Peer metadata (displayName, team)
- Date range
- The output template from `skills/peer-work-extract/references/output-template.md`

**When C2 framework was provided (step 3.5):** Include the parsed C2 competency framework in the compiler prompt. Add the following to the compiler's input:

```
## C2 Competency Framework

The following C2 competency framework has been provided. You MUST include the "C2 Competency Mapping" section in the report, mapping evidence to each competency with rubric alignment, suggested ratings, and data gaps. Tag follow-up questions with competency names.

{parsed C2 framework content from step 3.5}
```

**When C2 framework was NOT provided:** Do not include any C2-related instructions. The compiler will still generate the "Questions for You" section but without competency tags.

The compiler synthesizes all data into a cohesive feedback report.

### 8. Present Final Report

Present the compiler's output directly to the user. The report should be ready to use for peer feedback submissions.

If any agents failed or were skipped, note this at the top:
```
> Note: The following data sources were not available: [list]
> The report is based on available data from: [list]
```

## Usage Examples

**Full extraction (default - parallel, 3 months):**
```
/peer-work-extract alex
```

**Custom time range:**
```
/peer-work-extract alex --months 6
/peer-work-extract alex --from 2024-01-01 --to 2024-06-30
```

**Specific agents only:**
```
/peer-work-extract alex --agents github,jira
# Only GitHub and Jira data
```

**With C2 competency mapping:**
```
/peer-work-extract alex --c2 ~/Downloads/c2-template.mhtml
```

**C2 mapping with custom time range:**
```
/peer-work-extract alex --months 6 --c2 ~/Documents/c2-framework.html
```

**Sequential execution:**
```
/peer-work-extract alex --sequential
```

**Single agent, short period (good for testing):**
```
/peer-work-extract alex --months 1 --agents github
```

**Single agent with C2 (good for testing C2 mapping):**
```
/peer-work-extract alex --months 1 --agents github --c2 ~/Downloads/c2-template.mhtml
```

**Re-run without cache (re-fetches all data from APIs):**
```
/peer-work-extract alex --no-cache
```

**Re-run single agent without cache:**
```
/peer-work-extract alex --agents slack --no-cache
```

## Agent Descriptions

**github-activity-analyzer:**
- Searches PRs authored and reviewed using `gh` CLI
- Analyzes code contribution patterns
- Identifies cross-team work and mentoring signals

**jira-contribution-analyzer:**
- Searches completed tickets via Jira API/MCP
- Breaks down by type, priority, story points
- Identifies notable and cross-team work

**confluence-contribution-analyzer:**
- Searches pages created and modified
- Identifies ADDs authored
- Highlights documentation contributions

**gdrive-document-analyzer:**
- Searches documents owned via Google Drive MCP
- Categorizes by type (Docs, Slides, Sheets)
- Gracefully handles MCP unavailability

**slack-activity-analyzer:**
- Searches messages authored via Slack MCP
- Analyzes channel activity, thread participation, and communication patterns
- Identifies helpfulness signals, cross-team engagement, and incident response

**feedback-compiler:**
- Synthesizes all agent outputs into cohesive narrative-driven report
- Identifies cross-source patterns and reconstructs work arcs as stories
- Maps evidence to C2 competencies when framework is provided
- Generates targeted follow-up questions to fill data gaps
- Produces structured feedback ready for submission

## Tips

- **Start with one agent**: Test with `--agents github --months 1` to verify setup
- **Add peers to config**: Edit `config/peers.json` to add peer identity mappings
- **Review the raw data**: Each agent's output is shown before the compiled report
- **Use date ranges**: For review cycles, use `--from` and `--to` matching the cycle period
- **Run early**: Don't wait until the last day of the review cycle
- **Test C2 mapping**: Run with `--agents github --months 1 --c2 <path>` to verify C2 output before a full run

## Notes

- Agents run autonomously and return detailed data summaries
- The feedback compiler requires Opus for narrative synthesis
- All data is gathered from APIs; no manual input required
- Results depend on correct peer identity mapping in config
- Google Drive requires the gdrive MCP server to be configured
- Slack requires the slack MCP server to be configured
- C2 competency mapping is optional — reports are fully functional without it
- The C2 file can be in any readable format (MHTML, HTML, markdown, plain text) as long as competency names and rubric levels can be extracted
- Follow-up questions are always generated, with or without C2; C2 just adds competency tags
