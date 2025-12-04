# ConductOS API Documentation

Base URL: `http://localhost:3001/api`

## API Endpoints

### Chat API

#### POST /api/chat
Process chat messages and return appropriate responses based on intent parsing.

**Request Body:**
```json
{
  "message": "I want to report harassment",
  "mode": "employee"  // "employee" or "ic"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "type": "form_prompt",
    "content": "I understand you want to file a complaint...",
    "action": "start_complaint_form"
  }
}
```

**Response Types:**
- `form_prompt` - Prompt to start complaint form
- `input_request` - Request for specific input (case code, etc.)
- `information` - Information about policies
- `case_list` - List of cases with data
- `general` - General help message
- `error` - Error message

---

### Case Management API

#### POST /api/cases
Create a new case from complaint intake.

**Request Body:**
```json
{
  "incident_date": "2025-01-15",
  "description": "Description of incident (min 50 chars)",
  "is_anonymous": true,
  "anonymous_alias": "Complainant-A",
  "contact_method": "alternate@email.com",
  "complainant_name": null,
  "complainant_email": null,
  "conciliation_requested": true
}
```

**Validation Rules:**
- `incident_date` cannot be in the future
- `description` minimum 50 characters
- If `is_anonymous=true`: require `anonymous_alias` and `contact_method`
- If `is_anonymous=false`: require `complainant_name` and `complainant_email`

**Response:**
```json
{
  "success": true,
  "case": {
    "case_code": "KELP-2025-0001",
    "status": "new",
    "created_at": "2025-01-20T10:30:00Z",
    "deadline_date": "2025-04-20",
    "days_remaining": 90
  }
}
```

---

#### GET /api/cases
List cases with optional filters.

**Query Parameters:**
- `status` - Filter by status (new, under_review, conciliation, investigating, decision_pending, closed)
- `is_overdue` - Filter overdue cases (true/false)
- `search` - Search in case_code or description

**Examples:**
```bash
GET /api/cases
GET /api/cases?status=under_review
GET /api/cases?is_overdue=true
GET /api/cases?search=KELP-2025
```

**Response:**
```json
[
  {
    "id": 1,
    "case_code": "KELP-2025-0001",
    "status": "under_review",
    "incident_date": "2025-01-15",
    "description": "...",
    "is_anonymous": 1,
    "anonymous_alias": "Employee-A",
    "contact_method": "alternate@email.com",
    "complainant_name": null,
    "complainant_email": null,
    "conciliation_requested": 1,
    "created_at": "2025-12-04 23:11:52",
    "deadline_date": "2026-03-04",
    "updated_at": "2025-12-04 23:12:06",
    "days_remaining": 89,
    "is_overdue": false
  }
]
```

**Computed Fields:**
- `days_remaining` - Days until deadline (negative if overdue)
- `is_overdue` - Boolean flag if deadline has passed

---

#### GET /api/cases/:code
Get single case by case code with status history.

**Example:**
```bash
GET /api/cases/KELP-2025-0001
```

**Response:**
```json
{
  "id": 1,
  "case_code": "KELP-2025-0001",
  "status": "under_review",
  "incident_date": "2025-01-15",
  "description": "...",
  "created_at": "2025-12-04 23:11:52",
  "deadline_date": "2026-03-04",
  "days_remaining": 89,
  "is_overdue": false,
  "status_history": [
    {
      "id": 2,
      "case_id": 1,
      "old_status": "new",
      "new_status": "under_review",
      "changed_at": "2025-12-04 23:12:06",
      "notes": "Case assigned to investigator"
    },
    {
      "id": 1,
      "case_id": 1,
      "old_status": null,
      "new_status": "new",
      "changed_at": "2025-12-04 23:11:52",
      "notes": "Case created"
    }
  ]
}
```

---

#### PATCH /api/cases/:code/status
Update case status.

**Request Body:**
```json
{
  "status": "investigating",
  "notes": "Started inquiry"
}
```

**Valid Status Values:**
- `new`
- `under_review`
- `conciliation`
- `investigating`
- `decision_pending`
- `closed`

**Response:**
```json
{
  "success": true,
  "case": {
    "id": 1,
    "case_code": "KELP-2025-0001",
    "status": "investigating",
    "updated_at": "2025-12-04 23:15:00",
    "days_remaining": 89,
    "is_overdue": false
  }
}
```

**Note:** Status changes are automatically recorded in `status_history`.

---

#### GET /api/cases/:code/history
Get status change history for a case.

**Example:**
```bash
GET /api/cases/KELP-2025-0001/history
```

**Response:**
```json
[
  {
    "id": 2,
    "case_id": 1,
    "old_status": "new",
    "new_status": "under_review",
    "changed_at": "2025-12-04 23:12:06",
    "notes": "Case assigned to investigator"
  },
  {
    "id": 1,
    "case_id": 1,
    "old_status": null,
    "new_status": "new",
    "changed_at": "2025-12-04 23:11:52",
    "notes": "Case created"
  }
]
```

---

## Business Logic

### Case Code Generation
Format: **KELP-YYYY-NNNN**
- YYYY = current year
- NNNN = sequential number padded to 4 digits
- Counter resets each year
- Example: KELP-2025-0001, KELP-2025-0002, etc.

### Deadline Calculation
- `deadline_date` = `created_at` + 90 days
- Computed field `days_remaining` = deadline - today
- Computed field `is_overdue` = days_remaining < 0

### Chat Intent Parsing

**Employee Mode Intents:**
- Complaint filing: "report", "file", "complain"
- Case lookup: "status", "check", "track"
- Information: "posh", "policy", "what is"

**IC Mode Intents:**
- List all cases: "show all", "all cases"
- Filter pending: "pending"
- Filter overdue: "overdue"
- Today's deadlines: "today", "deadline"
- Status update: "update", "status"

---

## Error Handling

All endpoints return errors in the format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common Error Codes:**
- `400` - Validation error or bad request
- `404` - Case not found
- `500` - Server error

---

## Testing Examples

### Create a case
```bash
curl -X POST http://localhost:3001/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "incident_date": "2025-01-15",
    "description": "This is a detailed description of a workplace harassment incident that occurred in the office during working hours.",
    "is_anonymous": true,
    "anonymous_alias": "Employee-A",
    "contact_method": "alternate@email.com",
    "conciliation_requested": true
  }'
```

### Update case status
```bash
curl -X PATCH http://localhost:3001/api/cases/KELP-2025-0001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "under_review", "notes": "Case assigned to investigator"}'
```

### Chat with employee mode
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to report harassment", "mode": "employee"}'
```

### Get all overdue cases
```bash
curl -X GET 'http://localhost:3001/api/cases?is_overdue=true'
```
