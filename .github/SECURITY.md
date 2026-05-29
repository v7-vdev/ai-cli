# Security Policy

## Threat Model & Trust Boundaries
ORK is a local-first orchestration runtime designed to manage system processes and filesystem resources on behalf of the user. 
- **Workspace Boundary:** Execution and file mutations are strictly sandboxed to the current working directory (`process.cwd()`). Path traversal attempts (`../../`), symlink escapes, and absolute path injections are explicitly blocked.
- **Process Boundary:** Child processes are monitored and forcefully terminated if they exceed memory limits (5MB stdout/stderr) or timeout ceilings to prevent resource exhaustion and Denial of Service.
- **Data Boundary:** Provider API keys and the local `master.key` are strictly redacted from all audit logs, crash dumps, and orchestration memory before writing to disk.

## SAFE MODE Guarantees
By default, ORK boots in **SAFE MODE**. 
- Mutating commands, executing MCP capabilities, and arbitrary file writes are blocked completely by the `ExecutionPipeline` unless explicitly requested by the user.
- Any direct system commands, like Git integration, are rigidly bounded to read-only capabilities (`git status`, `git branch`) to prevent arbitrary bypass of the human approval gating system.

## Known Limitations
- While shell operators are blocked (`&&`, `||`, `>`) to prevent simplistic bash injections, ORK allows executing runtime environments (like Node or Python). We rely on Explicit Human Approval as the final gate to prevent malicious script executions.
- Symlink traversal defenses rely on physical OS presence; broken symlinks pointing outside the workspace may cause false-positive validations.

## Vulnerability Disclosure Process
If you discover a vulnerability that breaks the local sandbox or bypasses explicit approval gates, please report it immediately:
1. Email: `security@ork.dev`
2. Expected Response: Triage within 48 hours.
3. Disclosure: Do not publicly disclose bypasses until a patch is merged and released in the `stable` channel.
