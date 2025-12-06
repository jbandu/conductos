# ConductOS Backend Architecture

## 🔌 Server Entrypoint
`server/index.js`
- Loads env/config
- Creates Express app
- Registers middleware
- Registers routes
- Starts server

---

## 🧩 Routing Layout (Express)
`server/routes/`

- `auth.js` – login, reset, password flows
- `cases.js` – case creation, updates, status workflows
- `employees.js` – employee self-service flows
- `ic.js` – IC dashboards, decisions, overdue management
- `chat.js` – chat guidance (OpenAI/Anthropic)
- `orchestrator.js` – multi-agent automation
- `organizations.js` – onboarding, org management

Routes should remain thin → delegate to services.

---

## 🧠 Service Layer
`server/services/`

- `caseServicePg.js` – all case lifecycle logic
- `userService.js` – users + roles + org membership
- `authService.js` – JWT issuing + validation
- `icService.js` – IC-specific actions
- `aiService.js` – Chat + orchestrator logic
- `orgService.js` – organization-level configurations

Goal: one service per domain with:
- Input validation
- Permission checks
- DB repository calls
- Consistent error output

---

## 🗄 Database Layer
`server/db/`

- `pg-init.js` – connection pool
- `utils.js` – ID and case code generators
- `schema.sql` – reference schema

Next refactor step: introduce **repositories**:
- `caseRepository.js`
- `userRepository.js`
- `orgRepository.js`
- `auditRepository.js`

---

## 🧱 Middleware
`server/middleware/`

- Auth decoder
- Role enforcement
- Request logging
- Error handler (to be centralized)

---

## 🤖 AI Architecture Summary
- `/api/chat` – single-agent
- `/api/orchestrator` – multi-agent workflow
- MCP Server → provides PoSH Act, Rules & Case Law as tools
- Agents “reason” using a shared scratchpad & constraints

