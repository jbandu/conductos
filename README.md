# 🟣 ConductOS — AI-Powered PoSH Case Management System

ConductOS is a secure, enterprise-grade, AI-assisted case management platform designed to support **PoSH (Prevention of Sexual Harassment)** compliance in organizations of all sizes.  
It provides a safe, guided experience for employees, robust workflows for Internal Committee (IC) members, multi-tenant organization onboarding, advanced auditability, and AI-driven insights.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js 20, Express 4 (ES Modules) |
| Database | PostgreSQL (Railway, Render, Local) |
| AI Layer | OpenAI + Anthropic + Multi-Agent Orchestrator |
| Knowledge Layer | PoSH MCP Knowledge Server |
| Testing | Playwright |
| Deployment | Railway + Render + Local Ubuntu |
| Architecture | Monorepo (client + server workspaces) |

---

## 📁 Project Structure

```txt
conductos/
  client/                         # React 18 + Vite frontend
    src/
      components/                 # Shared UI components
      pages/                      # Employee & IC pages
      services/                   # API wrapper functions
      design-system/              # Shared UI primitives + styling patterns
      App.jsx
    index.html
    package.json

  server/                         # Node.js / Express backend
    index.js                      # App bootstrap entrypoint
    config.js                     # Environment variable + config loader
    routes/                       # REST API routes
    services/                     # Business logic (cases, user mgmt, AI, etc.)
    middleware/                   # Auth, logging, error handling
    db/
      pg-init.js                  # Postgres connection pool + init
      schema.sql                  # Database schema reference
      utils.js                    # Case code generator + helpers
    jobs/                         # Scheduled background tasks (e.g., AI insights)
    package.json

  posh-knowledge-mcp/             # MCP Server: PoSH Act, rules, case law, templates
    src/
    package.json

  tests/                          # Playwright test suite
    employee/
    ic/
    cases/
    intake/
    mobile/
    test-utils.js

  docs/                           # Documentation & guides
    API_DOCUMENTATION.md
    LOCAL_LAUNCH_GUIDE.md
    RAILWAY_DEPLOYMENT_GUIDE.md
    RENDER_DEPLOYMENT_GUIDE.md
    TEST_PLAN.md
    DESIGN_SYSTEM.md
    PILOT_USER_GUIDE.md
    CONDUCTOS_TESTING_VALIDATION_GUIDE.md

  railway.toml                    # Railway deployment config
  render.yaml                     # Render deployment blueprint
  playwright.config.js            # Playwright config
  .env.example                    # Example environment template
  package.json                    # Monorepo root (workspaces)
```

---

## 🧠 Core System Capabilities

### 🔹 1. Case Management
- Create, update, track, and close PoSH cases  
- Automatic case code generation (`KELP-YYYY-NNNN`)  
- Full workflow lifecycle  
- Status history + immutable audit log  
- Deadline management (90-day PoSH compliance timeline)

### 🔹 2. Employee Experience
- Guided case submission (anonymous or identified)  
- Psychological-safety-focused UI  
- Real-time case status tracking  
- Educational PoSH content  

### 🔹 3. Internal Committee (IC) Experience
- Dashboard of open, overdue, and new cases  
- Investigations workflow  
- Role-based access control (RBAC)  
- IC-only tools for documents, notes, and status changes

### 🔹 4. AI & Automation
- `/api/chat` conversational guidance using OpenAI/Anthropic  
- Multi-Agent Orchestrator:  
  - Policy agent  
  - IC assistant agent  
  - Sentiment agent  
  - Pattern detection agent  
- PoSH Knowledge MCP Server:  
  - PoSH Act  
  - PoSH Rules  
  - Case law summaries  
  - Templates  

### 🔹 5. Security & Compliance
- JWT authentication  
- Roles: `employee`, `ic_member`, `hr_admin`, `super_admin`  
- Organization-scoped access (multi-tenant)  
- Password policies, reset flows, lockout  
- No sensitive data logged  

---

## ⚙️ Environment Variables

Copy `.env.example`:

```bash
cp .env.example .env
```

Then set:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://localhost:5432/conductos

JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@conductos.app
```

---

## 🛠 Local Development (Ubuntu, macOS, Windows)

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize database

```bash
npm run db:init
```

### 3. Optional: Seed demo data

```bash
npm run seed:demo
```

### 4. Start dev servers

```bash
npm run dev
```

- Backend → http://localhost:3001  
- Frontend → http://localhost:5173  

---

## 🌐 Deployment

### 🚉 Railway Deployment

```bash
npm run railway:build
npm run railway:start
```

Documentation:  
See `RAILWAY_DEPLOYMENT_GUIDE.md`.

---

### 🟦 Render Deployment

Render uses:

- `render.yaml`
- Branch: `render-deployment`

Documentation:  
See `RENDER_DEPLOYMENT_GUIDE.md`.

---

## 🧪 Testing (Playwright)

Run full suite:

```bash
npm test
```

Open UI mode:

```bash
npm run test:ui
```

Targeted test runs:

```bash
npm run test:employee
npm run test:ic
npm run test:cases
npm run test:intake
npm run test:mobile
```

---

## 🎨 Design System

Principles:

- Trauma-informed UI  
- Accessibility-first  
- Clear, guided workflows  
- Tailwind CSS conventions  

See `DESIGN_SYSTEM.md` for full design tokens & patterns.

---

## 🔮 Roadmap

### Upcoming Enhancements
- Multilingual foundation  
- Repository pattern for database access  
- Centralized Zod validation  
- Global error middleware + structured logging  

### Future Plans
- Metrics dashboards  
- Organization onboarding wizard  
- Multilingual UI + email templates  
- AI-assisted IC report creation  
- Optional Next.js migration  

---

## 🤝 Contributing

1. Create a feature branch  
2. Add tests when applicable  
3. Follow design-system conventions  
4. Update relevant documentation  
5. Run `npm test` before PR submission  

---

## 🛡 License

Private / Proprietary — Not for public distribution.

ConductOS is built to create safer workplaces with compassion, structure, and intelligence.
