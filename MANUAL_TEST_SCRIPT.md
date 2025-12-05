# ConductOS Manual Test Script

**Application Running At:** http://localhost:5173
**Test Data:** 12 pre-seeded cases including 2 overdue

---

## 🎯 Complete Testing Workflow

### PHASE 1: Employee Mode - Information Requests (2 min)

**Objective:** Test employee-facing informational features

1. **Open** http://localhost:5173
2. **Verify** you see "Employee Portal" in header
3. **Verify** mode badge shows "Employee Mode" (blue)
4. **Type:** `What is PoSH?`
5. **Expected:** System provides information about PoSH Act
6. **Screenshot Location:** Shows informative response

---

### PHASE 2: IC Mode - Case Viewing (3 min)

**Objective:** Test case listing and filtering

#### Test 2a: View All Cases
1. **Click** "IC Mode" button in sidebar (purple button)
2. **Verify** header changes to "Investigation Committee"
3. **Verify** mode badge changes to "IC Mode" (purple)
4. **Click** "Show All Cases" chip
5. **Expected:** List of 12 case cards appears
6. **Verify Each Card Shows:**
   - Case code (KELP-2025-XXXX)
   - Status badge (colored)
   - Incident date
   - Description preview
   - Deadline information

#### Test 2b: Filter Pending Cases
1. **Click** "Pending" chip
2. **Expected:** Shows 6 pending cases
3. **Verify:** Summary says "Showing 6 pending cases"

#### Test 2c: Filter Overdue Cases
1. **Click** "Overdue" chip
2. **Expected:**
   - Red alert banner: "⚠️ Urgent: 2 Cases Past Statutory Deadline"
   - Shows 2 cases: KELP-2025-0003, KELP-2025-0004
   - Each has red "⚠️ 5 days overdue" badge
   - Alert mentions "90-day statutory deadline"

#### Test 2d: View Case Details
1. **Type:** `status KELP-2025-0001`
2. **Expected:** Detailed case view showing:
   - Large case code header
   - Status badge
   - Filed/Incident/Deadline dates
   - Full description
   - Complainant information
   - Status History Timeline with dots and transitions

---

### PHASE 3: IC Mode - Case Search (1 min)

1. **Type:** `KELP-2025-0002`
2. **Expected:** Shows details for case 0002 (anonymous case)
3. **Verify:** Shows "Anonymous" badge
4. **Verify:** Contact info says "Limited disclosure"

---

### PHASE 4: Mobile Responsive Testing (2 min)

**Objective:** Verify mobile optimization

1. **Open DevTools** (F12)
2. **Click** Device Toolbar icon (or Ctrl+Shift+M)
3. **Select** "iPhone 12" or "iPhone SE"
4. **Refresh** page

#### Mobile Checklist:
- ✅ Hamburger menu visible (≡ icon)
- ✅ Sidebar hidden by default
- ✅ Quick chips scroll horizontally
- ✅ Messages are full-width (90% of screen)
- ✅ Input is 16px font size (no zoom on tap)
- ✅ Send button is 48x48px (easy to tap)
- ✅ Mode badge fits in header
- ✅ No horizontal scroll

---

### PHASE 5: Mode Switching (1 min)

1. **Switch to Employee Mode**
2. **Type:** `Check my case status`
3. **Expected:** Prompts for case code
4. **Type:** `KELP-2025-0001`
5. **Expected:** Shows basic case info (limited employee view)

6. **Switch to IC Mode**
7. **Type:** `status KELP-2025-0001`
8. **Expected:** Shows full case details including timeline

---

## 📊 API Direct Testing

Open browser console (F12 → Console tab) and run these:

```javascript
// Test 1: Employee - Report Harassment Intent
fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'I want to report harassment', mode: 'employee'})
}).then(r => r.json()).then(console.log)
// Expected: {type: 'intake_start', content: {message: '...', next_step: 'incident_date'}}

// Test 2: IC - Show All Cases
fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'show all cases', mode: 'ic'})
}).then(r => r.json()).then(console.log)
// Expected: {type: 'case_list', content: {cases: [...12 cases], summary: '...'}}

// Test 3: IC - Get Overdue
fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'overdue', mode: 'ic'})
}).then(r => r.json()).then(console.log)
// Expected: {type: 'case_list', content: {cases: [2 overdue cases], summary: '⚠️ 2 overdue...'}}

// Test 4: IC - Case Detail
fetch('/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'status KELP-2025-0001', mode: 'ic'})
}).then(r => r.json()).then(console.log)
// Expected: {type: 'case_detail', content: {case: {...}, history: [...]}}

// Test 5: Dashboard Summary
fetch('/api/dashboard/summary')
  .then(r => r.json())
  .then(console.log)
// Expected: {total_active: 12, by_status: {...}, overdue_count: 2, due_today: 1}
```

