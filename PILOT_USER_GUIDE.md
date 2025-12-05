# ConductOS Pilot User Guide

**Welcome to ConductOS** - Your AI-powered PoSH Act compliance platform

This guide will help you understand and test the system during our pilot phase.

---

## Table of Contents

1. [System Access](#system-access)
2. [What is ConductOS?](#what-is-conductos)
3. [Employee Mode](#employee-mode)
4. [IC Mode](#ic-mode)
5. [Quick Reference](#quick-reference)
6. [Providing Feedback](#providing-feedback)
7. [Support](#support)

---

## System Access

### Access URL
```
https://your-app-name.railway.app
```
(Replace with actual Railway URL after deployment)

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Mobile Access
The system is fully responsive and works on smartphones and tablets.

---

## What is ConductOS?

ConductOS is an AI-powered case management system for handling workplace misconduct complaints under the PoSH Act (Prevention of Sexual Harassment at Workplace Act).

### Key Features

**For Employees:**
- Natural language interaction - just type what you need
- Anonymous complaint filing
- Case status tracking
- Educational resources about workplace policies

**For Internal Committee (IC) Members:**
- Dashboard view of all cases
- Deadline tracking with alerts
- Case filtering and search
- Complete status history

---

## Employee Mode

### Getting Started

1. **Open the application** in your browser
2. You'll start in **Employee Mode** by default
3. The interface shows a chat-like interface

### What You Can Do

#### 1. Ask Questions About PoSH

Type natural questions like:
```
What is PoSH?
What constitutes sexual harassment?
How does the complaint process work?
```

The system will provide informative responses based on PoSH Act guidelines.

#### 2. Report an Incident

**Quick Chip Method:**
- Click the chip: **"I want to report harassment"**
- Follow the guided intake flow
- Provide details step by step

**Natural Language Method:**
- Type: `I want to report an incident`
- The system will guide you through the process

**What You'll Be Asked:**
1. Date of incident
2. Description of what happened
3. Whether you want to remain anonymous
4. Your contact information (if not anonymous)
5. Whether you want conciliation

#### 3. Check Case Status

**Quick Chip Method:**
- Click: **"Check my case status"**
- Provide your case code (e.g., KELP-2025-0001)

**Natural Language Method:**
- Type: `status KELP-2025-0001`
- Or: `check case KELP-2025-0001`

### Tips for Employee Mode

- Be specific in your descriptions
- Save your case code - you'll need it to track status
- You can remain anonymous if you prefer
- All conversations are confidential

---

## IC Mode

### Switching to IC Mode

1. Look at the **sidebar** (left side on desktop, hamburger menu on mobile)
2. Click the **"IC Mode"** button
3. The interface changes to purple theme

### Dashboard Overview

When you switch to IC Mode, you'll see:
- Header: "Investigation Committee"
- Mode badge: "IC Mode" (purple)
- Quick action chips for filtering
- Recent cases list in sidebar

### Viewing Cases

#### View All Cases

**Method 1:** Click the **"Show All Cases"** chip

**Method 2:** Type: `show all cases` or `list cases`

**What You'll See:**
- Case cards showing:
  - Case code (KELP-2025-XXXX)
  - Status badge (color-coded)
  - Incident date
  - Description preview
  - Deadline information
  - Overdue warnings (if applicable)

#### Filter Cases

**Pending Cases:**
- Click **"Pending"** chip
- Or type: `pending cases`
- Shows only cases in "new" status

**Overdue Cases:**
- Click **"Overdue"** chip
- Or type: `overdue` or `overdue cases`
- Shows cases past 90-day statutory deadline
- Red alert banner appears if any cases are overdue

**Today's Deadlines:**
- Click **"Today's Deadlines"** chip
- Or type: `deadline today`
- Shows cases with deadlines today

#### View Case Details

**From Case List:**
- Click on any case card

**From Search:**
- Type: `status KELP-2025-0001`
- Type the case code directly: `KELP-2025-0001`

**Case Detail View Shows:**
- Full case information
- All status transitions
- Status history timeline with dates
- Complainant information (if not anonymous)
- Conciliation status
- Deadline tracking

### Case Status Meanings

| Status | What It Means |
|--------|---------------|
| **New** | Complaint just filed, pending initial review |
| **Under Review** | IC conducting preliminary assessment |
| **Conciliation** | Attempting resolution through mediation |
| **Investigating** | Formal inquiry proceedings underway |
| **Decision Pending** | Investigation complete, IC deliberating |
| **Closed** | Case resolved, action taken or concluded |

### Understanding Deadlines

- **90-Day Rule**: PoSH Act requires investigation completion within 90 days
- **Green**: Case on track
- **Yellow**: Approaching deadline
- **Red**: Overdue (past 90 days)

### Tips for IC Mode

- Check "Overdue" filter daily for urgent cases
- Use case codes for quick lookups
- Review status history for case progression
- Anonymous cases show limited contact info for privacy

---

## Quick Reference

### Common Commands

| What You Want | What to Type | Mode |
|---------------|--------------|------|
| Learn about PoSH | `What is PoSH?` | Employee |
| Report incident | `I want to report harassment` | Employee |
| Check case status | `status KELP-2025-0001` | Both |
| View all cases | `show all cases` | IC |
| Filter pending | `pending` | IC |
| Find overdue | `overdue` | IC |
| Today's deadlines | `deadline today` | IC |

### Quick Chips

**Employee Mode:**
- I want to report harassment
- Check my case status
- What is PoSH?
- I need help with workplace conduct

**IC Mode:**
- Show All Cases
- Pending
- Overdue
- Today's Deadlines

### Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in message

---

## Pilot Testing Scenarios

To help test the system thoroughly, try these scenarios:

### Scenario 1: Employee Filing Complaint
1. Switch to Employee Mode
2. Click "I want to report harassment"
3. Follow the intake flow
4. Note the case code
5. Check case status using that code

### Scenario 2: IC Dashboard Review
1. Switch to IC Mode
2. Click "Show All Cases"
3. Count total cases displayed
4. Check if overdue alert appears
5. Click on a case to view details

### Scenario 3: Case Filtering
1. In IC Mode, click "Pending"
2. Note how many cases appear
3. Click "Overdue"
4. Check if warning banner is prominent
5. Click "Today's Deadlines"

### Scenario 4: Mobile Testing
1. Open app on mobile device
2. Use hamburger menu to access sidebar
3. Switch between Employee and IC modes
4. Test all quick chips
5. Verify case cards are readable

### Scenario 5: Natural Language
1. Try typing natural questions
2. Test different phrasings: "show cases", "list all cases", "display cases"
3. Try case lookups: type just case code "KELP-2025-0001"
4. Check if responses make sense

---

## What to Test

### Functionality Checklist

**Employee Mode:**
- [ ] Information requests work (What is PoSH?)
- [ ] Quick chips respond properly
- [ ] Input field accepts text
- [ ] Send button works
- [ ] Mode switching works

**IC Mode:**
- [ ] Show all cases displays correct count
- [ ] Case cards show all information
- [ ] Overdue filter shows red alert
- [ ] Case detail view opens
- [ ] Status history displays correctly
- [ ] Anonymous cases show "Anonymous" badge

**Mobile:**
- [ ] Hamburger menu opens sidebar
- [ ] Sidebar closes on selection
- [ ] Quick chips scroll horizontally
- [ ] Case cards are readable
- [ ] No horizontal scroll on page

**User Experience:**
- [ ] Loading indicators appear
- [ ] Errors are handled gracefully
- [ ] Responses feel natural
- [ ] Interface is intuitive

---

## Providing Feedback

### What to Report

**Bug Reports:**
- What you were trying to do
- What you expected to happen
- What actually happened
- Screenshots if possible
- Browser and device information

**Feature Requests:**
- What feature you'd like
- Why it would be useful
- How you'd use it

**Usability Feedback:**
- What was confusing
- What worked well
- What could be clearer

### How to Report

Send your feedback to: [Your Email/Slack/Form]

Include:
1. Date and time of testing
2. Browser/device used
3. Specific issue or feedback
4. Screenshots if applicable

---

## Support

### During Pilot Testing

**Technical Issues:**
- Contact: [Your Contact Info]
- Response time: [Expected Response Time]

**Questions About the System:**
- Contact: [Your Contact Info]
- Available: [Your Availability]

### Known Limitations (Pilot Phase)

- No user authentication yet (coming in Phase 2)
- All users can access both modes
- Case assignment not automated
- No email notifications yet
- Demo data included for testing

---

## Demo Data

The system has been pre-loaded with 15 demo cases for testing:

- **3 New cases** (filed in last 7 days)
- **2 Under Review**
- **2 In Conciliation**
- **3 Investigating**
- **2 Decision Pending**
- **2 Closed**
- **1 Overdue** (to test deadline alerts)
- **1 Deadline Today** (to test today's deadline filter)

**Mix:** 6 anonymous cases and 9 named cases

All demo cases use placeholder content and are not based on real incidents.

---

## Frequently Asked Questions

**Q: Is this data real?**
A: No, all cases are demo data for testing purposes only.

**Q: Can I delete a case?**
A: Not in pilot phase. This will be admin functionality in later versions.

**Q: Why do I see a thinking indicator?**
A: The system shows a brief thinking animation (1.2 seconds) to make interactions feel more natural.

**Q: What happens after the pilot?**
A: Based on your feedback, we'll refine features and add authentication for production use.

**Q: Can I use this for real complaints?**
A: Not yet. This is a testing environment. Production deployment will have proper security and data protection.

---

## Technical Information

### Architecture
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Deployment:** Railway

### Security Notes (Pilot Phase)
- All data is in a test database
- No sensitive information should be entered
- Pilot environment will be decommissioned after testing

---

## Next Steps After Pilot

Based on your feedback, Phase 2 will include:

1. **Authentication & Authorization**
   - User login system
   - Role-based access control
   - Employee, IC Member, Presiding Officer roles

2. **Enhanced Features**
   - Email notifications
   - Document uploads
   - Automated case assignment
   - Report generation

3. **Security Enhancements**
   - Encrypted data storage
   - Audit logging
   - Compliance certifications

---

## Thank You!

Thank you for participating in the ConductOS pilot program. Your feedback is crucial for building a system that truly serves the needs of organizations and ensures workplace safety.

**Questions?** Contact: [Your Contact Information]

**Last Updated:** December 2025

---

**ConductOS by KelpHR** - Building safer workplaces through technology
