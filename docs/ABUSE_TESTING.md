# ORK: Public Abuse Testing Guide

ORK is entering a public stress-testing phase. We want you to break it. Our goal is to ensure ORK behaves deterministically and degrades gracefully under hostile terminal conditions, preserving configuration integrity and cleaning up child processes.

## Focus Areas for Chaos Testing

### 1. The Ctrl+C Storm (Windows & Unix)
Run a complex orchestration task that spawns long-running shell processes (e.g., `npm install` or massive `git log`). Spam `Ctrl+C` repeatedly.
**What to look for:**
- Does the UI freeze?
- Does `ork` exit cleanly?
- *Crucially:* Open Task Manager (Windows) or `top` (Unix). Are there any orphaned `node`, `npm`, or `git` processes left behind?

### 2. Provider-Switch Storms
While ORK is generating a plan, aggressively swap the active LLM provider via the CLI flags or environment variables, or sever your internet connection mid-stream.
**What to look for:**
- Does the active stream handle network loss gracefully?
- Does the UI fallback cleanly without corrupting the rendering buffer?

### 3. Terminal Resize Storms
While Ink is actively rendering a massive diff or plan, grab the corner of your terminal emulator window and violently resize it in all directions.
**What to look for:**
- Does the alternate screen buffer corrupt?
- Do the word-wraps survive the calculation?

### 4. Git Interruption Testing
Initiate an orchestration plan that involves adding and committing multiple files. Interrupt the process aggressively right as `runCommand` triggers the `git commit`.
**What to look for:**
- Does `git.exe` or `git` become a zombie process?
- Is the `.git/index.lock` left locked, bricking the repository? ORK's unified `runCommand` tree-killer should prevent this.

### 5. Windows Shell Chaos
Run ORK simultaneously in `cmd.exe`, PowerShell 7, and Git Bash on Windows. Trigger heavy execution pipelines in all three.
**What to look for:**
- File locking collisions (`EBUSY` or `EPERM`).
- Does the tree-kill mechanism (`taskkill /T /F`) successfully reach across the different shell wrappers?

### 6. Malformed Stream Testing
Use an unsupported or locally hosted, heavily degraded LLM endpoint that spits out malformed, broken JSON instead of the strict ORK schema.
**What to look for:**
- Does the JSON parser fail gracefully?
- Does ORK refuse to execute the malformed payload instead of blindly executing partial shell commands?

### 7. Disk Exhaustion (`ENOSPC`)
Temporarily fill your partition or run ORK in a highly constrained Docker volume, and then force ORK to write configuration (e.g., adding a new API key).
**What to look for:**
- ORK should gracefully inform you it cannot save the configuration.
- The existing `~/.ork/keys.json` file MUST NOT become corrupted or zero-byte. (We use atomic temp-file swapping to prevent this).

### 8. Packaged-Runtime Validation
Run the compiled `ork.exe` (generated via CAXA). Do not use `npm run dev`.
**What to look for:**
- Does it extract seamlessly?
- Does Windows Defender flag it?
- Are native dependencies failing to load from the temporary extraction cache?

## Reading the `--audit` Logs

Launch ORK with the hidden `--audit` flag:
```bash
ork --audit
```
When you exit, ORK will emit an active handle audit. Look for lingering `Sockets`, `Timers`, or `ChildProcesses`. A healthy teardown should report `Zero orphaned handles detected`.

If you discover a scenario where ORK leaks handles or corrupts configurations, please file an issue with the replication steps and the `--audit` trace!
