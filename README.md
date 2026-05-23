Your README now needs to reflect:

```txt id="1"
workflow orchestration + planning architecture
```

NOT just:

```txt id="2"
AI terminal chat
```

Use this updated version.

# AI CLI

A terminal-first AI developer assistant focused on safe workflow orchestration, planning, autonomous tooling, runtime permissions, and audit logging.

Inspired by tools like Claude Code, OpenCode, and modern AI developer runtimes.

---

## Features

* AI chat in terminal
* Structured `/plan` workflow system
* Autonomous tool execution
* Runtime orchestration architecture
* MCP support
* Runtime context system
* Permission manager
* Structured audit logging
* Safe file editing
* Diff previews
* Overwrite protection
* Multi-provider support
* Interactive command system
* Autonomous loop safeguards
* Session permission cache
* Backup generation
* Timeout protection
* Graceful fallback handling
* Validation layer for malformed AI output

---

## Commands

### Planning Commands

* `/plan`

Examples:

```bash
/plan build REST API
/plan add JWT authentication
/plan refactor RuntimeContext
```

---

### File Commands

* `/read`
* `/generate`
* `/edit`

Examples:

```bash
/read src/index.ts
/generate api.js express server
/edit api.js add error handling
```

---

### System Commands

* `/logs`
* `/clear`
* `/models`

---

## `/plan` Workflow

The `/plan` system generates structured execution plans BEFORE making any changes.

Generated plan sections include:

* Objective
* Files Likely Affected
* Step-by-Step Plan
* Commands Needed
* Risks / Warnings
* Estimated Complexity
* Recommended Next Action

The planner includes:

* timeout protection
* malformed JSON recovery
* markdown sanitization
* fallback formatting
* validation layer
* audit logging integration

Important:

`/plan` NEVER:

* edits files automatically
* executes shell commands automatically
* triggers autonomous execution automatically

---

## Architecture

```txt
src/
 ├── commands/
 ├── planning/
 ├── context/
 ├── permissions/
 ├── logs/
 ├── providers/
 ├── tools/
 ├── mcp/
 ├── utils/
```

---

## Core Runtime Flow

```txt
User Input
   ↓
REPL
   ↓
CommandParser
   ↓
Commands
   ↓
RuntimeContext
   ↓
PermissionManager
   ↓
ToolExecutor
   ↓
AuditLogger
   ↓
Providers
```

---

## Planning Architecture

```txt
/plan
   ↓
Planner
   ↓
Validator
   ↓
RiskAnalysis
   ↓
Formatter
   ↓
AuditLogger
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
/plan build REST API
/generate api.js express server
/edit api.js add error handling
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
* Timeout protection
* Graceful fallback handling
* Validation of malformed AI responses

---

## Logging System

* Local audit logs
* Non-blocking async log queue
* Log rotation support
* Security event tracking
* `/logs tail` live monitoring
* API key redaction

---

## Current Focus

AI CLI is currently focused on:

* safe AI orchestration
* workflow-driven tooling
* runtime observability
* developer productivity
* planning-first execution
* resilient terminal workflows

---

## Future Goals

* Workspace-aware planning
* Git integration
* Session persistence
* Project summaries
* Smarter repo awareness
* Better diff viewer
* Safer approval workflows

---

## Current Status

AI CLI is currently an advanced local-first AI developer tooling project focused on orchestration quality, safety, runtime stability, and developer workflows.

The project is actively evolving and is not yet production-ready.

---

## License

MIT
