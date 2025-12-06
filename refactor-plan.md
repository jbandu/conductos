# ConductOS Refactor Plan

This file guides AI tools when performing multi-file refactors.

---

## 🎯 Priority 1 — Remove SQLite Legacy
Actions:
- Delete unused `init.js` or `caseService.js` (SQLite versions)
- Rename `caseServicePg.js` → `caseService.js`
- Update imports

---

## 🎯 Priority 2 — Add Repository Pattern
Create:
- `server/db/repositories/caseRepository.js`
- `server/db/repositories/userRepository.js`
- `server/db/repositories/orgRepository.js`

Benefits:
- Cleaner services
- Less repeated SQL
- Easier multilingual integration

---

## 🎯 Priority 3 — Centralized Validation
Introduce Zod schemas:

server/validation/caseSchemas.js
server/validation/authSchemas.js


Routes → validate input → call services.

---

## 🎯 Priority 4 — Global Error Middleware
Add:


server/middleware/errorHandler.js


Standard error shape:
```json
{
  "error": "VALIDATION_ERROR",
  "messages": [...]
}
🎯 Priority 5 — Frontend Cleanup

Move UI components into design system

Remove duplicated styles

Prep for i18n key extraction

🎯 Priority 6 — AI Layer Improvements

Standardize orchestrator input/output schema

Add translation pivot agent (future)
