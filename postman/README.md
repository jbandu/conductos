# ConductOS API Testing with Postman

Complete Postman collection for testing the ConductOS API - POSH Compliance Management System.

## 📁 Files in this Directory

- **`ConductOS-API.postman_collection.json`** - Complete API collection with all endpoints
- **`Railway-Production.postman_environment.json`** - Environment for Railway deployment
- **`Local-Development.postman_environment.json`** - Environment for local testing

## 🚀 Quick Start

### Step 1: Import Collection and Environment

1. Open **Postman**
2. Click **Import** button (top left)
3. Select all 3 JSON files from this directory:
   - `ConductOS-API.postman_collection.json`
   - `Railway-Production.postman_environment.json`
   - `Local-Development.postman_environment.json`
4. Click **Import**

### Step 2: Select Environment

- For **Railway testing**: Select `Railway Production` from the environment dropdown (top right)
- For **Local testing**: Select `Local Development` from the environment dropdown

### Step 3: Authenticate

1. Navigate to **Authentication > Login - Employee** (or IC Member/Admin)
2. Click **Send**
3. The `auth_token` will be **automatically saved** to your environment
4. All subsequent requests will use this token

## 🔐 Test Credentials

### Railway Production

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.kelphr.com | Admin@123456 |
| **IC Member (Presiding Officer)** | priya.sharma@demo.kelphr.com | password123 |
| **IC Member (Internal)** | rahul.verma@demo.kelphr.com | password123 |
| **IC Member (Internal)** | meera.iyer@demo.kelphr.com | password123 |
| **IC Member (External)** | advocate.kumar@lawfirm.com | password123 |

*Note: Create employee accounts using the Signup endpoint*

## 📚 API Endpoints Overview

### 1. Authentication
- `POST /api/auth/login` - Login (Employee/IC/Admin)
- `POST /api/auth/signup` - Create new employee account

### 2. Cases Management
- `GET /api/cases` - Get all cases (role-based filtering)
- `GET /api/cases?status=new` - Filter by status
- `GET /api/cases?is_overdue=true` - Get overdue cases
- `GET /api/cases?search=keyword` - Search cases
- `GET /api/cases/:code` - Get single case details
- `POST /api/cases` - Create new case
- `PATCH /api/cases/:code/status` - Update case status
- `GET /api/cases/:code/history` - Get status history

### 3. IC Features (Requires IC Member Role)

#### Knowledge Base
- `GET /api/documents` - Get all documents
- `GET /api/documents/search?q=keyword` - Search documents
- `POST /api/documents/generate/mom` - Generate Minutes of Meeting
- `POST /api/documents/generate/notice` - Generate Notice to Respondent

#### Pattern Analysis
- `GET /api/patterns` - Get identified patterns

#### Proactive Insights
- `GET /api/insights` - Get all insights
- `PUT /api/insights/:id` - Update/acknowledge insight

### 4. Dashboard & Stats
- `GET /api/dashboard/stats` - Get dashboard statistics

### 5. Copilot / Chat
- `POST /api/copilot/chat` - Send message to AI copilot

### 6. Admin Panel (Requires Admin Role)
- `GET /api/admin/organization/stats` - Organization statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/ic-composition` - IC committee composition
- `GET /api/admin/audit-log` - Admin action audit log

## 🧪 Testing Workflows

### Workflow 1: Employee Files a Complaint

```
1. Authentication > Login - Employee
2. Cases Management > Create Case - Authenticated
3. Cases Management > Get All Cases (Role-Based)
   → Should see only YOUR cases
```

### Workflow 2: IC Member Reviews Cases

```
1. Authentication > Login - IC Member
2. Cases Management > Get All Cases (Role-Based)
   → Should see ALL cases
3. Cases Management > Update Case Status
4. IC Features > Knowledge Base > Get All Documents
5. IC Features > Pattern Analysis > Get All Patterns
```

### Workflow 3: Admin Manages System

```
1. Authentication > Login - Admin
2. Admin Panel > Get Organization Stats
3. Admin Panel > Get All Users
4. Admin Panel > Get IC Composition
5. Cases Management > Get All Cases (Role-Based)
   → Should see ALL cases
