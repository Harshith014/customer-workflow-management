# Application Management System

A customer application management system that enables organizations to track, manage, and process customer applications through defined workflow stages. Users can manage customers, create applications, assign work, manage tasks, maintain an audit history, and synchronize completed applications with external systems.

---

## Application Overview

This system is designed for organizations that need to:
- Track applications submitted by customers
- Route applications through a structured workflow
- Assign work to teams and individuals
- Manage discrete work items within applications
- Maintain a complete audit trail
- Synchronize completion data with external systems

### Roles

- **Administrator**: Full system access. Can manage users, teams, customers, and all applications.
- **Manager**: Team-level access. Can manage applications and work assigned to their team; assign work to team members.
- **Executive**: Individual-level access. Can view and work on applications assigned to them; can create personal applications.

---

## Key Features

- ✅ **Authentication**: JWT-based login (no registration; users seeded via script)
- ✅ **Role-Based Access Control**: Three roles with granular permission model
- ✅ **Customer Management**: Create, search, and manage customer records
- ✅ **Application Lifecycle**: Create applications with assignment, status transitions, and metadata
- ✅ **Application Assignment**: Assign and reassign applications with role-based rules
- ✅ **Workflow Management**: Five-stage workflow (NEW → WAITING_FOR_INFORMATION → IN_PROGRESS → UNDER_REVIEW → COMPLETED) with enforced transitions
- ✅ **Work Items**: Create and manage discrete tasks under applications with independent status tracking
- ✅ **Activity History**: Immutable audit trail tracking all significant events
- ✅ **Search & Filtering**: Full-text search on applications and customers; filter by status, priority, team, user
- ✅ **Pagination**: Paginated list views with configurable limits
- ✅ **External Synchronization**: Automatic synchronization of completed applications to external systems with idempotency and retry logic
- ✅ **Concurrent Update Protection**: Optimistic locking prevents lost updates when multiple users edit simultaneously
- ✅ **Error Handling & Validation**: Comprehensive input validation and error responses

---

## Technology Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | Frontend framework with App Router |
| **React 19** | UI library and component model |
| **Node.js + Express 5** | Backend REST API |
| **MongoDB + Mongoose** | Database with schema validation |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password hashing and verification |
| **Tailwind CSS** | Utility-first styling |
| **CORS** | Cross-origin request handling |

---

## Project Structure

```
customer-workflow-management/
├── frontend/                          # Next.js React frontend
│   ├── app/                          # Page routes
│   │   ├── login/                    # Login page
│   │   ├── dashboard/                # Dashboard
│   │   ├── applications/             # Application management
│   │   ├── customers/                # Customer management
│   │   ├── work-items/               # Work items
│   │   ├── teams/                    # Team management
│   │   └── users/                    # User management
│   ├── components/                   # Reusable components
│   ├── context/                      # React Context (auth state)
│   ├── lib/                          # API client and utilities
│   └── package.json
│
├── backend/                           # Node.js Express backend
│   ├── src/
│   │   ├── config/                   # Database configuration
│   │   ├── controllers/              # Request handlers
│   │   ├── models/                   # Mongoose schemas
│   │   ├── routes/                   # API route definitions
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Auth & authorization
│   │   ├── jobs/                     # Background jobs (sync worker)
│   │   └── utils/                    # Utilities including seedUsers.js
│   ├── server.js                     # Express app entry point
│   ├── package.json
│   └── .env                          # Environment variables
│
├── docs/
│   └── SOLUTION_ARCHITECTURE_AND_DESIGN_DECISIONS.md  # Detailed architecture
│
└── README.md
```

---

## Setup Instructions

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd customer-workflow-management
```

### Step 2 — Configure Backend Environment

Navigate to the backend directory and create a `.env` file with the required environment variables:

```bash
cd backend
```

Create `.env`:

```bash
# Server Port
PORT=5000

