# ConductOS Database Models (PostgreSQL)

Reference schema located in `server/db/schema.sql`.  
This file abstracts the conceptual model for AI coding assistants.

---

## 🧱 Core Tables

### `users`
- id (uuid)
- name
- email
- password_hash
- role (`employee`, `ic_member`, `hr_admin`, `super_admin`)
- organization_id
- preferred_language (planned)
- timestamps

### `cases`
- id (uuid)
- case_code (`KELP-YYYY-NNNN`)
- employee_id
- description
- incident_date
- status
- is_anonymous
- anonymous_alias
- organization_id
- timestamps

### `status_history`
- id
- case_id
- status
- changed_by
- reason
- timestamp

### `organizations`
- id
- name
- slug
- settings_json
- timestamps

### `audit_log`
- id
- user_id
- action
- resource_type
- resource_id
- before
- after
- timestamp

---

## 🗂 Planned Additions
### Translation tables (optional)

case_translations
user_translations
ui_copy


### Notification logs


notifications
email_queue


---

## 🎯 DB Next Steps
- Introduce repositories
- Add organization scoping guarantees
- Add transaction wrappers for multi-step updates
