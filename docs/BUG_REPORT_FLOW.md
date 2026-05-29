# Discord Channel Templates

The following templates should be pinned to their respective Discord channels to standardize technical communication during the public beta.

## #install-help
**Pinned Message:**
Welcome to `#install-help`. If you are facing issues downloading binaries, running `npm install -g ork-cli`, or getting the application to boot, please post here using the template below.

**Template:**
```text
**OS:** (e.g., Windows 11, macOS Sonoma)
**Node Version (if applicable):**
**Install Method:** (NPM or Binary)
**Issue Description:** 
**Error Output:** (Paste inside code blocks)
```

## #bug-reports
**Pinned Message:**
Found a crash, freeze, or execution failure? Please be as technical and detailed as possible. ORK is an infrastructure tool, and we rely on exact reproducibility.

**Template:**
```text
**ORK Version:** (e.g., v1.0.0-beta)
**OS:**
**Terminal:** (e.g., Windows Terminal, iTerm2, Alacritty)
**Steps to Reproduce:**
1.
2.
3.
**Expected Behavior:**
**Actual Behavior:**
**Logs / Audit Trace:** (Attach the `.ork/logs` if possible)
```

## #windows-testing
**Pinned Message:**
Windows is a primary testing target for the beta due to aggressive antivirus locks and differing subprocess handling (taskkill vs SIGKILL). Discuss Windows-specific quirks here.

**Template:**
```text
**Windows Build:** (e.g., Win 11 23H2)
**Terminal/Shell:** (e.g., PowerShell 7, Git Bash)
**Antivirus Status:** (e.g., Defender Active)
**Feedback/Issue:**
```

## #beta-feedback
**Pinned Message:**
General feedback on UX, plan reading, the TUI, and overall execution speeds. No strict template is required here, but if you're discussing a specific prompt failure, please share the prompt!

**Template (Optional):**
```text
**Prompt Used:**
**Model/Provider:** (e.g., Groq Llama 3)
**Feedback:**
```
