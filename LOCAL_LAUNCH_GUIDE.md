# Local Launch Guide - MVP Testing

## Quick Start Commands

### Option 1: Automatic Launch (Recommended)

```bash
# Step 1: Initialize/Update Database
npm run db:init

# Step 2: Seed Demo Data (creates admin, employee, IC member)
npm run seed:demo

# Step 3: Start Application (runs backend + frontend concurrently)
npm run dev
```

### Option 2: Manual Launch (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd /home/jbandu/github/conductos
npm run backend
```

**Terminal 2 - Frontend:**
```bash
cd /home/jbandu/github/conductos
npm run frontend
```

## Access URLs

- **Frontend**: http://localhost:5173 (or 5174)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Test Accounts

After running `npm run seed:admin`, you'll have:

### Admin Account
- Email: `admin@demo.kelphr.com`
- Password: `Admin@123456`
- Access: Full admin panel, user management, audit log

### Employee Accounts
- Email: `employee@test.com`
- Password: `password123`
- Access: Report cases, view own cases

### IC Member Accounts
- Email: `priya.sharma@demo.kelphr.com`
- Password: `password123`
- Access: View all cases, update case status (Presiding Officer)

- Email: `ic@test.com`
- Password: `password123`
- Access: View all cases, update case status

## New Features to Test

### 1. Profile Management
**URL**: http://localhost:5173/profile

**Steps:**
1. Login as any user
2. Navigate to `/profile`
3. Click "Edit Profile" to change name
4. Click "Change Password" to update password
5. Test logout button

### 2. Password Reset Flow
**URLs**:
- http://localhost:5173/forgot-password
- http://localhost:5173/reset-password

**Steps:**
1. Go to forgot password page
2. Enter email address
3. Check console logs for reset link (emails logged in dev mode)
4. Copy token from console
5. Visit: `http://localhost:5173/reset-password?token=YOUR_TOKEN`
6. Set new password

**Console Email Log Example:**
```
📧 [EMAIL SERVICE - DEV MODE]
Password Reset Email
To: user@example.com
Reset Link: http://localhost:5174/reset-password?token=abc123...
```

### 3. Audit Log Viewer (Admin Only)
**URL**: http://localhost:5173/admin/audit-log

**Steps:**
1. Login as admin
2. Navigate to `/admin/audit-log`
3. View statistics (30-day actions, active admins)
4. Use filters (action type, date range, search)
5. Click "View Details" on any entry
6. Check pagination

### 4. Organization Settings (Admin Only)
**URL**: http://localhost:5173/admin/organization

**Steps:**
1. Login as admin
2. Navigate to `/admin/organization`
3. View org statistics
4. Click "Edit Organization Details"
5. Update fields (name, district officer email, etc.)
6. Save changes
7. View user role breakdown

### 5. Email Notifications (Case Status Updates)

**Steps:**
1. Login as IC member
2. Go to chat/cases
3. Update a case status
4. Check console for email notification log:

```
📧 [EMAIL SERVICE - DEV MODE]
Case Status Update Email
To: employee@acme.com
Case ID: 1
Status: new → investigating
```

## Database Reset

If you need to reset the database:

```bash
# Drop and recreate all tables
npm run db:init

# Reseed demo data
npm run seed:demo
```

## Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test Suites
```bash
# Password reset tests
npx playwright test tests/password-reset.spec.js

# Profile management tests
npx playwright test tests/profile-management.spec.js

# Admin features tests
npx playwright test tests/admin/admin-features.spec.js

# All new feature tests
npx playwright test tests/password-reset.spec.js tests/profile-management.spec.js tests/admin/
```

### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

## Troubleshooting

### Database Connection Errors

Check your `.env` file:
```bash
cat .env | grep DATABASE_URL
```

Should show:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Port Already in Use

**Backend (3001):**
```bash
lsof -ti:3001 | xargs kill -9
```

**Frontend (5173):**
```bash
lsof -ti:5173 | xargs kill -9
```

### Node Version Issues

Resend and React Router v7 require Node >= 20. Check version:
```bash
node --version
```

If < 20, use nvm to upgrade:
```bash
nvm install 20
nvm use 20
```

### Missing Dependencies

```bash
npm install
```

### Database Schema Out of Sync

```bash
# This will add the new password_reset_tokens table
npm run db:init
```

## Environment Variables

Check `.env` file has all required variables:

```env
# Database (Required)
DATABASE_URL=postgresql://...

# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5174

# Auth (Auto-generated in dev)
JWT_SECRET=your-dev-secret-key
JWT_EXPIRES_IN=7d

# Email (Optional for local dev)
RESEND_API_KEY=  # Leave empty - emails logged to console
FROM_EMAIL=noreply@conductos.app
```

## Development Tips

### Watch Console for Email Logs

All emails are logged to the backend console in development mode. Look for:
```
📧 [EMAIL SERVICE - DEV MODE]
```

### Check Backend Logs

Backend logs show:
- Database initialization
- API requests
- Email notifications
- Error messages

### Frontend Hot Reload

Vite automatically reloads on file changes. If it stops working:
```bash
# Kill frontend
Ctrl + C

# Restart
npm run frontend
```

### Backend Manual Restart

Backend uses nodemon for auto-restart, but if needed:
```bash
# Kill backend
Ctrl + C

# Restart
npm run backend
```

## Next Steps After Testing

Once local testing is complete:

1. **Merge to main** (if testing on production/stable):
   ```bash
   git checkout main
   git merge production/stable
   git push origin main
   ```

2. **Deploy to Render**:
   - Follow `RENDER_DEPLOYMENT_GUIDE.md`
   - Push production/stable branch to GitHub
   - Connect to Render dashboard

3. **Set up Resend** (for production emails):
   - Get API key from resend.com
   - Add to Render environment variables
