# Contributing to ORK

Thank you for contributing to ORK. ORK is an orchestration-first developer runtime. We prioritize deterministic behavior, process cleanup, and filesystem safety above all else. 

The contribution process is designed to be rigorous. This is not a chaotic startup repo; this is infrastructure.

## Operational Tone
- **Technical-First Communication**: Keep PRs and issues focused on reproducible technical reality.
- **No Hype**: Avoid using terms like "autonomous workforce" or "AGI" in your PRs. We build deterministic tools.
- **Approval-First Execution**: If you add new actions or shell behaviors, they MUST require human `Y/n` approval through the `SAFE MODE` pipeline. Execution never occurs silently.

## Contributor Risk Rules
Certain boundaries of the ORK codebase are considered highly volatile. If your PR touches the following areas, you **must** adhere to the explicit testing rules below:

### Affected Areas
- Subprocess management (`runCommand.ts`, `exec.ts`)
- Signal handling (`process.on('SIGINT')`, tree-killing)
- Terminal restoration and UI lifecycles (Ink alternate screen buffers)
- Packaging and Binary creation (`caxa`, `release.js`)
- `SAFE MODE` bypass logic or execution logic

### Mandatory Testing Requirements for Risk Areas
If you edit the above boundaries, your PR **WILL NOT BE MERGED** unless you explicitly confirm:
1. **Windows Testing**: You have tested your subprocess or filesystem logic on Windows (CMD or PowerShell) and verified no orphaned `node.exe` or `git.exe` processes remain.
2. **Packaged-Runtime Testing**: You have run `npm run package`, extracted the binary, and verified it works natively outside of a local Node.js environment.
3. **Interruption Testing**: You have spammed `Ctrl+C` during your new operation and verified the terminal cursor restores correctly and no background tasks hang indefinitely.

## Development Setup
```bash
# Clone the repository
git clone https://github.com/v7-vdev/ork.git
cd ork

# Install dependencies (pinned to exact versions)
npm install

# Run the developer version
npm run dev -- --session test

# Run tests
npm run test
```
