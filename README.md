# 🟣 ConductOS — AI-Powered PoSH Case Management System

ConductOS is a secure, enterprise-grade, AI-assisted case management platform designed to support **PoSH (Prevention of Sexual Harassment)** compliance in organizations of all sizes.  
It provides a safe, guided experience for employees, robust workflows for Internal Committee (IC) members, multi-tenant organization onboarding, advanced auditability, and AI-driven insights.

---

# 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js 20, Express 4 (ES Modules) |
| Database | PostgreSQL (Railway, Render, Local) |
| AI Layer | OpenAI + Anthropic + Multi-Agent Orchestrator |
| Knowledge Layer | PoSH MCP Knowledge Server |
| Testing | Playwright (E2E, mobile + desktop) |
| Deployment | Railway + Render + Local Ubuntu |
| Architecture | Monorepo (client + server workspaces) |

---

# 📁 Project Structure

conductos/
├── client/ # React 18 + Vite frontend
│ ├── src/
│ │ ├── components/ # UI components
│ │ ├── pages/ # Employee & IC screens
│ │ ├── services/ # API calls
│ │ ├── design-system/ # Shared UI patterns
│ │ └── App.jsx
│ └── package.json

├── server/ # Node/Express backend
│ ├── index.js # App bootstrap
│ ├── config.js # Env + config loader
│ ├── routes/ # REST API routes
│ ├── services/ # Business logic
│ ├── middleware/ # Auth, logging, errors
│ ├── db/
│ │ ├── pg-init.js # Postgres pool + init
│ │ ├── schema.sql # DB schema reference
│ │ └── utils.js # Case code generator etc.
│ ├── jobs/ # AI insight scheduler
│ └── package.json

├── posh-knowledge-mcp/ # MCP Knowledge Server: Act, Rules, Case Law
│ ├── src/
│ └── package.json

├── tests/ # Playwright test suite
│ ├── employee/
│ ├── ic/
│ ├── cases/
│ └── intake/
│
├── docs/ & guides:
│ ├── LOCAL_LAUNCH_GUIDE.md
│ ├── API_DOCUMENTATION.md
│ ├── RAILWAY_DEPLOYMENT_GUIDE.md
│ ├── RENDER_DEPLOYMENT_GUIDE.md
│ ├── TEST_PLAN.md
│ ├── DESIGN_SYSTEM.md
│ ├── PILOT_USER_GUIDE.md
│ └── CONDUCTOS_TESTING_VALIDATION_GUIDE.md
│
├── railway.toml # Railway deployment config
├── render.yaml # Render deployment blueprint
├── playwright.config.js # Test config
├── .env.example # Example environment
└── package.json # Monorepo root

markdown
Copy code

---

# 🧠 Core System Capabilities

## 🔹 1. Case Management
- Create, update, and manage PoSH cases
- Automatic case code generation (`KELP-YYYY-NNNN`)
- Full lifecycle support:
  - New → Under Review → Conciliation → Investigation → Decision Pending → Closed
- Status history & immutable audit trail
- Deadline management (90-day PoSH timelines)

## 🔹 2. Employee Experience
- Guided case submission (anonymous or identified)
- Psychological safety oriented UI
- Track your case status
- Educational content + policy awareness

## 🔹 3. Internal Committee (IC) Experience
- Case dashboards by urgency, deadline, status
- Role-based access control (RBAC)
- Investigation tools and document flows
- AI-assisted reasoning, summaries, and pattern detection

## 🔹 4. AI & Automation
- `/api/chat` — conversational guidance using OpenAI/Anthropic
- Multi-Agent Orchestrator:
  - Policy lookup agent
  - IC assistant agent
  - Sentiment analysis agent
  - Pattern-detection agent
- MCP Knowledge Server:
  - Full PoSH Act text
  - Rules
  - Case law summaries
  - Templates and checklists

## 🔹 5. Security & Compliance
- JWT authentication  
- Roles: `employee`, `ic_member`, `hr_admin`, `super_admin`
- Organization-scoped data access (multi-tenant ready)
- bcrypt password hashing, resets, lockout
- Strict validation on all inputs
- No sensitive info stored in logs

---

# ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://localhost:5432/conductos

JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@conductos.app
For production, see:

RAILWAY_ENV_VARS.md

RENDER_DEPLOYMENT_GUIDE.md

🛠 Local Development (Ubuntu, macOS, Windows)
1. Install dependencies
bash
Copy code
npm install
2. Setup database
bash
Copy code
# Create schema in Postgres
npm run db:init

# Optional demo users + sample cases
npm run seed:demo
3. Start development servers
bash
Copy code
npm run dev
Backend → http://localhost:3001

Frontend → http://localhost:5173

Health Check:

bash
Copy code
GET http://localhost:3001/api/health
🌐 Deployment Guide
🚉 Railway Deployment
railway.toml config included

Railway auto-injects DATABASE_URL

Commands:

bash
Copy code
# Build frontend for production
npm run railway:build

# Start backend + serve client
npm run railway:start
See RAILWAY_DEPLOYMENT_GUIDE.md.

🟦 Render Deployment
Render uses the render-deployment branch + blueprint defined in:

Copy code
render.yaml
See RENDER_DEPLOYMENT_GUIDE.md for:

service creation

environment variables

logging & monitoring

multi-environment setup

🧪 Testing
Playwright E2E tests cover:

Employee flows

IC flows

Intake & submission

Authentication

Case lifecycle

Mobile view tests

Run full test suite:

bash
Copy code
npm test
Focus runs:

bash
Copy code
npm run test:ui
npm run test:employee
npm run test:ic
npm run test:cases
npm run test:intake
npm run test:mobile
npm run test:report
See:

TEST_PLAN.md

MANUAL_TEST_SCRIPT.md

CONDUCTOS_TESTING_VALIDATION_GUIDE.md

🎨 Design System
ConductOS follows trauma-informed UI principles:

Empathy-first messaging

High contrast for accessibility

Simple, forgiving flows

Consistent components & spacing

Tailwind utility conventions

See DESIGN_SYSTEM.md for:

Tokens

Spacing

Typography

Component primitives

🧩 Architecture Overview
Frontend
React + Vite

Client-side routing

Centralized API client

Design-system driven UI

Future-ready for multilingual expansion (react-i18next compatible)

Backend
Modular Express API

Services layer decoupled from routes

Repository-style Postgres access

Strong input validation (moving toward Zod)

AI orchestrator endpoints

MCP server for PoSH knowledge artifacts

Database (Postgres)
cases

status_history

users

organizations

audit_log

ic_members

resend_email_log

🔮 Roadmap
Immediate
Add multilingual foundation (i18n keys, translation extraction)

Centralize validation with Zod

Add repository pattern for DB access

Add global error middleware + structured logging

Medium Term
Expand PoSH MCP server with more tools

Improve insights + agent orchestration

Add organization onboarding wizard

Add metrics dashboard (case volume, SLA breaches)

Long Term
Full multilingual UI (English, Hindi, Tamil, Telugu)

Server-side notifications per language

Move to Next.js 15 app router architecture (optional)

AI-assisted IC report drafting

Auto-classification of case types

🤝 Contributing
Create a feature branch from main or render-deployment

Add tests where applicable

Follow the design system for UI changes

Document new endpoints in API_DOCUMENTATION.md

Run npm test before pushing

🛡 License
Private / Proprietary — Not for public distribution.

ConductOS is designed to create safer workplaces with compassion, structure, and intelligence.
