# New Features Testing Guide

All new features have been seeded with realistic test data. Follow this guide to test each feature.

## 🌐 Application URLs

- **Frontend**: http://localhost:5175/
- **Backend API**: http://localhost:3001/api

## 👤 Test Users

Use these credentials to login:

- **HR Admin**: admin@demo.kelphr.com / Admin@123456
- **IC Member**: priya.sharma@demo.kelphr.com / password123
- **IC Member 2**: rahul.verma@demo.kelphr.com / password123

---

## 📚 1. Knowledge Base

**What it does**: Centralized document repository with AI-powered search and embeddings.

**How to test**:
1. Login as HR Admin
2. Navigate to Knowledge Base (should be in main navigation)
3. View the 4 pre-seeded documents:
   - POSH Act 2013 - Complete Guide
   - IC Committee Best Practices
   - Complaint Investigation Framework
   - Annual Compliance Checklist
4. Test search functionality (embeddings are generated!)
5. Upload a new document
6. Tag and categorize documents

**Test Data Seeded**:
- 4 policy documents with embeddings generated
- Tags: 'posh', 'legal', 'compliance', 'investigation'

---

## 🔍 2. Pattern Analysis

**What it does**: AI-powered detection of patterns and trends in complaints.

**How to test**:
1. Login as HR Admin or IC Member
2. Navigate to Pattern Analysis dashboard
3. Review detected patterns:
   - "Multiple complaints from Engineering dept" (HIGH severity)
   - "Complaints spike after office parties" (MEDIUM severity)
   - "Same respondent in multiple cases" (CRITICAL severity)
4. View related cases for each pattern
5. Mark patterns as "monitoring" or "resolved"

**Test Data Seeded**:
- 3 patterns with different severity levels
- Linked to existing cases
- Frequency counts and metadata

**API Endpoint to test**: GET /api/patterns

---

## 💡 3. Proactive Insights

**What it does**: AI-generated recommendations and compliance alerts.

**How to test**:
1. Login as HR Admin
2. Navigate to Insights dashboard
3. Review 3 proactive insights:
   - "IC Committee requires external member" (HIGH priority)
   - "Awareness training overdue for 45% of employees" (MEDIUM priority)
   - "2 cases approaching 90-day deadline" (CRITICAL priority)
4. View recommendations for each insight
5. Acknowledge insights
6. Mark insights as "in_progress" or "resolved"

**Test Data Seeded**:
- 3 insights covering compliance, training, and case management
- Action recommendations included
- Different priority levels

**API Endpoint to test**: GET /api/insights

---

## 📎 4. Evidence Management

**What it does**: Track and manage evidence for each case with chain of custody.

**How to test**:
1. Login as IC Member
2. Open any case from the dashboard
3. Navigate to Evidence tab
4. View seeded evidence:
   - Email chain showing inappropriate messages
   - Screenshots of chat messages
   - Witness statements
   - Complainant written statement
5. Upload new evidence
6. View chain of custody logs
7. Tag evidence as "critical" or "supporting"

**Test Data Seeded**:
- 4 evidence items linked to cases
- Different evidence types: email, screenshot, witness_statement, document
- Chain of custody tracking enabled

**API Endpoint to test**: GET /api/evidence?case_id={caseId}

---

## 🎤 5. Interviews

**What it does**: Schedule and document interviews with complainants, respondents, and witnesses.

**How to test**:
1. Login as IC Member
2. Open any case
3. Navigate to Interviews tab
4. View seeded interviews:
   - Complainant Interview (COMPLETED)
   - Respondent Interview (COMPLETED)
   - Witness Interview (COMPLETED)
   - Department Manager Interview (SCHEDULED)
5. Schedule a new interview
6. Record interview notes and key findings
7. Update interview status

**Test Data Seeded**:
- 4 interviews per case (some completed, one scheduled)
- Key findings documented
- Scheduled and conducted dates

**API Endpoint to test**: GET /api/interviews?case_id={caseId}

---

## 👥 6. External Member Portal

**What it does**: Secure portal for external IC members to access cases.

**How to test**:
1. Two external members have been seeded:
   - Adv. Meera Krishnan (meera.krishnan@lawfirm.com)
   - Dr. Anjali Mehta (anjali.mehta@ngo.org)
2. Navigate to External Members management (HR Admin only)
3. View external member profiles
4. Generate access tokens for external members
5. External members can access portal using token-based auth
6. Review their expertise and credentials

**Test Data Seeded**:
- 2 external members with full profiles
- Expertise areas: POSH Law, Labour Law, Social Work, Counselling
- Bio and organization details

**API Endpoint to test**: GET /api/external/members

---

## 📊 7. Monitoring Dashboard

**What it does**: Real-time monitoring of API performance, AI usage, and system health.

**How to test**:
1. Login as HR Admin (Admin access required)
2. Navigate to Monitoring Dashboard
3. View API Health metrics:
   - Total requests (20 sample logs)
   - Error rate
   - Average response time
   - P95 and P99 latencies
