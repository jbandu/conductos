# ConductOS Multilingual Implementation Plan

Goal: Add multilingual support *without changing current UX/behavior*.

---

## Phase 1 — Foundation (Safe)
1. Extract all text from React pages → `/client/src/i18n/en.json`
2. Replace text with `t('...')`
3. Add i18n provider at root level
4. Create fallback keys identical to English

---

## Phase 2 — Backend Prep
1. Add `preferred_language` to `users`
2. Add helper: `getTranslator(req.user.preferred_language)`
3. Localize:
   - validation messages
   - email templates
   - system notifications

---

## Phase 3 — Actual Translation
- Deliver translations per organization
- Add dynamic language switcher in UI

---

## Phase 4 — AI Integration
- Add Translation Agent in orchestrator
- Allow `/api/chat` to output language-specific messages
- Add safety: English always included as fallback

---

## Design Constraints
- No regressions allowed in case flows
- No UI redesign until Phase 4

