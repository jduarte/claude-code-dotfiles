## Salsify

For Salsify context, when you encounter acronyms or terms you don't recognize in a codebase or document, use the `search` tool from the salsify-glossary MCP server to find definitions. The tool accepts either a single query or an array of queries. If unsure whether something is a company-specific term, look it up - it's better to check than to guess.

## Atlassian Access (Jira & Confluence)

When the Atlassian MCP server is unavailable or when asked to use curl for Jira/Confluence, use the Atlassian REST APIs directly via curl. Authentication credentials are available as env vars.

### Env vars
- `JIRA_URL` / `JIRA_USERNAME` / `JIRA_API_TOKEN`
- `CONFLUENCE_URL` / `CONFLUENCE_USERNAME` / `CONFLUENCE_API_TOKEN`

### Jira examples

```bash
# Get issue
curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" "$JIRA_URL/rest/api/3/issue/{issueKey}" | jq .

# Search with JQL
curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" -G --data-urlencode "jql={query}" "$JIRA_URL/rest/api/3/search" | jq .

# Add comment to issue
curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"body":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Comment text"}]}]}}' \
  "$JIRA_URL/rest/api/3/issue/{issueKey}/comment" | jq .
```

### Confluence examples

```bash
# Search pages by CQL
curl -s -u "$CONFLUENCE_USERNAME:$CONFLUENCE_API_TOKEN" -G --data-urlencode "cql={query}" "$CONFLUENCE_URL/rest/api/content/search" | jq .

# Get page content by ID
curl -s -u "$CONFLUENCE_USERNAME:$CONFLUENCE_API_TOKEN" "$CONFLUENCE_URL/rest/api/content/{pageId}?expand=body.storage" | jq .

# Get page by space key and title
curl -s -u "$CONFLUENCE_USERNAME:$CONFLUENCE_API_TOKEN" -G --data-urlencode "title={pageTitle}" "$CONFLUENCE_URL/rest/api/content?spaceKey={SPACE}&expand=body.storage" | jq .
```
