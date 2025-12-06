# ConductOS – Development Context File
This file exists to give AI coding tools (Claude Code, Cursor, OpenAI, etc.) a precise, minimal context so they do NOT load the entire repository.  
Only use the information in this file unless I explicitly open or reference other files.

---

## 🧱 Architecture Summary
- Frontend: React 18 + Vite + Tailwind
- Backend: Node.js + Express + PostgreSQL
- DB Layer: pg pool in `server/db/pg-init.js`
- Services: All business logic in `server/services/*`
- Routes: Express routers in `server/routes/*`
- Auth: JWT + role-based access
- AI Layer: `/api/chat`, `/api/orchestrator`
- Knowledge Layer: MCP server in `posh-knowledge-mcp`

---

## 🧩 Areas Allowed for Refactoring
AI tools may modify ONLY these folders unless told otherwise:

- `server/services/*`
- `server/routes/*`
- `server/db/*`
- `client/src/pages/*`
- `client/src/services/*`
- `playwright tests/*` (on request)

Do NOT touch:
- deployment files (`railway.toml`, `render.yaml`)
- `.env.example`
- database schema unless explicitly instructed

---

## 🎯 Current Priority – Multilingual Refactor Prep
Goals:
1. Extract all user-facing copy into translation keys.
2. Introduce i18n foundation (no UI redesign yet).
3. Allow `preferred_language` per user.
4. Maintain identical behavior until translations are added.

---

## 🚫 Do Not Load node_modules or build artifacts
Ignore completely:
- `node_modules/`
- `playwright-report/`
- `test-results/`
- `client/dist/`
- any logs, caches, binaries

---

## 📝 Notes for Claude Code
When performing refactors:
- Generate SMALL diffs.
- Never rewrite whole files unless requested.
- Ask for confirmation before multi-file changes.
- Keep comments minimal unless asked for an explanation.

