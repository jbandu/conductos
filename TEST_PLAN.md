# ConductOS Test Plan

## Test Data Summary

The database has been seeded with 12 comprehensive test cases:

### Cases by Status:
- **New (4 cases):** KELP-2025-0005, KELP-2025-0007, KELP-2025-0010, KELP-2025-0012
- **Under Review (2 cases):** KELP-2025-0002, KELP-2025-0008
- **Investigating (3 cases):** KELP-2025-0001, KELP-2025-0004, KELP-2025-0009
- **Conciliation (1 case):** KELP-2025-0006
- **Decision Pending (2 cases):** KELP-2025-0003, KELP-2025-0011

### Special Cases:
- **Overdue Cases:** KELP-2025-0003 (61 days old), KELP-2025-0004 (82 days old)
- **Due Today:** KELP-2025-0012 (filed today)
- **Anonymous Cases:** KELP-2025-0002 (Employee-A), KELP-2025-0005 (Complainant-B), KELP-2025-0008 (Employee-C), KELP-2025-0012 (Witness-X)
- **With Conciliation:** KELP-2025-0003, KELP-2025-0006, KELP-2025-0009

---

## Employee Mode Tests

### Test 1: File Complaint with Full Identity ✅
**Objective:** Verify named complaint submission generates case code

**Steps:**
1. Open http://localhost:5173 in browser
2. Ensure in "Employee Mode"
3. Click "I want to report harassment"
4. Click "Continue" on pre-intake
5. Select incident date (e.g., 2024-11-20)
6. Enter description (min 50 chars): "Detailed description of inappropriate behavior at workplace during team meeting on November 20th."
7. Select conciliation: "No, proceed with inquiry"
8. Select anonymity: "No, share my identity"
9. Enter name: "Test User"
10. Enter email: "test.user@company.com"
11. Review summary, click "Submit"

**Expected Result:**
- Case code generated (KELP-2025-XXXX format)
- Success message displayed
- Case appears in IC dashboard

---

### Test 2: File Anonymous Complaint ✅
**Objective:** Verify anonymous submission with alias

**Steps:**
1. Click "I want to report harassment"
2. Continue through pre-intake
3. Select incident date (past date)
4. Enter description (min 50 chars): "Anonymous report of harassment. I prefer to remain anonymous due to fear of retaliation from my supervisor."
5. Select conciliation: "No, proceed with inquiry"
6. Select anonymity: "Yes, limited anonymity"
7. Enter alias: "Employee-TestAlias"
8. Enter contact method: "test-anonymous@protonmail.com"
9. Submit

**Expected Result:**
- Case created with alias
- Email/phone stored as contact method
- IC dashboard shows "Anonymous" badge
- Only Presiding Officer sees real contact

---

### Test 3: Try Future Date (Validation) ❌
**Objective:** System rejects future incident dates

**Steps:**
1. Start complaint flow
2. Select incident date: Tomorrow's date
3. Try to click "Next"

**Expected Result:**
- Error message: "Incident date cannot be in the future"
- Cannot proceed to next step
- Date input highlighted in red

---

### Test 4: Try Short Description (Validation) ❌
**Objective:** System rejects description < 50 characters

**Steps:**
1. Start complaint flow
2. Fill incident date correctly
3. Enter description: "Short text" (< 50 chars)
4. Try to click "Next"

**Expected Result:**
- Error message: "Description must be at least 50 characters"
- Character counter shows: "10/50 characters"
- Cannot proceed

---

### Test 5: Check Case Status ✅
**Objective:** Employee can check their case status

**Steps:**
1. In Employee Mode
2. Type in chat: "status KELP-2025-0001"
3. Or click "Check my case status" chip, then enter code

**Expected Result:**
- Case details displayed
- Shows current status badge
- Shows filed date, incident date, deadline
- Shows status history timeline
- For anonymous cases, shows limited info

---

## IC Mode Tests

### Test 6: Show All Cases ✅
**Objective:** Display complete case list

**Steps:**
1. Switch to "IC Mode" using toggle
2. Click "Show All Cases" quick chip
3. Or type: "show all cases"

**Expected Result:**
- All 12 cases displayed as cards
- Each card shows:
  - Case code (KELP-2025-XXXX)
  - Status badge (color-coded)
  - Incident date
  - Description preview (truncated)
  - Anonymous indicator (if applicable)
  - Conciliation indicator (if applicable)
  - Deadline warning (days remaining or overdue)
- Summary text: "Showing 12 cases"

---

### Test 7: Pending Filter ✅
**Objective:** Filter cases by pending status

**Steps:**
1. In IC Mode
2. Click "Pending" quick chip
3. Or type: "pending"

**Expected Result:**
- Shows only cases with status: new, under_review
- Should display 6 cases (4 new + 2 under_review)
- Summary: "Showing 6 pending cases"

