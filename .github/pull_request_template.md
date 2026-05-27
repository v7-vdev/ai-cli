## ORK Pull Request

Thank you for contributing to ORK. As an infrastructure-grade execution runtime, we prioritize operational stability, safe degradation, and deterministic process handling over new features.

Please complete the following checklist before requesting a review.

### Operational Checklist
- [ ] **Windows Validation:** I have tested these changes on a Windows environment (or I have explicitly marked this PR as needing Windows validation).
- [ ] **Subprocess Cleanup:** I have verified that any new child processes are correctly attached to the timeout tree and that they die cleanly upon a `Ctrl+C` exit.
- [ ] **Rollback Consideration:** If this PR modifies filesystem state, I have ensured atomic operations (e.g., writing to a temp file first, then swapping) to prevent corruption during an unexpected exit.
- [ ] **Terminal Integrity:** If modifying Ink or TUI components, I have verified that the alternate screen buffer restores correctly and the cursor becomes visible again upon exit.

### Testing Notes
*Describe how you stress-tested this PR. Did you simulate a `Ctrl+C` interruption? Did you flood `stdout`? Did you use the `--audit` flag to check for hanging handles?*

### Description of Changes
*Provide a calm, technical explanation of what this PR resolves or adds. Link to the relevant issue.*