---

## ✅ Success Criteria

### Visual Tests
- [ ] Employee portal loads correctly
- [ ] IC dashboard loads correctly
- [ ] Mode switching works smoothly
- [ ] Case cards display with proper styling
- [ ] Status badges are color-coded correctly
- [ ] Overdue alert appears for overdue cases
- [ ] Anonymous badge appears on anonymous cases
- [ ] Mobile layout responsive and usable

### Functional Tests
- [ ] Can view all 12 cases
- [ ] Can filter by pending (shows 6)
- [ ] Can filter by overdue (shows 2 with alert)
- [ ] Can view individual case details
- [ ] Status history timeline displays
- [ ] Quick chips trigger correct actions
- [ ] Input field works properly
- [ ] Send button enables/disables correctly

### Performance Tests
- [ ] Page loads < 2 seconds
- [ ] API responses < 500ms
- [ ] No console errors (check F12)
- [ ] No 404 network requests
- [ ] Smooth animations and transitions

---

## 🐛 Known Issues (From Playwright Tests)

1. **Typing Indicator:** `.animate-pulse` class not rendering
   - **Impact:** Low - typing indicator might not show
   - **Fix:** Check TypingIndicator component

2. **Intake Flow:** Not triggering from chat in UI
   - **Impact:** High - employees can't file complaints via chat
   - **Status:** API works, frontend integration issue
   - **Workaround:** Use quick chip "I want to report harassment"

---

## 🎬 Demo Script for Stakeholders

**5-Minute Demo Flow:**

1. **Introduction** (30s)
   - "This is ConductOS, our PoSH Act compliance platform"
   - "Two modes: Employee Portal and IC Dashboard"

2. **Employee Mode** (1 min)
   - Show information request: "What is PoSH?"
   - Demonstrate quick chips
   - Show clean, simple interface

3. **IC Dashboard** (2 min)
   - Switch to IC Mode
   - "Show All Cases" - display 12 cases
   - **Highlight overdue alert** - "System tracks 90-day deadline"
   - Click "Overdue" - show urgent cases
   - Open case detail - show full timeline

4. **Mobile View** (1 min)
   - Switch to mobile viewport
   - Show responsive design
   - Demonstrate hamburger menu
   - "Optimized for employees filing from phones"

5. **Key Features** (30s)
   - Anonymous reporting
   - Automated deadline tracking
   - Status history audit trail
   - Natural language interface

---

## 📝 Test Results Template

**Test Date:** ___________
**Tester:** ___________
**Browser:** Chrome / Firefox / Safari
**Viewport:** Desktop / Mobile

| Test ID | Description | Pass/Fail | Notes |
|---------|-------------|-----------|-------|
| E1 | Employee portal loads | | |
| E2 | Information requests work | | |
| IC1 | Show all cases (12 displayed) | | |
| IC2 | Pending filter (6 cases) | | |
| IC3 | Overdue filter (2 + alert) | | |
| IC4 | Case detail view | | |
| IC5 | Status history timeline | | |
| M1 | Mobile responsive layout | | |
| M2 | Touch targets adequate | | |
| M3 | No horizontal scroll | | |
| P1 | Load time < 2s | | |
| P2 | No console errors | | |

**Overall Result:** Pass / Fail
**Critical Issues:** ___________
**Minor Issues:** ___________

---

## 🔧 Quick Fixes

If something doesn't work:

1. **Refresh the page** (Ctrl+R)
2. **Check dev server is running** - should see "Server running on port 3001"
3. **Check browser console** (F12) for errors
4. **Verify database has data:**
   ```bash
   PGPASSWORD=postgres psql -h localhost -U postgres -d conductos -c "SELECT COUNT(*) FROM cases;"
   ```
   Should return: 12

5. **Reseed if needed:**
   ```bash
   cd /home/jbandu/github/conductos/server
   node db/seed.js
   ```

---

## 🎯 Next Steps After Manual Testing

1. Document any bugs found
2. Fix critical issues (intake flow, typing indicator)
3. Run full Playwright suite
4. Performance profiling
5. Security audit
6. User acceptance testing (UAT)
7. Production deployment preparation

---

**Happy Testing! 🚀**
