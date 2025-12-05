# ConductOS Testing & Validation Guide

This guide walks you through configuring the database, loading realistic data, and validating each module of ConductOS end to end.

---

## Phase 1: Database Setup

### 1.1 Environment Variables

Create a `.env` file in the repo root and include the following values (update credentials as needed):

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/conductos?sslmode=require

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# App Config
NODE_ENV=development
PORT=3000

# Optional: For evidence storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
EVIDENCE_BUCKET=conductos-evidence-dev
```

### 1.2 Run Migrations

Use the migration runner to apply all SQL migrations in order:

```bash
node server/scripts/runMigrations.js
```

---

## Phase 2: Knowledge Base Data

### 2.1 Seed Patterns

Seed the case pattern library to power risk analysis and similarity matching:

```bash
node server/scripts/seedPatterns.js
```

The dataset includes:
- Senior Executive – Quid Pro Quo
- Peer-Level Hostile Environment
- Client/Vendor Harassment
- Repeat Offender Pattern
- Anonymous – Department Cluster

---

## Phase 3: Test Case Data

Load demo cases to validate dashboards and alerts. (If you prefer to re-use existing demo seeds, run `npm run seed:demo`.)

```javascript
// Example shape for a seeded case
{
  case_code: 'KELP-2025-0005',
  status: 'investigating',
  description: 'Physical harassment allegation during office party... ',
  incident_date: '2025-10-25',
  complainant_name: 'Sunita Reddy',
  respondent_name: 'Manoj Gupta',
  is_anonymous: false,
  conciliation_requested: false,
  days_to_deadline: 12 // urgent
}
```

---

## Phase 4: Pattern Analysis Data

Patterns seeded in Phase 2 include risk factors, recommended approaches, success factors, and pitfalls. Verify that frequency and confidence are visible in the UI.

---

## Phase 5: Run All Seeds

You can chain migration and seeding commands to prepare a fresh environment:

```bash
node server/scripts/runMigrations.js && node server/scripts/seedPatterns.js && npm run seed:demo
```

---

## Phase 6: Validation Checklist

### Knowledge Base ✓
- [ ] Search for "Section 4" - should return IC composition requirements
- [ ] Search for "90 days" - should return inquiry timeline requirements
- [ ] Click on a document - should show full content
- [ ] Verify PoSH Act sections are loaded

### Pattern Analysis ✓
- [ ] View pattern list - should show 5 patterns
- [ ] Click "Repeat Offender Pattern" - should show risk factors
- [ ] Verify patterns show frequency and confidence scores

### Proactive Insights ✓
- [ ] Check deadline alerts - KELP-2025-0005 should show as urgent (12 days)
- [ ] Verify compliance alerts appear
- [ ] Click on insight - should show recommended actions

### Case Management ✓
- [ ] View case list - should show seeded test cases
- [ ] Filter by status - try "investigating"
- [ ] Click on case - should show full details
- [ ] Verify deadline countdown is correct

### IC Copilot ✓
- [ ] Ask: "What is the 90-day timeline requirement?"
- [ ] Ask: "How do I handle an anonymous complaint?"
- [ ] Ask about specific case: "What are next steps for KELP-2025-0005?"
- [ ] Verify citations appear in response

### Document Generation ✓
- [ ] Generate acknowledgment letter for a case
- [ ] Generate Notice to Respondent
- [ ] Verify placeholders are filled correctly

---

## Quick Start Commands

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY

# 2. Install dependencies
npm install

# 3. Run migrations and seeds
node server/scripts/runMigrations.js
node server/scripts/seedPatterns.js
npm run seed:demo

# 4. Start the app
npm run dev

# 5. Test IC Copilot endpoint
curl -X POST http://localhost:3000/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the timeline for completing an inquiry?"}'
```

---

## Troubleshooting

### Database Connection Issues
```bash
node -e "
  const pg = require('pg');
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  pool.query('SELECT NOW()').then(r => console.log('Connected:', r.rows[0])).catch(console.error);
"
```

### Missing Tables
```bash
node -e "
  const pg = require('pg');
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\")
    .then(r => r.rows.forEach(t => console.log(t.table_name)));
"
```

### API Key Issues
```bash
node -e "
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{role: 'user', content: 'Say hello'}]
  }).then(r => console.log(r.content[0].text)).catch(console.error);
"
```
