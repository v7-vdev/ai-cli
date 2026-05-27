# ORK Release Discipline

ORK releases follow a strict, deterministic pipeline designed to ensure binary integrity and runtime stability. We do not ship "hotfixes" directly to stable; we use release channels.

## Release Channel Strategy

Because Windows runtime tooling and subprocess orchestration benefit massively from staged releases, ORK uses a three-tier channel strategy:

1. **Alpha Channel (`@alpha`)**
   - **Purpose:** Immediate testing of subprocess logic, terminal fixes, and experimental core features.
   - **Stability:** Low. Expect hanging processes.
   - **Distribution:** NPM tags only. No standalone binaries.

2. **Beta Channel (`@beta`)**
   - **Purpose:** Release candidate validation. This is where we verify CAXA packaging, filesystem atomicity, and Windows Defender reputation.
   - **Stability:** High. Bugs are usually edge-cases.
   - **Distribution:** Pre-release binaries on GitHub and `@beta` on NPM.

3. **Stable Channel (`@latest`)**
   - **Purpose:** Production-ready orchestration infrastructure.
   - **Stability:** Hardened.
   - **Distribution:** Official GitHub binaries and `@latest` on NPM.

## Semantic Versioning
- **MAJOR**: Breaking configuration schema changes, structural command changes.
- **MINOR**: New provider integrations, non-breaking core functionality.
- **PATCH**: Subprocess cleanup fixes, rendering glitch fixes, dependency pins.

## Packaging Pipeline (`caxa`)
ORK does not use `pkg`. We standardise exclusively on `caxa` to preserve native Node.js ESM and VFS compatibility.

To generate a release build:
```bash
# This automatically runs tsc and bundles the binaries using caxa
npm run package
```
This generates the standalone binary at `release/ork.exe`.

## Release Manifest & Checksums
All releases MUST include `SHA-256` checksums for the binaries.
This guarantees that the CAXA payload has not been tampered with and ensures trust for local-first execution.

```bash
# Example Windows Checksum Generation
Get-FileHash release/ork.exe -Algorithm SHA256
```

## Rollback Guidance
If a stable release exhibits critical regressions (e.g., corrupting configurations or consistently zombie-ing git processes):
1. Immediately pin the previous stable version in the installation docs.
2. Direct users to the exact `checksum` of the previous binary.
3. Users can safely downgrade without losing their `~/.ork` configuration schema, as schemas are heavily forward-compatible.

## Binary Signing (Future)
*Note: Binary signing for Windows Defender (Authenticode) is planned for a future stable cycle to minimize Antivirus friction. Currently, users may need to approve the binary via Windows SmartScreen.*
