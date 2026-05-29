# Tester Recruitment Kit

These templates are designed strictly to attract technical infrastructure engineers, QA testers, and developers willing to break software. They intentionally avoid startup marketing hype and focus entirely on requesting brutal feedback.

---

## 1. Reddit Post Template
**Target Subreddits:** r/node, r/typescript, r/qualityassurance, r/commandline

**Title:** Looking for technical testers to try and break a new local-first orchestration runtime (Node/TS).

**Body:**
Hey everyone,

I'm working on a local-first orchestration runtime called ORK. It’s a strict, deterministically planned CLI tool designed to safely execute shell commands and filesystem modifications proposed by local or remote LLMs. 

Because it operates directly on the local filesystem and spawns subprocesses, I am heavily prioritizing infrastructure security and chaos resilience before a wider release. I am currently looking for technical testers to join the public beta and actively try to break it. 

**What I need tested:**
- **Windows environments:** Specifically around Antivirus file-locks and `taskkill` edge cases.
- **Interrupt Handling:** Spamming `Ctrl+C` while it executes heavy npm installs to see if zombie processes orphan.
- **Large Repositories:** Testing the limits of the asynchronous file scanner (100k+ files).

This isn't a product pitch—I genuinely just need engineers who know how to break things to help harden the runtime. 

If you're interested in running a 10-minute stress test, join the Discord where we are coordinating the beta:
👉 [https://discord.gg/mJWFajpfgk](https://discord.gg/mJWFajpfgk)

Thanks for the help!

---

## 2. GitHub Discussion / Issue Template
**Target:** Open source communities, related CLI tooling discussions.

**Title:** [Beta] Requesting testers for an infrastructure-focused orchestration CLI

**Body:**
Hello! I'm currently running a technical validation beta for ORK, a new deterministic orchestration runtime. 

We've recently implemented a global execution semaphore and aggressive subprocess cleanup routines. I am actively looking for developers willing to run chaos tests on the CLI (e.g., massive stdout floods, intentional config corruption, symlink loops) to validate the resilience architecture.

If you have 10 minutes to help stress-test a Node.js TUI, we are coordinating feedback directly in Discord:
[https://discord.gg/mJWFajpfgk](https://discord.gg/mJWFajpfgk)

---

## 3. Discord Outreach Template
**Target:** Developer communities, coding servers.

**Message:**
Hey all, I'm currently in the technical validation phase for a new CLI orchestration runtime (ORK). We just pushed a massive resilience update to handle asynchronous I/O and process tree killing. I'm looking for a few technical testers who are willing to try and break the terminal UI and execution engine. If you're down to run a quick 10-minute chaos test (especially on Windows!), join our beta testing server here: https://discord.gg/mJWFajpfgk 

---

## 4. X (Twitter) Build-In-Public Template
**Target:** Developer Twitter, #buildinpublic

**Tweet:**
We just shipped a massive Chaos Resilience update for ORK (a strict, local-first orchestration runtime). 

I'm looking for 5-10 technical testers to try and break it. 
Specifically testing:
✅ Windows taskkill limits
✅ Ctrl+C process orphaning
✅ Large repo parsing

If you want to help harden a new CLI tool, join the Discord to get the 10-minute test guide:
https://discord.gg/mJWFajpfgk
