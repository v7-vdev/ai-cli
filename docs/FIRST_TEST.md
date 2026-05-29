# ORK First Test: 10-Minute Onboarding

Welcome to the ORK public beta validation testing. As a technical tester, your primary objective is to verify that the core execution engine is stable and that trust boundaries remain intact on your machine.

This guide will walk you through a complete end-to-end test in under 10 minutes.

## Prerequisites
- Node.js installed (or use our native binaries)
- An active Groq, Anthropic, or OpenAI API key
- A clean terminal (PowerShell, Command Prompt, or bash)

## Step 1: Install ORK

The recommended approach is to install globally via NPM:
```bash
npm install -g ork-cli
```
*Note: If you prefer native binaries, download the executable for your OS from the GitHub Releases page.*

## Step 2: Initialize Configuration

ORK operates locally and keeps your provider keys in a secure atomic configuration file.

```bash
ork init
```
Follow the prompts to add your preferred provider key. (Your keys never leave your machine).

## Step 3: Run Diagnostics

Before executing anything, run the built-in diagnostic tool to ensure your environment is fully supported:

```bash
ork doctor
```
Ensure that the `File System Access` and `Atomic Writes` checks pass successfully. If they fail, take a screenshot.

## Step 4: First Orchestration (SAFE MODE)

Navigate to an empty directory or a safe sandbox repository, and run your first orchestration:

```bash
ork "Create a simple Express.js hello world server"
```

Because ORK runs in **SAFE MODE** by default, it will not execute the commands silently. It will build a strict JSON plan and present you with a `Y/n` prompt alongside a diff of all proposed operations.

Review the diff, and press **`Y`** to execute.

## Step 5: The Chaos Interruption Test

ORK is built to handle hostile interruptions without leaving zombie processes polluting your OS.

Run another command:
```bash
ork "Install 5 large npm packages and start a dev server"
```
While ORK is actively installing the packages or executing the command, aggressively hit `Ctrl+C` multiple times. 

**Expected Behavior:** 
ORK should instantly trap the SIGINT signal, forcefully terminate the entire `npm` process tree, gracefully restore your terminal cursor, and exit cleanly without hanging.

## Step 6: Report Findings

We coordinate all testing directly in the Discord server.

1. Join the Discord: [https://discord.gg/mJWFajpfgk](https://discord.gg/mJWFajpfgk)
2. Navigate to the `#beta-feedback` or `#bug-reports` channel.
3. Drop a quick message letting us know how the test went! If you encountered any phantom cursors, freezing, or crashes during Step 5, please post your OS version and terminal emulator.

Thank you for helping us harden infrastructure-grade AI.
