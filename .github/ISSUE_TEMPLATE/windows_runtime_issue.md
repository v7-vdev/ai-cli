---
name: Windows Runtime Issue
about: File a bug specifically regarding Windows process execution, paths, or filesystem locking
title: '[WIN] '
labels: windows, subprocess
assignees: ''

---

**Describe the Windows Issue**
Windows handles file paths, subprocess limits, and SIGKILL differently than POSIX systems. What broke?

**Expected behavior**
How should the execution have behaved?

**Actual behavior**
Did the subprocess hang? Did you encounter an EPERM or EBUSY error?

**To Reproduce**
1. Command executed: '...'
2. ...
3. See error

**Environment Specifications:**
 - Windows OS Version: [e.g. Windows 11 23H2]
 - Shell: [e.g. PowerShell 7, CMD, Git Bash]
 - Terminal Emulator: [e.g. Windows Terminal, ConEmu]
 - ORK Version: [e.g. 1.0.0]

**Process Tree State**
If a process hung, did you verify in Task Manager if `node.exe` or `git.exe` remained open?
[Yes/No]

**Logs**
```
[Paste output here]
```