# MongoDB Connection (local or remote)
MONGODB_URI=mongodb://localhost:27017/customer_workflow
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# External System Integration
EXTERNAL_SYSTEM_URL=http://localhost:5000/api/mock-external

# Mock External System Settings (for testing)
MOCK_EXTERNAL_DELAY_MS=500
MOCK_EXTERNAL_FAILURE_RATE=0
```

**Important**: 
- `MONGODB_URI`: Configure a local MongoDB instance or use MongoDB Atlas
- `JWT_SECRET`: Use a strong, random secret in production
- `EXTERNAL_SYSTEM_URL`: URL of the external system to receive sync events
- Ensure MongoDB is running and accessible before proceeding

### Step 3 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4 — Seed Users

The application does **not have a registration flow**. Users must be created using the seed script.

Ensure MongoDB is running and properly configured, then run:

```bash
npm run seed
```

This script will:
- Create two teams: "Application Processing" and "Application Review"
- Create four demo users (see credentials below)
- Skip duplicate users (safe to run multiple times)
- Hash passwords securely using bcryptjs

**Expected output:**
```
Creating teams...
Created user: admin@example.com
Created user: manager@example.com
Created user: executive@example.com
Created user: executive2@example.com
User seeding completed.
```

### Step 5 — Configure Frontend Environment

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not include secrets here.

### Step 6 — Install Frontend Dependencies

```bash
npm install
```

### Step 7 — Start the Application

You need to run both the backend and frontend. Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

Expected: `Server running on http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Expected: `Local: http://localhost:3000`

### Step 8 — Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Seed User Credentials

Login using these demo accounts. There is no registration flow; users are provisioned only through the seed script.

| Name | Email | Password | Role | Team |
|------|-------|----------|------|------|
| System Administrator | `admin@example.com` | `Admin@123` | ADMINISTRATOR | None |
| John Manager | `manager@example.com` | `Manager@123` | MANAGER | Application Processing |
| Sarah Executive | `executive@example.com` | `Executive@123` | EXECUTIVE | Application Processing |
| Mike Executive | `executive2@example.com` | `Executive@123` | EXECUTIVE | Application Review |

**Note**: These credentials are for local development and assessment. There is no registration page; users are only provisioned through `npm run seed`.

---

## Architecture

```
┌────────────────────────────────┐
│      Next.js Frontend          │
│    (React + Tailwind CSS)      │
│  • Pages & Components          │
│  • State Management (Context)  │
│  • API Client (Fetch)          │
└─────────────┬──────────────────┘
              │ HTTP/REST API
              │ Bearer JWT Auth
              ▼
┌────────────────────────────────┐
│    Node.js + Express Backend   │
│  • REST API Routes             │
│  • Controllers & Services      │
│  • Authentication Middleware   │
│  • Role-Based Authorization    │
│  • Business Logic Validation   │
│  • Sync Worker (background)    │
└─────────────┬──────────────────┘
              │ MongoDB Driver
              ▼
┌────────────────────────────────┐
│      MongoDB Database          │
│  • Users & Teams               │
│  • Customers & Applications    │
│  • Work Items & Activities     │
│  • Sync Records                │
└────────────────────────────────┘
              │
              │ HTTP Requests
              │ (Completed Apps)
              ▼
┌────────────────────────────────┐
│    External System (Mocked)    │
│    POST /applications/sync     │
└────────────────────────────────┘
```

### Communication Flow

1. **Authentication**: User submits email/password to `/api/auth/login` → Backend validates and issues JWT
2. **API Requests**: Frontend includes JWT in `Authorization: Bearer <token>` header
3. **Authorization**: Backend validates JWT, reloads user from database, checks role/team/ownership
4. **Business Logic**: Controllers validate inputs, call services, enforce business rules
5. **Database**: Mongoose models handle persistence and schema validation
6. **External Sync**: When application marked COMPLETED, sync worker sends data to external system with retry logic

### Why This Architecture

