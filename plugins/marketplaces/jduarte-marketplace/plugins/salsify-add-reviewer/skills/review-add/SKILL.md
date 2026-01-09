---
name: salsify-review-add
description: This skill should be used when the user asks to "review ADD", "review architecture design document", "check my ADD", "review my design document", "/review-add", "ADD feedback", or needs feedback on a Salsify Architecture Design Document. It analyzes ADDs against Salsify's official template guidelines and provides structured feedback.
version: 1.0.0
---

# Architecture Design Document Review Skill

This skill reviews Salsify Architecture Design Documents (ADDs) and provides comprehensive feedback based on the official ADD template guidelines.

## Input Handling

When the user provides an ADD to review, extract the Confluence page identifier:

1. **Full URL**: Extract page ID from URLs like `https://salsify.atlassian.net/wiki/spaces/ENG/pages/123456789/Page+Title` → page ID is `123456789`
2. **Short URL**: Extract from `https://salsify.atlassian.net/wiki/x/ABC123` format
3. **Direct ID**: Use numeric ID directly if provided (e.g., "review ADD 123456789")

Use `mcp__atlassian__confluence_get_page` with the extracted page ID to retrieve the document content.

## Stage Detection

ADDs have three stages. Detect the current stage by analyzing:

1. **Checkpoint completion**: Look for checkbox patterns in each stage's "Checkpoint" section
2. **Content presence**: Check if sections have substantive content vs placeholder text
3. **Review status**: Look for "Input" and "Agree" reviewer checkboxes

**Stage determination logic:**
- **Context stage**: If Context section has content but Options Analysis is empty/placeholder
- **Options Analysis stage**: If Options Analysis has content but Solution Design is empty/placeholder
- **Solution Design stage**: If Solution Design section has substantive content
- **Completed**: If all stages have content and final checkpoint items are checked

## Review Workflow

1. **Fetch the document** using Confluence MCP tool
2. **Detect current stage** using the algorithm above
3. **Load review criteria** from `references/review-criteria.md`
4. **Load custom rules** from `config/custom-rules.json` if present
5. **Analyze each applicable section** against criteria
6. **Generate output** in the three required formats

## Review Scope

- **Primary focus**: Current detected stage (thorough review)
- **Secondary**: Prior stages (check for incomplete items, unaddressed concerns)
- **Cross-cutting**: Always check catalog hygiene, tags, links, reviewer setup

## Output Format

Always provide feedback in THREE sections:

### 1. Executive Summary

```
## Executive Summary

**Document**: [Title]
**Current Stage**: [Context | Options Analysis | Solution Design]
**Readiness**: [Ready for Review | Needs Work | Blocked]

### Top Concerns
1. [Most critical issue]
2. [Second critical issue]
3. [Third critical issue]

### Strengths
- [What's done well]
- [Another strength]
```

### 2. Structured Report

Organize by section with status and findings:

```
## Structured Report

### Context Stage
**Status**: [Complete | Incomplete | Missing]

| Section | Status | Findings |
|---------|--------|----------|
| Problem | ... | ... |
| Motivation | ... | ... |
| Constraints | ... | ... |
| Requirements | ... | ... |
| Next Steps | ... | ... |

**Recommendations:**
- [Specific recommendation]

### Options Analysis Stage
[Same format...]

### Solution Design Stage
[Same format...]

### Cross-Cutting Concerns
| Item | Status | Notes |
|------|--------|-------|
| Catalog entry | ... | ... |
| Jira link | ... | ... |
| Tags | ... | ... |
| Reviewer setup | ... | ... |
```

### 3. Inline Suggestions

Provide specific, actionable feedback:

```
## Inline Suggestions

### Context
- **Problem section**: Consider clarifying [specific aspect] for reviewers unfamiliar with [domain]
- **Constraints**: Missing timeline constraints - add expected delivery date if applicable

### Options Analysis
- **Option 2**: Cost estimate missing - add relative sizing (S/M/L/XL)
- **Decision rationale**: Strengthen why Option 1 was chosen over Option 3

### Solution Design
- **Technical Design**: Consider adding a diagram for [complex interaction]

### Metadata
- **Tags**: Use `lower-kebab-case` format - change "TargetSchemas" to "target-schemas"
```

## Key Review Criteria Summary

Reference `references/review-criteria.md` for the full checklist. Key areas:

### Context Stage
- Problem understandable to unfamiliar reviewers
- Clear motivation (why now?)
- Constraints and assumptions documented
- Requirements listed
- Options brainstormed (not decided)
- Appropriate Input/Agree reviewers identified

### Options Analysis Stage
- All Context options explored
- Trade-offs documented per option
- Cost estimates provided (relative sizing OK)
- Clear decision with rationale
- Rejected options explained

### Solution Design Stage
- Technical design at appropriate detail
- Trade-offs, risks, assumptions documented
- Alternatives within chosen solution explored
- Clear next steps (ADRs? Implementation?)

### Cross-Cutting
- Catalog entry linked and metadata current
- Jira ticket linked
- Tags in `lower-kebab-case` plural format
- Reviewer lists populated appropriately

## Custom Rules

Check `config/custom-rules.json` for any additional team-specific rules. Apply these alongside standard criteria, noting their source in findings.

## Important Guidelines

1. **Be constructive**: Focus on improvement, not criticism
2. **Be specific**: Point to exact sections/text needing attention
3. **Respect stage**: Don't demand Solution Design detail during Context review
4. **Acknowledge progress**: Note what's done well, not just issues
5. **Prioritize**: Focus on blockers first, then improvements, then suggestions
