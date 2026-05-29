# ORK

**A trust-oriented orchestration runtime for local-first execution.**

ORK is a strict, deterministically planned runtime environment designed to execute complex shell operations, file modifications, and git sequences locally. 

Built with operational integrity in mind, ORK operates entirely under the philosophy: **AI proposes. Humans approve. Trust is explicit.**

> **Note**: ORK is currently undergoing public technical validation. It is designed for infrastructure engineers, rigorous testing, and operationally demanding environments.

## Runtime Philosophy
Most AI coding tools operate as messy chat wrappers or unstable web UI dashboards. ORK takes a radically different approach:

1. **Strict JSON Planning**: Execution never occurs silently. Before any filesystem or shell operation is touched, ORK compiles a strict JSON execution plan.
2. **SAFE MODE Default**: The execution environment defaults to SAFE MODE, guaranteeing zero modifications occur without explicit terminal-level human verification.
3. **Local-First Infrastructure**: ORK connects locally to your active workspace, understanding your frameworks natively.
4. **Telemetry-Free**: What happens locally, stays locally. ORK does not phone home with your code, metrics, or execution logs.

## Installation

### Native Binary Downloads (Recommended)
You can download deterministic packaged binaries directly from the releases page, which bypass the need for a global Node.js installation.

- [Windows (.exe)](#)
- [macOS (Darwin)](#)
- [Linux (x64)](#)

### NPM Global Install
For Node.js environments:
```bash
npm install -g ork-cli
```

## First Run
Navigate to your target workspace and start the orchestration runtime:
```bash
ork --session dev
```

On the first run, ORK will securely generate its runtime configuration (`~/.ork`) using atomic filesystem guarantees to prevent corruption.

## SAFE MODE
ORK operates under the assumption of hostility. By default, **SAFE MODE** is strictly enforced.

When a plan is generated, ORK renders a clear `diff` of all proposed changes and waits for explicit `Y/n` approval. If you interrupt execution (`Ctrl+C`), ORK initiates an aggressive subprocess cleanup, killing all spawned trees to ensure your environment is not polluted with zombie processes.

## Security & Chaos Resilience
ORK has undergone extensive Red Team and Chaos Engineering hardening. It survives adversarial environments, malformed provider outputs, and abusive user interruptions.

- **Strict Path Boundaries**: Path traversal out of your local workspace is cryptographically audited and physically impossible via phantom symlinks or prefix escapes.
- **Asynchronous Execution Limiter**: Malicious prompts spawning 50 parallel terminal tools? ORK queues them behind a strict global execution semaphore, guaranteeing zero out-of-memory (OOM) deadlocks.
- **Atomic File Persistence**: Configurations and keys are swapped using asynchronous exponential backoff loops that gracefully bypass Windows Defender locks.
- **Config Quarantine**: Power loss corrupted your `keys.json`? The startup bootstrap automatically detects, quarantines (`.corrupt`), and rebuilds pristine states without crashing.
- **Secret Redaction**: Any embedded `.env` or provider credentials captured in stdout streams are actively redacted in real-time before hitting your terminal or log files.
- **Terminal Recovery Guarantee**: Aggressive `process.on('exit')` and SIGTERM listeners guarantee that your cursor and terminal alternate-buffer are perfectly restored even if Node is force-killed.

## Rollback & Recovery
While ORK validates plans strictly, the local filesystem can be unpredictable.
Always use version control. ORK is git-aware and expects a clean git status before proposing large architectural changes. If an execution interrupts midway, simply run `git restore .` to rollback safely. 

If ORK's own configuration is corrupted by extreme chaos (e.g. power loss during write), it automatically isolates the corrupted `.json` and rebuilds a pristine state on the next boot.

## Known Limitations
For a transparent list of current known limitations, Windows edge-cases, and testing anomalies, see [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## Community
Join the official Discord to discuss technical implementation, report bugs, and coordinate beta testing:
[https://discord.gg/mJWFajpfgk](https://discord.gg/mJWFajpfgk)

## Beta Testing
ORK is currently in an active validation phase. Our current testing focus includes:
- Windows environment stability and quirks
- Large repository operations and deep traversals
- `Ctrl+C` interruption handling and orphan process cleanup
- Runtime stability under long sessions
- Provider switching and streaming failures

## Reporting Bugs
Bug reports should be technical, reproducible, and infrastructure-focused.
Please report all bugs directly in the **#bug-reports** channel on our [Discord](https://discord.gg/mJWFajpfgk). If requested, you may also open a GitHub issue and include the `--audit` trace. See our [Issue Templates](.github/ISSUE_TEMPLATE) for requirements.

## Abuse Testing
We actively encourage breaking the runtime. Try Ctrl+C storms, massive stdout floods, or resizing your terminal continuously during execution. 
For a structured guide on how to help us harden ORK, read the [Abuse Testing Guide](docs/ABUSE_TESTING.md).
