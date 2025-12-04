# KelpHR ConductOS

A full-stack case management application for handling HR conduct cases.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js 20 + Express 4
- **Database**: SQLite with better-sqlite3
- **Structure**: Monorepo with npm workspaces

## Project Structure

```
conductos/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API calls
│   │   ├── utils/          # Helpers
│   │   └── App.jsx
│   └── index.html
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── db/                 # Database setup & migrations
│   │   ├── init.js         # Database initialization
│   │   ├── utils.js        # Case code generator
│   │   └── conductos.db    # SQLite database (created on first run)
│   └── index.js
└── package.json            # Root with workspaces
```

## Database Schema

### Cases Table
- `id`: Primary key
- `case_code`: Unique code (format: KELP-YYYY-NNNN)
- `status`: new, under_review, conciliation, investigating, decision_pending, closed
- `incident_date`: Date of the incident
- `description`: Case description
- `is_anonymous`: Boolean flag
- `anonymous_alias`: Alias if anonymous
- `contact_method`: Preferred contact method
- `complainant_name`: Name of complainant (if not anonymous)
- `complainant_email`: Email of complainant
- `conciliation_requested`: Boolean flag
- `deadline_date`: Case deadline
- `created_at`, `updated_at`: Timestamps

### Status History Table
- Tracks all status changes for audit trail
- Links to cases via foreign key

## Getting Started

### Installation

```bash
npm install
```

This will install dependencies for both client and server workspaces.

### Development

Run both client and server concurrently:

```bash
npm run dev
```

This starts:
- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: http://localhost:3001 (Express API)

### Individual Commands

```bash
# Run only client
npm run dev:client

# Run only server
npm run dev:server

# Build client for production
npm run build

# Start production server
npm start
```

## API Endpoints

All endpoints are prefixed with `/api`

- `GET /api/health` - Health check
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get single case
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `GET /api/cases/:id/history` - Get case status history

## Features

- Automatic case code generation (KELP-YYYY-NNNN format)
- Status change tracking with audit trail
- Anonymous case submission support
- Conciliation request handling
- Deadline management

## Development Notes

- The database is automatically initialized on first server start
- Hot reload is enabled for both client and server
- CORS is configured for localhost:5173