- **Frontend/Backend Separation**: Independent scaling and deployment
- **REST API**: Standard, well-understood API design
- **JWT Authentication**: Stateless; scales horizontally
- **MongoDB**: Flexible schema; quick prototyping; suitable for assessment scope
- **Middleware-Based Auth**: Centralized security checks; easily auditable

---

## Data Model

### Core Entities

```
User
├── name, email, password (hashed), role, team
└── references: Team

Team
├── name, description, manager
└── references: User (as manager)

Customer
├── name, email, phone, dateOfBirth, address
└── references: User (creator)

Application
├── applicationNumber (unique), title, description, priority, stage
├── assignedTo (User), assignedTeam (Team)
├── completedAt (when marked COMPLETED), version (concurrency control)
└── relationships: Customer, WorkItems, Activities, SyncRecord

WorkItem
├── title, description, status (TODO/IN_PROGRESS/COMPLETED)
├── assignedTo (User), assignedTeam (Team), dueDate
├── version (concurrency control)
└── relationships: Application, Activities

Activity
├── type (11 event types), description, performedBy (User), actorType (USER/SYSTEM)
├── metadata (event-specific data)
└── relationships: Application

SyncRecord
├── status (PENDING/PROCESSING/SUCCESS/FAILED), attempts, lastError
├── idempotencyKey (prevents duplicates), externalReference
├── nextRetryAt (for exponential backoff)
└── relationships: Application
```

### Key Relationships

- Customer **has many** Applications
- Application **belongs to** Customer, User (assignedTo), Team (assignedTeam)
- Application **has many** WorkItems, Activities, one SyncRecord
- WorkItem **belongs to** Application
- User **belongs to** Team (optional)
- Manager **manages** Team

---

## Authentication & Authorization

### Login Flow

1. User navigates to `/login`
2. Enters email and password
3. Frontend sends to `POST /api/auth/login`
4. Backend validates credentials against bcryptjs hashes
5. If valid, generates JWT token containing user ID, role, team
6. Frontend stores token in localStorage
7. Frontend redirects to `/dashboard`
8. Subsequent API requests include: `Authorization: Bearer <token>`

### Authorization Model

**Role-Based Access Control (RBAC)**:
- Admin routes: Only ADMINISTRATOR role can access user/team management
- Resource-Level Checks: Applications and work items verified by role/team/ownership

**Example**:
- Administrator views all applications
- Manager views only applications assigned to their team
- Executive views only applications assigned to them

**Important**: Backend enforces all authorization. Frontend hides UI elements based on role for UX; backend is the security boundary.

### Session & Token

- **Stateless JWT**: No server-side session storage required
- **Token Expiry**: Configured via `JWT_EXPIRES_IN` (default: 1 day)
- **Logout**: Token discarded from localStorage; automatically logged out on next page reload or token expiry

---

## Application Workflow

### Status Stages

```
NEW
  ↓ (can skip to IN_PROGRESS)
WAITING_FOR_INFORMATION
  ↓
IN_PROGRESS
  ↓
UNDER_REVIEW
  ↓
COMPLETED (terminal state)
```

### Workflow Rules

- Applications start in NEW
- Only valid transitions allowed (enforced by backend)
- COMPLETED is terminal; cannot reopen
- Cannot create new work items on COMPLETED applications
- Every status change tracked in Activity History

---

## External System Integration

### Synchronization

When an application reaches COMPLETED status:

1. Application immediately marked COMPLETED (synchronous operation)
2. User sees success message
3. Backend asynchronously creates a SyncRecord
4. Background sync worker attempts to send to external system:
   ```json
   {
     "applicationNumber": "APP-001",
     "customer": { "name": "...", "email": "...", "phone": "..." },
     "title": "...",
     "priority": "...",
     "completedAt": "2025-08-29T14:30:00Z"
   }
   ```

### Failure & Retry

