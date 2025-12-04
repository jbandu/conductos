# Natural Language Command Parser Documentation

The ConductOS chat interface uses a sophisticated natural language parser to understand user commands and extract relevant parameters.

## Architecture

### Components

1. **chatParser.js** - Intent recognition and parameter extraction
2. **responseGenerator.js** - Structured response generation
3. **chatService.js** - Orchestrates parsing and response generation

## Supported Intents

### Employee Mode Intents

#### 1. COMPLAINT_START
**Purpose**: Initiate complaint filing process

**Triggers**:
- "file a complaint"
- "report incident"
- "report harassment"
- "I want to report"
- "I need to report"
- "submit a complaint"

**Response Type**: `intake_start`

**Example**:
```bash
User: "I want to file a complaint"
Response: {
  "type": "intake_start",
  "content": {
    "message": "I'll help you file a complaint...",
    "next_step": "incident_date"
  }
}
```

---

#### 2. CASE_STATUS
**Purpose**: Check status of own case

**Triggers**:
- "status KELP-2025-0001"
- "check KELP-2025-0001"
- "view KELP-2025-0001"

**Parameters Extracted**:
- `case_code` - Extracted using regex `/KELP-\d{4}-\d{4}/i`

**Response Type**: `case_detail`

---

#### 3. INFO_POSH
**Purpose**: Get information about PoSH Act

**Triggers**:
- "what is posh"
- "posh policy"
- "explain posh"
- "tell me about posh"

**Response Type**: `text`

---

#### 4. INFO_CONCILIATION
**Purpose**: Get information about conciliation process

**Triggers**:
- "what is conciliation"
- "conciliation"
- "explain conciliation"

**Response Type**: `text`

---

### IC Mode Intents

#### 1. CASE_LIST
**Purpose**: Show all cases

**Triggers**:
- "show all cases"
- "list cases"
- "view all cases"
- "my cases"
- "display cases"

**Response Type**: `case_list`

**Response Format**:
```json
{
  "type": "case_list",
  "content": {
    "cases": [...],
    "summary": "Showing 5 cases (2 pending, 1 overdue)"
  }
}
```

---

#### 2. CASE_PENDING
**Purpose**: Show pending cases only

**Triggers**:
- "pending cases"
- "show pending"
- "pending"
- "under review"

**Response Type**: `case_list` or `text` (if none found)

---

#### 3. CASE_OVERDUE
**Purpose**: Show overdue cases

**Triggers**:
- "overdue cases"
- "show overdue"
- "overdue"
- "past deadline"
- "delayed cases"

**Response Type**: `case_list` or `text` (if none found)

---

#### 4. CASE_TODAY
**Purpose**: Show cases with today's deadline

**Triggers**:
- "today's deadlines"
- "due today"
- "deadline today"
- "today"

**Response Type**: `case_list` or `text` (if none found)

---

#### 5. CASE_STATUS
**Purpose**: Check detailed status of any case

**Triggers**:
- "status KELP-2025-0001"
- "check KELP-2025-0001"
- "view case KELP-2025-0001"

**Parameters Extracted**:
- `case_code` - Case code

**Response Type**: `case_detail`

**Response Format**:
```json
{
  "type": "case_detail",
  "content": {
    "case": {...},
    "history": [...],
    "message": "**Case KELP-2025-0001**\n\n**Status:** Investigating..."
  }
}
```

---

#### 6. CASE_UPDATE
**Purpose**: Update case status

**Triggers**:
- "update KELP-2025-0001 status investigating"
- "change KELP-2025-0001 status closed"
- "set KELP-2025-0001 investigating"

**Parameters Extracted**:
- `case_code` - Case code
- `new_status` - One of: new, under_review, conciliation, investigating, decision_pending, closed

**Response Type**: `case_update_success`

**Response Format**:
```json
{
  "type": "case_update_success",
  "content": {
    "case": {...},
    "message": "✅ Case KELP-2025-0001 status updated to **Investigating**"
  }
}
```

---

#### 7. UNKNOWN
**Purpose**: Default fallback when no intent matches

**Response Type**: `text`

**Response**: Context-appropriate help text based on current mode

---

## Parameter Extraction

### Case Code Extraction
**Pattern**: `/KELP-\d{4}-\d{4}/i`

**Examples**:
- "status KELP-2025-0001" → Extracts: "KELP-2025-0001"
- "check case KELP-2025-0042" → Extracts: "KELP-2025-0042"
- "kelp-2025-0001 status" → Extracts: "KELP-2025-0001" (case insensitive)

### Status Extraction
**Valid Statuses**:
- new
- under_review
- conciliation
- investigating
- decision_pending
- closed

**Algorithm**: Searches for status keywords in message (supports underscore → space conversion)

**Examples**:
- "update ... investigating" → Extracts: "investigating"
- "change to under review" → Extracts: "under_review"

---

## Response Types

### 1. intake_start
Starts complaint intake flow

### 2. case_list
Returns list of cases with summary

### 3. case_detail
Returns detailed case information with history

### 4. case_update_success
Confirms successful status update

### 5. text
Plain text response (info, help, confirmations)

### 6. error
Error message

---

## Testing Examples

### Employee Mode Tests

```bash
# File complaint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to file a complaint", "mode": "employee"}'

# Check case status
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "status KELP-2025-0001", "mode": "employee"}'

# Get PoSH info
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "what is posh", "mode": "employee"}'
```

### IC Mode Tests

```bash
# Show all cases
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "show all cases", "mode": "ic"}'

# Show pending
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "pending cases", "mode": "ic"}'

# Check case status
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "check KELP-2025-0001", "mode": "ic"}'

# Update case status
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "update KELP-2025-0001 status investigating", "mode": "ic"}'

# Show overdue
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "overdue", "mode": "ic"}'
```

---

## Natural Language Variations

The parser is designed to handle natural variations:

### Complaint Filing
✅ "file a complaint"
✅ "I want to report harassment"
✅ "I need to report an incident"
✅ "submit a complaint"

### Case Status
✅ "status KELP-2025-0001"
✅ "check KELP-2025-0001"
✅ "view case KELP-2025-0001"
✅ "what's the status of KELP-2025-0001"

### List Cases
✅ "show all cases"
✅ "list cases"
✅ "display all cases"
✅ "view cases"

### Pending/Overdue
✅ "pending"
✅ "show pending cases"
✅ "cases that are pending"
✅ "overdue"
✅ "show overdue cases"

---

## Mode-Specific Access Control

### Employee Mode
**Allowed**:
- File complaints
- Check own case status (if they have the case code)
- Get information about policies

**Restricted**:
- Cannot list all cases
- Cannot update case status
- Cannot view other cases

### IC Mode
**Allowed**:
- All employee mode actions
- List and filter all cases
- Update case status
- View any case details
- View analytics and summaries

---

## Error Handling

### Case Not Found
```json
{
  "type": "text",
  "content": "Case KELP-2025-9999 not found."
}
```

### Missing Parameters
```json
{
  "type": "text",
  "content": "Please provide a case code (e.g., KELP-2025-0001)."
}
```

### Invalid Status
```json
{
  "type": "error",
  "content": "Failed to update case: Invalid status..."
}
```

---

## Future Enhancements

Potential improvements to the parser:

1. **Date extraction** - "cases due next week"
2. **Assignee filtering** - "cases assigned to me"
3. **Multi-parameter queries** - "overdue investigating cases"
4. **Fuzzy matching** - Handle typos in case codes
5. **Context awareness** - Remember previous case code in conversation
6. **Bulk operations** - "update all pending to under review"
