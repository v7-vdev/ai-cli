# ORK: Public Abuse Testing Guide

ORK is entering a public stress-testing phase. We want you to break it. Our goal is to ensure ORK behaves deterministically and degrades gracefully under hostile terminal conditions, preserving configuration integrity and cleaning up child processes.

## Focus Areas for Chaos Testing

### 1. The Ctrl+C Storm (Windows & Unix)
Run a complex orchestration task that spawns long-running shell processes (e.g., `npm install` or massive `git log`). Spam `Ctrl+C` repeatedly.
**What to look for:**
- Does the UI freeze?
- Does `ork` exit cleanly?
- *Crucially:* Open Task Manager (Windows) or `top` (Unix). Are there any orphaned `node`, `npm`, or `git` processes left behind?

### 2. Disk Exhaustion (`ENOSPC`)
Temporarily fill your partition or run ORK in a highly constrained Docker volume, and then force ORK to write configuration (e.g., adding a new API key).
**What to look for:**
- ORK should gracefully inform you it cannot save the configuration.
- The existing `~/.ork/keys.json` file MUST NOT become corrupted or zero-byte. (We use atomic temp-file swapping to prevent this).

### 3. Output Backpressure (Stdout Flooding)
Use ORK to run a script that aggressively loops and prints hundreds of megabytes of text to stdout without pausing.
**What to look for:**
- Does the terminal lock up?
- Does the REPL remain responsive enough to accept a `Ctrl+C` stream interruption?

### 4. Terminal State Corruption
Run ORK in Windows Terminal, standard CMD, and PowerShell. Let Ink render the UI, and intentionally kill the process abruptly via Task Manager.
**What to look for:**
- Does your shell prompt return?
- Is the cursor visible again?
- Did the alternate screen buffer properly close, or did your terminal history get wiped out?

## Reading the `--audit` Logs

Launch ORK with the hidden `--audit` flag:
```bash
ork --audit
```
When you exit, ORK will emit an active handle audit. Look for lingering `Sockets`, `Timers`, or `ChildProcesses`. A healthy teardown should report `Zero orphaned handles detected`.

If you discover a scenario where ORK leaks handles or corrupts configurations, please file an issue with the replication steps and the `--audit` trace!
