
# AI CLI

A terminal-first AI developer assistant with autonomous tooling, safe editing workflows, runtime permissions, and audit logging.

Inspired by tools like Claude Code, OpenCode, and modern AI developer workflows.

---

## Features

- AI chat in terminal
- Autonomous tool execution
- MCP support
- Runtime context system
- Permission manager
- Structured audit logging
- Safe file editing
- Diff previews
- Overwrite protection
- Multi-provider support
- Interactive command system
- Autonomous loop safeguards
- Session permission cache
- Backup generation


## Commands

### File Commands

- `/read`
- `/generate`
- `/edit`

### System Commands

- `/logs`
- `/clear`
- `/models`

---

## Architecture

```txt
src/
 ├── commands/
 ├── context/
 ├── permissions/
 ├── logs/
 ├── providers/
 ├── tools/
 ├── mcp/
```

---

## Installation

```bash
git clone <repo-url>
cd ai-cli
npm install
```

---

## Run

```bash
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Example Workflow

```bash
/generate app.js express server
/edit app.js add error handling
/logs
```

---

## Safety Features

* Permission approval system
* Autonomous loop limits
* Audit logging
* Overwrite protection
* Backup generation
* Dangerous command blocking
* Session-level permission caching

---

## Logging System

* Local audit logs
* Non-blocking async log queue
* Log rotation support
* Security event tracking
* `/logs tail` live monitoring
* API key redaction

---

## Future Goals

* Planning mode
* Git integration
* Session persistence
* Workspace awareness
* Better diff viewer
* Smarter project context
* Safer autonomous workflows

---

## Current Status

AI CLI is currently an advanced local-first AI developer tooling project focused on:

* safe autonomy
* developer workflows
* runtime orchestration
* observability
* terminal productivity

This project is actively evolving and is not yet production-ready.

---

## License

MIT