```

### Workflow 4: Anonymous Complaint

```
1. Cases Management > Create Case - Anonymous
   (No authentication required)
2. Note the returned case_code
3. Anyone can track: Cases Management > Get Single Case by Code
```

## 🎯 Key Features to Test

### Role-Based Access Control
- **Employees** can only see their own cases
- **IC Members** can see all cases + IC Features
- **Admins** have full access to everything

### Automatic Token Management
The collection automatically:
- Saves `auth_token` after login
- Sets `user_id`, `user_email`, `user_role`
- Saves `last_case_code` after creating a case
- Uses these variables in subsequent requests

### Case Status Workflow
Test the case lifecycle:
```
new → under_review → investigating → decision_pending → closed
```
OR
```
new → conciliation → closed
```

## 🔍 Environment Variables

The collection uses these variables (auto-set):

| Variable | Description | Set By |
|----------|-------------|--------|
| `base_url` | API base URL | Environment file |
| `auth_token` | JWT authentication token | Login requests |
| `user_id` | Logged-in user ID | Login requests |
| `user_email` | Logged-in user email | Login requests |
| `user_role` | User role | Login requests |
| `last_case_code` | Most recently created case | Create case request |

## 🐛 Troubleshooting

### 401 Unauthorized
- Ensure you've logged in and `auth_token` is set
- Check if token has expired (login again)

### 403 Forbidden
- You don't have permission for this endpoint
- Example: Employees cannot access `/api/admin/*` endpoints

### 404 Not Found
- Check the case code exists
- Verify you're using the correct environment

### Empty Results
- Employees: You might not have filed any cases yet
- Check filters (status, search query)

## 📖 API Documentation

For detailed API behavior and response schemas, refer to:
- Server code: `server/routes/`
- Service logic: `server/services/`

## 🔗 Useful Links

- **Railway Production**: https://conductos-server-production.up.railway.app
- **Local Development**: http://localhost:3001
- **Client App (Railway)**: Your Railway frontend URL
- **Client App (Local)**: http://localhost:5174

## 💡 Tips

1. **Test Sequences**: Run requests in order within a folder for proper workflow testing
2. **Variables**: Use `{{variable_name}}` syntax to reference saved values
3. **Scripts**: Login requests have test scripts that auto-save tokens
4. **Environments**: Switch between Railway and Local easily
5. **Collection Runner**: Use Postman's Collection Runner for automated testing

## 📝 Sample Test Scenarios

### Scenario 1: Complete Case Lifecycle
```
1. Login as employee
2. Create authenticated case
3. Logout
4. Login as IC member
5. Get all cases (verify case appears)
6. Update case status to "investigating"
7. Get case history (verify status change recorded)
8. Update to "closed"
```

### Scenario 2: Role-Based Filtering
```
1. Login as employee A
2. Create case 1
3. Logout
4. Login as employee B
5. Create case 2
6. Get all cases (should see only case 2)
7. Logout
8. Login as IC member
9. Get all cases (should see both cases)
```

### Scenario 3: Knowledge Base Access
```
1. Login as employee
2. Try to access /api/documents (should work with auth)
3. Search documents
4. Logout
5. Try to access /api/documents (should fail - 401)
```

## 🎓 Learning API Testing

This collection is designed for learning:

1. **REST API Concepts**: GET, POST, PATCH methods
2. **Authentication**: JWT token-based auth
3. **Authorization**: Role-based access control
4. **Query Parameters**: Filtering and search
5. **Request Bodies**: JSON payloads
6. **Response Handling**: Status codes, data extraction
7. **Environment Management**: Multiple deployment targets
8. **Automated Testing**: Pre-request and test scripts

## 🤝 Contributing

When adding new endpoints:
1. Add the request to the appropriate folder
2. Include description
3. Add test scripts if needed
4. Update this README

---

**Happy Testing! 🚀**

For issues or questions, contact the development team or create a GitHub issue.
