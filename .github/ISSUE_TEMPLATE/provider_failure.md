---
name: Provider Failure
about: File a bug regarding an LLM provider integration, rate limits, or context issues
title: '[LLM] '
labels: provider
assignees: ''

---

**Describe the Provider Issue**
Which provider failed? (Anthropic, Groq, Gemini) Did it return a 400? Was there a timeout? Did the JSON response fail strict schema validation?

**Expected behavior**
What should the provider have returned?

**Actual behavior**
What did ORK report?

**To Reproduce**
1. Command: `ork ...`
2. Provider configuration: [e.g. Groq with llama3]
3. Error observed.

**Environment Specifications:**
 - Provider: [e.g. Groq]
 - Model: [e.g. llama3-70b-8192]
 - ORK Version: [e.g. 1.0.0]

**Logs / Error Trace**
```
[Paste provider trace here]
```
