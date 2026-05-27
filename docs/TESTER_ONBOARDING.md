# ORK Tester Onboarding

Welcome to the ORK public validation phase. We rely on infrastructure engineers and power users to aggressively stress-test the runtime and identify edge cases.

## Getting Started

### 1. Installation
We recommend downloading the latest binary directly from the releases page to test the CAXA extraction integrity:
- [Releases Page](#)

Alternatively, if you are testing cross-platform NPM behaviors:
```bash
npm install -g ork-cli@beta
```

### 2. Verify Checksums
If downloading the binary, verify the SHA-256 checksum against the release manifest:
```bash
# Windows
Get-FileHash ork.exe -Algorithm SHA256

# Linux / macOS
shasum -a 256 ork
```

### 3. Enabling Audit Mode
When testing, always run ORK with the hidden `--audit` flag:
```bash
ork --audit
```
This flag forces the Node.js event loop to dump all active handles (Sockets, Timers, ChildProcesses) when the process exits. If you find orphaned handles, please include this dump in your bug report.

## How to Report Failures

1. Reproduce the failure deterministically.
2. Capture the `--audit` output.
3. Check the `.github/ISSUE_TEMPLATE` folder to see which category your bug falls under (e.g., Windows Runtime, TUI Rendering, Provider Failure).
4. Submit the issue with full environment specifications.

## Community Discord Structure

We coordinate live testing over Discord. The server is intentionally kept small, technical, and operationally focused.

**Channel Layout:**
- `#announcements`: Silent channel for stable/beta releases.
- `#releases`: Discussion thread for new binaries.
- `#bug-reports`: Live triage before moving to GitHub Issues.
- `#windows-testing`: Real-time Windows compatibility testing.
- `#terminal-testing`: TUI and screen buffer debugging.
- `#provider-testing`: LLM schema mapping debugging.
- `#runtime-feedback`: General operational feedback.

Join the Discord server here: [Invite Link](#)
