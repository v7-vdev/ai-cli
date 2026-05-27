# ORK: Known Operational Issues

ORK operates close to the metal, bridging shell environments and LLM providers. As such, there are several known architectural limitations and edge cases we are actively tracking during the public validation phase.

## 1. Windows Terminal Rendering (`conhost.exe`)
When running ORK inside the legacy Windows CMD (`conhost.exe`) rather than the modern Windows Terminal, Ink (our React TUI renderer) can occasionally fail to clean up the alternate screen buffer if aggressively killed via Task Manager.
- **Workaround:** We highly recommend using [Windows Terminal](https://github.com/microsoft/terminal).

## 2. Packaged Runtime Extraction Delay (CAXA)
Because ORK compiles to a standalone `.exe` or binary via CAXA, the very first time you execute the binary on a fresh machine, CAXA must extract the Node.js payload to a temporary cache directory (e.g. `AppData\Local\Temp`).
- **Symptom:** The first run may take 5-15 seconds to boot.
- **Workaround:** Subsequent runs are nearly instantaneous. This is an accepted tradeoff to preserve VFS integrity.

## 3. Antivirus Interference (Windows Defender)
Due to ORK's standalone `.exe` nature and its capability to spawn child processes (`git`, `npm`), heuristic scanners like Windows Defender or CrowdStrike may occasionally flag ORK binaries from the `@beta` release channel.
- **Symptom:** Execution blocked or extremely delayed.
- **Workaround:** Binary signing (Authenticode) is planned for the stable channel. For now, you may need to whitelist the executable.

## 4. Provider Instability & Rate Limits
ORK is provider-agnostic, meaning you supply your own API keys for Groq, Anthropic, or Gemini. 
- **Symptom:** ORK may suddenly halt a stream or throw a JSON parsing error if the upstream provider forcefully truncates the response due to token limits.
- **Workaround:** We are enhancing our stream-repair logic, but we recommend using robust, high-context models (e.g. `llama3-70b-8192` or `claude-3-opus`) for complex orchestration plans.

## 5. `.git/index.lock` Collisions
If an ORK execution running a complex `git` sequence is forcefully interrupted, there is a small chance the internal `taskkill` mechanism may terminate `git.exe` slightly after it has touched the index, leaving a `.git/index.lock` behind.
- **Workaround:** Manually run `rm .git/index.lock`. We are actively hardening our POSIX/Windows tree-kill signals to eliminate this.