- **Failures**: Network timeout, external system error, invalid response
- **Retry Strategy**: Exponential backoff (1min, 2min, 4min, 8min... max 1hr)
- **Worker**: Checks every 30 seconds for pending/failed syncs
- **Idempotency**: Same application always uses same idempotency key; external system should deduplicate
- **Completion Independence**: Application completion succeeds even if sync fails; sync retries asynchronously

### Viewing Sync Status

Use the sync status card on the application detail page to view:
- Current sync status (PENDING, PROCESSING, SUCCESS, FAILED)
- Number of retry attempts
- Last error message
- Next retry scheduled time

---

## Work Items

### Purpose

Work items represent discrete tasks within an application (e.g., "Review documents", "Verify income").

### Lifecycle

1. Created under an application (must be in non-COMPLETED state)
2. Assigned to a user or left unassigned
3. Transitioned through statuses: TODO → IN_PROGRESS → COMPLETED
4. Cannot create new work on COMPLETED applications

### Assignment Rules

- **Administrator**: Can assign to any user
- **Manager**: Can assign to team members only
- **Executive**: Work auto-assigns to self when creating

---

## Search, Filtering & Pagination

### Customer Search

- Search by: name, email, phone
- Case-insensitive regex matching
- Access controlled by role (non-admins see filtered results)

### Application Search

- Search by: applicationNumber, title, description
- Filter by: stage, priority, customer, assignedTo, assignedTeam
- Pagination: Default 10 per page, max 100

### Work Items

- Filter by: application, status, assignedTo
- Pagination supported

### All Lists

- **page**: Starting page (1-indexed, default 1)
- **limit**: Records per page (default 10, max 100)
- **Response includes**: pagination object with total count and total pages

---

## Assumptions & Design Decisions

### User Provisioning

**Assumption**: No registration flow required; users are provisioned through seed script.

**Decision**: `seedUsers.js` creates demo users on first setup.

**Rationale**: Assessment scope; production would implement full registration/admin provisioning.

### Workflow States

**Assumption**: Five stages appropriate for application processing.

**Decision**: NEW → WAITING_FOR_INFORMATION → IN_PROGRESS → UNDER_REVIEW → COMPLETED

**Rationale**: Common workflow pattern; extensible if needed.

### Completed Applications

**Assumption**: Once completed, applications cannot be reopened.

**Decision**: COMPLETED is a terminal state; enforced in code and database.

**Rationale**: Audit integrity; external sync makes reversal problematic.

### External Synchronization

**Assumption**: Completion should not depend on external system success.

**Decision**: Sync is asynchronous; retried in background with exponential backoff.

**Rationale**: Resilient UX; prevents external system outages from blocking business operations.

### Optimistic Locking

**Assumption**: Concurrent updates are possible but rare.

**Decision**: Version field on applications and work items; client must send current version.

**Rationale**: Simple, stateless; no lock contention; works well for low-concurrency scenarios.

### Team Structure

**Assumption**: Optional team membership for users.

**Decision**: Executives can have no team or belong to a team; managers always belong to one team.

**Rationale**: More flexible; accommodates different organizational structures.

---

## Production Considerations

Before deploying to production, consider:

### Security

- **HTTPS**: Enforce TLS encryption for all traffic
- **Secrets Management**: Use environment variable providers or secret managers (not .env files)
- **Rate Limiting**: Add rate limiting to prevent API abuse
- **CORS**: Tighten CORS configuration to specific allowed origins
- **Security Headers**: Add Helmet middleware for CSP, X-Frame-Options, etc.

### Database

- **MongoDB Replica Set**: For high availability
- **Backup Strategy**: Automated backups with point-in-time recovery
- **Connection Pooling**: Optimize connection pool settings for production load
- **Indexes**: Verify indexes on frequently queried fields (already defined in schema)

### Backend

