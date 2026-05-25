# AI CLI

An AI-native terminal-first developer runtime focused on orchestration, trustworthy planning, workspace awareness, Git-aware workflows, and professional developer productivity.

---

## Screenshots

![TUI Startup](./assets/startup-screenshot.png)
*TUI Startup & Workspace Initialization*

![Workspace-Aware Header](./assets/header-screenshot.png)
*Workspace-Aware Header displaying Frameworks and Active Provider*

![/plan Rendering](./assets/plan-screenshot.png)
*Structured JSON `/plan` Generation*

![Orchestration Workflow](./assets/orchestration-screenshot.png)
*Tool Execution & Orchestration Workflow*

---

## Core Features

- **Modern Ink TUI**: A responsive, lightweight, React-driven terminal interface.
- **Git-Aware Orchestration**: Deep context integration tracking active branches and modified files.
- **Workspace-Aware Planning**: Dynamic ingestion of workspace structure to ground LLM context.
- **Framework Detection**: Automatic heuristic detection of project technology stacks.
- **Provider Abstraction**: Hot-swappable LLM engine support (e.g., Groq, Anthropic, Gemini).
- **RuntimeContext Architecture**: Centralized, decoupled state management for complete backend orchestration.
- **Async-Safe Orchestration**: Promises, timeout protections, and graceful fallbacks out of the box.
- **Structured Planning Output**: Strict JSON plan generation preventing AI hallucination.
- **Audit Logging**: Comprehensive, append-only logs for all permissions, tools, and scanning events.
- **MCP Support**: First-class Model Context Protocol integration.
- **Regression-Tested Backend**: Hardened logic for providers, scanners, Git interactions, and tool executors.

---

## Architecture Overview

AI CLI is built upon a strict **orchestration-first architecture**. It completely decouples the terminal user interface from the backend runtime state, allowing headless testing, reliable tool execution, and deterministic planning.

- **RuntimeContext**: The central nervous system of the CLI. Holds the active history, active provider, workspace metadata, framework detection, Git metadata, repository awareness, active workflow context, permissions, and tool executor state.
- **ToolExecutor**: Sandboxes tool execution and handles permission routing and audit logging.
- **Provider Abstraction**: A unified generic interface allowing zero-friction swapping between LLM providers.
- **UI Layer Separation**: The `AppLayout` solely consumes state from the `RuntimeContext` and renders reactively. It does not own orchestration logic.

```text
src/
├── commands/       # User command routing (e.g. /plan)
├── context/        # RuntimeContext (State Management)
├── git/            # Git-aware orchestration and metadata parsing
├── logs/           # AuditLogger
├── mcp/            # Model Context Protocol integration
├── permissions/    # Security and prompt approvals
├── planning/       # Workspace & Git-aware plan generation
├── providers/      # LLM API abstractions (Groq, Anthropic, Gemini)
├── tools/          # ToolExecutor and sandboxed operations
├── ui/             # React Ink Terminal Interface
├── utils/          # CLI parsers
└── workspace/      # Async scanners and framework detection
```

---

## Git-Aware Orchestration

The AI CLI fundamentally understands your development workflow through lightweight, read-only Git integration:

- **Current Branch Awareness**: Understands feature intent directly from the active branch name.
- **Modified & Staged File Detection**: Precisely tracks what files you are currently working on.
- **RepoRoot Detection**: Identifies the true root of monorepos, even when executed in nested subdirectories.
- **Workflow-Sensitive Orchestration**: Context injections allow the AI to seamlessly adapt to your active development direction.
- **Graceful Fallbacks**: Fully operational even if Git is completely unavailable or you are in a non-repository directory.

**Example TUI Visibility:**
```text
Workspace: ai-cli | Branch: feature/phase-3a | Modified: 4 files | Framework: TypeScript | Provider: Groq
```

---

## Workspace Awareness

The CLI actively analyzes your repository during startup to provide the LLM with grounded, truthful context.

- **Async Scanning**: A non-blocking, recursive directory traversal runs dynamically during startup.
- **Framework Detection**: Heuristic analysis to detect technologies like TypeScript, React, Next.js, Express, Prisma, and Vite.
- **Intelligent Planning Context**: The active `ProjectRoot`, `Frameworks`, and `ImportantFolders` are directly injected into the planning system prompt.
- **Timeout Protection**: The scanner strictly yields after 5000ms if the repository is excessively large.
- **Ignored Folders**: Safely ignores heavy cache and dependency trees (`node_modules`, `dist`, `.git`).

---

## Planning System

Trustworthy orchestration requires realistic, non-hallucinated plans. The CLI uses a repository-aware `/plan` workflow to establish technical direction before executing modifications.

- **Git-Aware Context**: The planner intimately understands your active branch intent and respects your currently modified files.
- **Reduced Hallucination**: Generating plans bounded by actual repository states significantly improves workflow realism and prevents hallucinated file suggestions.
- **Structured Execution Plans**: The AI is forced to output strict JSON schemas containing steps, affected files, required commands, and complexity metrics.
- **Risk Visibility**: Clearly surfaces Low, Medium, and High-risk warnings for developers to review.

---

## Safety & Trust Philosophy

The AI CLI is built around an **approval-first, read-only philosophy**. Developer trust is our highest priority.

- **Developer-Controlled Workflows**: The runtime does exactly what you command, completely bounded by strict permission structures.
- **Non-Destructive Git Integration**: All Git awareness is fundamentally read-only.
- **Zero Autonomous Commits**: The runtime will never automatically `git add`, `git commit`, or `git push`.
- **No Mutative Surprises**: The CLI heavily relies on `/plan` to surface technical direction before mutating the file system.

---

## Runtime Stability & Regression Testing

The application is heavily regression-tested to ensure orchestration stability during massive sessions:

- **Timeout Protection & Shell Failure Testing**: Simulated delays and restrictive shell environments guarantee the runtime boots flawlessly without freezing.
- **Long-Session Testing**: Hardened against memory leaks, duplicate rendering, and lagging inputs over prolonged usage.
- **TUI Stress Testing**: Survives narrow terminal resizes, aggressive output rendering, and complex layout nesting without flickering.
- **RuntimeContext Validation**: Programmatic assertions guarantee that workspace scanning and Git context inject consistently without race conditions.

---

## Roadmap

Future direction focuses tightly on orchestrator reliability, workflow trust, and terminal execution pipelines:

**Phase 4 Priorities:**
- **Diff Preview System**: Visually previewing AI code edits before applying to the filesystem.
- **Approval Workflows**: Stronger developer-in-the-loop checkpoints before tool execution.
- **Trustworthy Execution Pipeline**: Robust error catching and automated execution summaries.
- **Safer Orchestration Workflows**: Strict read/write permissions gating.

---

## License

ISC
