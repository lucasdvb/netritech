# netritech

## Browser / MCP tooling

This repo ships a project-scoped MCP config in [`.mcp.json`](.mcp.json) that
enables two browser-automation servers for Claude Code sessions:

| Server | Package | Use it for |
| --- | --- | --- |
| `playwright` | `@playwright/mcp` | Driving a real browser — navigate, click, fill forms, take screenshots, snapshot the accessibility tree. |
| `chrome-devtools` | `chrome-devtools-mcp` | Chrome DevTools Protocol — inspect network requests, console output, performance traces, and the live DOM/styles. |

### Notes

- Both run via `npx` (`@latest`), so no install step is required — the packages
  are fetched on first use.
- Project-scoped MCP servers require a one-time trust approval the first time
  the repo is opened in Claude Code.
- Tools appear as `mcp__playwright__*` and `mcp__chrome-devtools__*`.
- To make these available across all your repos instead, add them at user
  scope locally:
  ```sh
  claude mcp add --scope user playwright npx -- -y @playwright/mcp@latest
  claude mcp add --scope user chrome-devtools npx -- -y chrome-devtools-mcp@latest
  ```