- **Process Management**: Use PM2 or systemd for process management and auto-restart
- **Logging**: Implement structured logging (ELK stack, Datadog, CloudWatch)
- **Monitoring**: Set up metrics and alerts (Prometheus + Grafana, Datadog, New Relic)
- **Error Tracking**: Integrate Sentry for exception monitoring

### Frontend

- **Build Optimization**: Verify production build with `npm run build`
- **CDN**: Serve static assets from CDN
- **Performance**: Monitor Core Web Vitals; implement lazy loading

### External Sync

- **Message Queue**: Consider job queue (Bull.js, RabbitMQ) for high-volume sync
- **Dead Letter Queue**: Handle permanently failed syncs
- **Circuit Breaker**: Stop retrying if external system consistently fails

### Testing & CI/CD

- **Automated Tests**: Implement Jest unit tests and E2E tests
- **CI/CD Pipeline**: GitHub Actions or GitLab CI for automated builds/tests/deployments
- **Staging Environment**: Test production deployment on staging

---

## Troubleshooting

### MongoDB Connection Errors

**Issue**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
- Ensure MongoDB is running: `mongod` (local) or check Atlas connection string
- Verify `MONGODB_URI` in `.env` is correct
- Check firewall/network settings if using remote MongoDB

### Seed Script Fails

**Issue**: Seed script errors

**Solution**:
- Ensure MongoDB is running and accessible
- Check `.env` is properly configured
- Run from backend directory: `cd backend && npm run seed`
- Check for duplicate users (script skips them safely)

### Login Fails

**Issue**: "Invalid email or password"

**Solution**:
- Verify seed script was run: `npm run seed`
- Use exact credentials from seeded users table above
- Check user exists in database

### Frontend Cannot Reach Backend

**Issue**: Network errors in browser console

**Solution**:
- Ensure backend is running: `npm run dev` from backend directory
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local` points to backend
- Check CORS settings in backend; ensure `CLIENT_URL` matches frontend origin

---

## Development Workflow

### Making Changes

1. **Frontend**: Changes auto-reload via Next.js hot reload
2. **Backend**: Changes auto-reload via nodemon
3. **Database**: Schema changes require manual migration or data adjustments

### Running Tests

Currently, no automated tests are implemented. Testing is manual via:
- Browser UI testing
- API testing via curl/Postman
- Database inspection via MongoDB client

### Adding New Features

1. Define backend API route in `/src/routes/`
2. Implement controller in `/src/controllers/`
3. Add business logic in `/src/services/` if needed
4. Update frontend to call new endpoint in `/lib/api.js`
5. Create frontend component/page to use new feature
6. Test with all three roles (admin, manager, executive)

---

## Detailed Documentation

For comprehensive information about requirements, design decisions, architecture, and assumptions, see:

**[Solution Architecture & Design Decisions](docs/SOLUTION_ARCHITECTURE_AND_DESIGN_DECISIONS.md)**

This document includes:
- Assessment requirements vs implementation mapping
- Role-based access control details
- Workflow and status transition rules
- Work item management
- Activity history and audit trail
- Search and filtering implementation
- External synchronization strategy and error handling
- Concurrent update protection
- Edge case handling
- Technical decisions and trade-offs
- Production evolution recommendations

---

## Quick Start (TL;DR)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd customer-workflow-management

# 2. Backend setup
cd backend
cp .env.example .env  # or configure .env manually
npm install
npm run seed          # Create demo users (MongoDB must be running)
npm run dev           # Backend runs on :5000

# 3. Frontend setup (new terminal)
cd frontend
cp .env.local.example .env.local  # or create manually
npm install
npm run dev           # Frontend runs on :3000

# 4. Access application
# Open: http://localhost:3000
# Login with any seeded user credentials from table above
```

---

## License

ISC

---

## Support

For questions about the architecture and implementation details, refer to the [Solution Architecture & Design Decisions](SOLUTION_ARCHITECTURE_AND_DESIGN_DECISIONS.md) document included in this repository.
