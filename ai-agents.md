# AI Agents in ConductOS

This document defines all current and future agents in the system.

---

## 🤖 Existing Agents

### 1. Policy Lookup Agent
- Fetches clauses from PoSH Act, Rules, case law.
- Runs queries against MCP knowledge server.

### 2. IC Assistant Agent
- Helps IC members interpret evidence.
- Generates insights, summaries, next-best-actions.

### 3. Sentiment Agent
- Flags hostile or emotionally escalated user inputs.
- Helps compose trauma-informed responses.

### 4. Pattern Detection Agent
- Looks for repeated behavioral signals across cases.
- Never reveals confidential cross-case data (strict privacy).

---

## ⚙️ Orchestrator Spec
The orchestrator:
- Runs agents in sequence or parallel
- Uses a shared scratchpad (JSON)
- Validates whether enough info is gathered
- Produces a structured output:
```json
{
  "summary": "...",
  "insights": [...],
  "recommendations": [...]
}