---

### Test 8: Overdue Filter ⚠️
**Objective:** Show cases past 90-day deadline

**Steps:**
1. In IC Mode
2. Click "Overdue" quick chip
3. Or type: "overdue"

**Expected Result:**
- Shows KELP-2025-0003 (61 days overdue)
- Shows KELP-2025-0004 (82 days overdue)
- Red alert banner at top: "⚠️ Urgent: 2 Cases Past Statutory Deadline"
- Each card shows red "⚠️ X days overdue" badge
- Alert mentions PoSH Act 90-day requirement

---

### Test 9: Case Detail View ✅
**Objective:** View full case details

**Steps:**
1. In IC Mode
2. Type: "status KELP-2025-0001"
3. Or click "Show All Cases" then click any case card

**Expected Result:**
- Large case code header (KELP-2025-0001)
- Status badge
- Three-column date grid:
  - Filed: [date]
  - Incident Date: [date]
  - Deadline: [date]
- Full description (not truncated)
- Deadline status bar (green/yellow/red based on urgency)
- Complainant info (full name or "Anonymous (Limited disclosure)")
- Conciliation status
- Status History Timeline:
  - Vertical timeline with dots
  - Each status change with date
  - Status badges showing transition (old → new)
  - Notes for each change

---

### Test 10: Status Update 🔧
**Objective:** Update case status

**Steps:**
1. In IC Mode
2. Type: "update KELP-2025-0001 status investigating"
3. Confirm update

**Expected Result:**
- Success message: "✅ Status updated to investigating"
- Case card reflects new status
- Status history shows new entry:
  - Old status → New status
  - Timestamp
  - Notes: "Status updated to investigating"
- Deadline remains unchanged

**Valid status values:**
- new
- under_review
- conciliation
- investigating
- decision_pending
- closed

---

## Mobile Responsive Tests

### Test 11: Mobile Safari (iPhone) 📱
**Objective:** Verify responsive design on mobile

**Steps:**
1. Open http://localhost:5173 on iPhone Safari (or Chrome DevTools mobile)
2. Viewport: 375x667 (iPhone SE) or 390x844 (iPhone 12)

**Expected Result:**
- Hamburger menu visible (three horizontal lines)
- Sidebar hidden by default
- Quick chips horizontally scrollable
- Input field min 16px font (prevents zoom)
- Send button 48x48px (touch-friendly)
- Messages max-width 90% of screen
- Safe area padding for notch (iPhone X+)
- No horizontal scroll

---

### Test 12: File Complaint on Mobile 📱
**Objective:** Complete intake flow on mobile

**Steps:**
1. On mobile browser
2. Click "I want to report harassment"
3. Complete entire intake flow
4. Use native date picker
5. Type description using mobile keyboard
6. Submit

**Expected Result:**
- Flow works smoothly on mobile
- Native HTML5 date picker appears
- Textarea expands properly
- Buttons are tappable (min 44px height)
- No zoom on input focus (16px font)
- Virtual keyboard doesn't break layout
- Can scroll through all fields

---

### Test 13: Sidebar Hamburger Menu 📱
**Objective:** Mobile sidebar interaction

**Steps:**
1. On mobile viewport
2. Click hamburger icon (top-left)
3. Sidebar slides in from left
4. Click outside or X to close

**Expected Result:**
- Sidebar overlay slides in
- Backdrop darkens main content
- Can switch modes (Employee ↔ IC)
- Can see recent cases (if any)
- Clicking backdrop closes sidebar
- Smooth animation

---

### Test 14: Horizontal Chip Scrolling 📱
**Objective:** Verify chip container scrolls

**Steps:**
1. On mobile viewport (375px width)
2. Look at quick action chips
3. Try to swipe horizontally

**Expected Result:**
- Chips overflow horizontally
- Can scroll to see all chips
- No horizontal page scroll
- Smooth scroll behavior
- Last chip visible when scrolled right

---

## Integration Tests

### Test 15: End-to-End Flow ✅
**Complete workflow test**

**Steps:**
1. Employee files complaint → generates KELP-2025-XXXX
2. Switch to IC Mode
3. IC sees case in "Show All Cases"
4. IC filters by "Pending" → case appears
5. IC views case details
6. IC updates status to "under_review"
7. Switch back to Employee Mode
8. Employee checks status → sees "Under Review"
9. Status history shows update with timestamp

**Expected Result:**
- All steps complete successfully
- Data consistent across modes
- Updates reflect immediately
- Status history accurate

---

### Test 16: Overdue Case Alert 🔴
**Critical deadline test**

**Steps:**
1. Verify KELP-2025-0003 and KELP-2025-0004 are overdue (created 90+ days ago)
2. In IC Mode, click "Overdue"
3. Check alert banner

