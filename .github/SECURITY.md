# Security Policy

ORK is a local-first orchestration runtime. By design, ORK requires access to your filesystem, shell, and API keys. We consider operational vulnerabilities—such as unhandled zombie processes, configurations escaping the local environment, or predictable temp file corruption—to be serious security issues.

## Supported Versions

Only the latest `stable` and `beta` release channels receive security updates. If you are using a legacy version of `ai-cli` or `ork`, you must upgrade to the latest stable binary.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

Please **DO NOT** report security vulnerabilities in public issues or discussions.

Instead, please email:
**security@ork.dev**

Alternatively, you may use GitHub's Private Vulnerability Reporting feature under the "Security" tab of this repository.

### Expected Response Behavior
- **Triage:** We will acknowledge receipt of your vulnerability report within 48 hours.
- **Validation:** We will work with you to validate the replication steps (especially concerning Windows or POSIX execution boundaries).
- **Disclosure Expectations:** Once patched, we will issue an expedited release and a public advisory. We ask that you maintain confidentiality until the patch is formally published.
