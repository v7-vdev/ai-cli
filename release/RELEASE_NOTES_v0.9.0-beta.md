# ORK v0.9.0-beta Release Notes

**Release Date:** 2026-05-27
**Build Timestamp:** 2026-05-27T10:35:50Z

Welcome to the public technical validation phase of ORK. This `@beta` release transitions ORK from internal infrastructure into a stable, trust-oriented orchestration runtime.

## Known Limitations (Beta Expectations)
As this is a beta release focused on operational validation, please expect the following:
- **Windows Terminal Edge Cases:** If you aggressively kill ORK via Task Manager inside legacy `conhost.exe` (CMD), the Ink rendering buffer may fail to restore. Use Windows Terminal for best results.
- **Antivirus Extraction Delays:** Because ORK compiles to a standalone `.exe` using CAXA, the first execution on a fresh machine may take up to 15 seconds while the VFS payload extracts to a temporary cache.
- **Packaged-Runtime Limitations:** Running massive shell commands with highly abnormal standard output streaming could trigger race conditions in our tree-killer fallback logic.

## Quickstart
After downloading the binary, verify its integrity and start your session:
```bash
# Verify your local environment and dependencies
./ork.exe doctor

# Initialize your ORK configuration
./ork.exe init
```

## Windows Defender Warning
⚠️ **Important for Windows Testers:** 
This binary is currently **unsigned**. As a result, downloading and executing `ork-v0.9.0-beta-windows-x64.exe` *will* trigger Windows SmartScreen and may flag it. This is standard behavior for new infrastructure binaries compiled via CAXA. Please allow the execution. Binary signing (Authenticode) is planned for the stable channel release.

## Integrity Verification
Always verify your binary against the generated checksums below. ORK prioritizes strict local-first trust.

## Checksums
Please refer to `checksums.txt` for the SHA-256 hash of this binary.