**Expected Result:**
- Red alert banner visible at top
- Text: "⚠️ Urgent: 2 Cases Past Statutory Deadline"
- Button: "View Overdue Cases"
- Each overdue case shows red badge: "⚠️ X days overdue"
- Alert mentions "90-day statutory deadline mandated by PoSH Act"

---

### Test 17: Dashboard Summary 📊
**Statistics display**

**Steps:**
1. Switch to IC Mode
2. Look for dashboard summary card (if implemented)

**Expected Result:**
- Total Active Cases: 12
- By Status breakdown:
  - New: 4
  - Under Review: 2
  - Investigating: 3
  - Conciliation: 1
  - Decision Pending: 2
- Overdue Count: 2
- Due Today: 1
- Due This Week: 1

---

### Test 18: Search Functionality 🔍
**Case search**

**Steps:**
1. In IC Mode
2. Type various search queries:
   - "KELP-2025-0001" (exact code)
   - "status KELP-2025-0001" (status command)
   - "gender" (keyword search)
   - "harassment" (keyword search)

**Expected Result:**
- Exact code match shows that case
- Status command shows case details
- Keyword search shows relevant cases
- No match shows "No cases found"

---

## Performance Tests

### Test 19: Load Time ⚡
**Page load performance**

**Metrics to check:**
- Initial page load: < 2 seconds
- API response time: < 500ms
- Case list render: < 1 second for 12 cases
- No console errors
- No 404 requests

---

### Test 20: Concurrent Users 👥
**Multi-user scenario**

**Steps:**
1. Open app in two different browsers
2. Browser A: Employee files complaint
3. Browser B: IC mode refreshes
4. Browser B should see new case

**Expected Result:**
- No conflicts
- Both views consistent
- No data loss
- Proper isolation

---

## Accessibility Tests

### Test 21: Keyboard Navigation ⌨️
**WCAG compliance**

**Steps:**
1. Use Tab key to navigate
2. Try Enter/Space to activate
3. Use Escape to close modals

**Expected Result:**
- All interactive elements reachable via Tab
- Focus indicators visible
- Enter/Space activates buttons
- Logical tab order
- No keyboard traps

---

### Test 22: Screen Reader 🔊
**ARIA labels**

**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through interface

**Expected Result:**
- All elements have labels
- Form fields have descriptive labels
- Buttons announce purpose
- Status changes announced
- Error messages read aloud

---

## Edge Cases

### Test 23: Very Long Description 📝
**Max length handling**

**Steps:**
1. Enter 2000+ character description
2. Submit

**Expected Result:**
- Accepts long text
- Truncates display in list view
- Shows full text in detail view
- "Show more" button in list

---

### Test 24: Special Characters 🔣
**Input validation**

**Steps:**
1. Enter description with: `<script>alert('xss')</script>`
2. Enter name: `O'Brien`, `José García`
3. Try SQL injection: `'; DROP TABLE cases; --`

**Expected Result:**
- HTML escaped (no XSS)
- Special chars preserved
- SQL injection prevented
- No crashes

---

### Test 25: Network Failure 📡
**Offline handling**

**Steps:**
1. Start complaint submission
2. Disable network mid-submit
3. Try to submit

**Expected Result:**
- Error message: "Failed to submit. Please check your connection."
- Form data preserved
- Retry button available
- No data loss

---

## Test Data Reference

### Quick Copy-Paste Test Cases:

**Valid Description (50+ chars):**
```
This is a detailed description of the harassment incident that occurred during the team meeting on November 15th. The behavior was inappropriate and made me uncomfortable.
```

**Short Description (for validation test):**
```
Too short
```

**Test Email Addresses:**
- test.user@company.com
- anonymous@protonmail.com
- employee.test@gmail.com

**Test Names:**
- Sarah Johnson
- Michael Chen
- Test Employee

**Anonymous Aliases:**
- Employee-TestAlias
- Complainant-Anonymous
- Witness-001

**Existing Case Codes for Testing:**
- KELP-2025-0001 (investigating)
- KELP-2025-0002 (under_review, anonymous)
- KELP-2025-0003 (decision_pending, OVERDUE, conciliation)
- KELP-2025-0012 (new, anonymous, due today)

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Correct data display
- ✅ Proper validation
- ✅ Mobile responsive
- ✅ Accessible
- ✅ Fast (<2s load)
- ✅ Consistent state

---

## Known Issues to Fix

Based on Playwright tests:
1. Typing indicator animation class needs verification
2. Case list API response structure needs review
3. Strict mode violations (multiple element matches)
4. Mobile test configuration structure

---

## Next Steps

1. Run through all manual tests
2. Document any failures
3. Fix identified issues
4. Re-run automated Playwright tests
5. Performance profiling
6. Security audit
7. User acceptance testing (UAT)