4. View AI Usage metrics:
   - 10 AI interactions logged
   - Token usage (input/output)
   - Estimated costs
   - Model: claude-sonnet-4-20250514
5. Check active alerts:
   - "Case CASE-2025-003 approaching 90-day deadline"
6. View request rate graphs

**Test Data Seeded**:
- 20 API request logs (last 24 hours)
- 10 AI usage logs with cost estimates
- 1 active monitoring alert (WARNING severity)

**API Endpoints to test**:
- GET /api/monitoring/dashboard (requires admin)
- GET /api/monitoring/analytics
- GET /api/monitoring/ai-costs
- GET /api/monitoring/alerts

---

## 🤖 8. IC Copilot

**What it does**: AI assistant for IC members to help with case analysis.

**How to test**:
1. Login as IC Member
2. Open any case
3. Look for "Copilot" button or chat interface
4. Ask questions like:
   - "Summarize this case"
   - "What evidence do we have?"
   - "Suggest next steps"
   - "Check for similar patterns"
5. Copilot will use:
   - Case details
   - Evidence items
   - Interview findings
   - Knowledge base documents (with embeddings!)
   - Detected patterns

**Requirements**:
- OpenAI API key is configured ✅
- Embeddings are generated for knowledge base ✅

---

## 📱 9. PWA (Progressive Web App)

**What it does**: Install the app on mobile/desktop, works offline.

**How to test**:
1. Open http://localhost:5175/ in Chrome/Edge
2. Click install icon in address bar
3. App should install as standalone application
4. Test offline functionality:
   - Go offline (airplane mode or disconnect WiFi)
   - App should still load cached content
5. Test push notifications (if configured)

**Files to check**:
- `/public/manifest.json` - PWA manifest
- `/public/sw.js` - Service worker
- `/public/offline.html` - Offline fallback

---

## 🔔 10. Push Notifications

**What it does**: Send real-time notifications to users.

**How to test**:
1. Login and grant notification permissions
2. Subscribe to push notifications
3. Trigger events that should send notifications:
   - New case assignment
   - Case status change
   - Approaching deadlines
   - New evidence added
4. Check `push_subscriptions` table for registered devices

**Test Data Seeded**:
- Push subscriptions table created
- VAPID keys need to be configured in .env

---

## 🧪 API Testing with cURL

Test any API endpoint directly:

```bash
# Get auth token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.kelphr.com","password":"Admin@123456"}'

# Use token in subsequent requests
TOKEN="your_token_here"

# Get patterns
curl http://localhost:3001/api/patterns \
  -H "Authorization: Bearer $TOKEN"

# Get insights
curl http://localhost:3001/api/insights \
  -H "Authorization: Bearer $TOKEN"

# Get documents
curl http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN"

# Get monitoring dashboard (admin only)
curl http://localhost:3001/api/monitoring/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Verification

Check the seeded data directly in PostgreSQL:

```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/conductos

# View seeded tables
\dt

# Sample queries
SELECT COUNT(*) FROM documents;  -- Should show 4
SELECT * FROM patterns;          -- Should show 3
SELECT * FROM insights;          -- Should show 3
SELECT * FROM evidence;          -- Should show 4
SELECT * FROM interviews;        -- Should show 4
SELECT * FROM external_members;  -- Should show 2
SELECT COUNT(*) FROM api_request_logs;  -- Should show 20
SELECT COUNT(*) FROM ai_usage_logs;     -- Should show 10

# Check embeddings were generated
SELECT COUNT(*) FROM document_chunks WHERE embedding_data IS NOT NULL;  -- Should show 4
```

---

## 🐛 Troubleshooting

### Issue: OpenAI API calls failing
**Solution**: Check that OPENAI_API_KEY is set in `.env` file

### Issue: Embeddings not working
**Solution**: Run the seed script again: `node server/scripts/seedNewFeatures.js`

### Issue: Tables missing
**Solution**: The seed script creates all tables automatically. Just run it once.

### Issue: Auth errors on protected routes
**Solution**:
1. Make sure you're logged in
2. Token might have expired - login again
3. Some routes require admin role

### Issue: Monitoring dashboard shows no data
**Solution**: The monitoring middleware logs requests automatically. Just use the app and data will accumulate.

---

## 📝 Next Steps

After testing, you can:

1. **Customize the data**: Modify `server/scripts/seedNewFeatures.js` and re-run
2. **Add more test cases**: Use existing seed scripts to add cases
3. **Test with real files**: Upload actual documents to test file handling
4. **Performance testing**: The monitoring dashboard tracks all metrics
5. **Production deployment**: All tables and features are production-ready

---

## 🎯 Feature Completion Checklist

- ✅ Knowledge Base with embeddings
- ✅ Pattern Analysis with AI detection
- ✅ Proactive Insights with recommendations
- ✅ Evidence Management with chain of custody
- ✅ Interview Scheduling and Documentation
- ✅ External Member Portal
- ✅ Monitoring Dashboard with metrics
- ✅ API request and AI usage logging
- ✅ PWA support
- ✅ Push Notifications infrastructure

**All features are seeded and ready to test!** 🚀
