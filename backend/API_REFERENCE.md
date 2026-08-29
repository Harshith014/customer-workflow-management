# Backend API Reference

This document describes the behavior implemented by the current backend source. It is based on `server.js`, every route, controller, middleware, service, model, utility, configuration module, and synchronization job under `backend/src`. It intentionally does not reproduce environment-variable values, credentials, passwords, secrets, or API keys.

## 1. Architecture Overview

### Technology and structure

- Node.js CommonJS application using Express 5.
- MongoDB accessed through Mongoose.
- JWT authentication using `jsonwebtoken`.
- Password hashing and comparison using `bcryptjs`.
- CORS using `cors`; JSON and URL-encoded request parsing are enabled globally.
- No request-validation framework, test script, file upload, email, SMS, payment, or notification integration is implemented.
- The external integration is an HTTP synchronization service. The repository also contains a mock external endpoint.

Main modules:

| Module | Responsibility |
|---|---|
| Authentication | Login, current-user lookup, JWT verification |
| Users and teams | Administrative user/team listing and creation/update |
| Customers | Customer records and application-based visibility |
| Applications | Application lifecycle, assignment, search, pagination |
| Workflow | Application stage transitions |
| Work items | Application tasks, assignment, status transitions |
| Activities | Application history and system/user audit events |
| Synchronization | Completion delivery, retry state, idempotency |

### Startup and request flow

At startup, `dotenv` is loaded, MongoDB connection is established, and only then does the server listen. The synchronization worker starts after listening. The configured port has a fallback of `5000`, and the configured CORS client origin has a local-development fallback. Actual environment values are not determinable from this document and are intentionally omitted.

Typical authenticated request flow:

```text
Client
  -> CORS / body parsers
  -> mounted Express route
  -> authenticate (Bearer JWT, reload active user from MongoDB)
  -> authorize (only on user/team administration routes where present)
  -> controller validation and resource access check
  -> service helpers and Mongoose model operations
  -> JSON response
```

The 404 handler returns JSON for unmatched routes. The final error handler logs the error and returns a generic 500 response. Controllers generally catch their own errors first, log them, and return feature-specific 500 messages.

## 2. Authentication and Authorization

### Authentication

`POST /api/auth/login` is the only token-issuing endpoint. It accepts an email and password, normalizes the email, loads the password explicitly because the model excludes it by default, checks the account state, compares the bcrypt hash, and signs a JWT. The token contains the user ID, role, and team ID or null. Its lifetime comes from configuration, with a one-day fallback.

Authenticated endpoints require:

```http
Authorization: Bearer <JWT>
```

The authentication middleware verifies the token, reloads the user by the token user ID, excludes the password, and populates the team name/description. Therefore, current database identity and `isActive` state are checked on every request; the middleware does not rely only on role/team claims in the JWT.

Authentication failures:

| Condition | Status | Message |
|---|---:|---|
| Missing or malformed Authorization header | 401 | `Authentication required` |
| Bearer header has no token | 401 | `Authentication token missing` |
| Expired JWT | 401 | `Authentication token has expired` |
| Invalid JWT or verification failure | 401 | `Invalid authentication token` |
| User deleted after token issuance | 401 | `User no longer exists` |
| User inactive | 403 | `Your account has been deactivated` |

Registration, logout, password reset/change, refresh tokens, sessions, and MFA are not implemented. The current code cannot determine whether a reverse proxy or external identity provider exists outside this repository.

### Authorization model

There are two authorization layers:

1. `authorize(...)` checks explicit roles on user and team administration routes.
2. Application and work-item controllers apply ownership/resource checks.

Roles defined by the User model:

- `ADMINISTRATOR`
- `MANAGER`
- `EXECUTIVE`

Ownership rules:

- Administrators have unrestricted application and work-item access.
- Managers are limited to records whose `assignedTeam` is their populated/current team.
- Executives are limited to records whose `assignedTo` is their own user ID.
- A manager without a team cannot normally access team-scoped records. Some list endpoints return an empty page; mutation endpoints return a 400 team-assignment error.
- Customer visibility is derived from applications because Customer has no assignment field. Non-administrators can see or update a customer only when at least one related application matches their application access rule.

## 3. RBAC Summary

| Role | User list | User create/update | Team list | Team create | Customer/application/work-item access |
|---|---|---|---|---|---|
| `ADMINISTRATOR` | Yes | Yes | Yes | Yes | Unrestricted by application/work-item ownership |
| `MANAGER` | Yes | No | Yes | No | Own assigned team |
| `EXECUTIVE` | No | No | No | No | Own assigned applications/work items |

Role checks are not applied to the customer, application, workflow, work-item, activity, or sync routes at the route level. Those routes require authentication and depend on controller checks. Any authenticated role can create customers; application/work-item creation then applies role-specific assignment behavior.

## 4. Common Response and Error Conventions

Successful responses generally use:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Some list endpoints use `count` at the top level or pagination inside `data`; login returns `data.token` and `data.user`; the health endpoint returns `success`, `message`, and `timestamp` without `data`.

Error responses generally use:

```json
{
  "success": false,
  "message": "..."
}
```

Actual status codes are listed per endpoint below. There is no custom error class or centralized validation middleware. Mongoose cast/validation/database errors that are not handled earlier generally become a feature-specific 500 response or the global `Internal server error` response.

## 5. Complete API Documentation

All paths below include the `/api` prefix supplied by `server.js`.

### Health and authentication

#### GET `/api/health`

- **Authentication:** None.
- **Purpose:** Reports that the application API process is running.
- **Headers/body/query/path:** None required.
- **Success:** `200`.

```json
{
  "success": true,
  "message": "Application Management API is running",
  "timestamp": "<ISO timestamp>"
}
```

#### POST `/api/auth/login`

- **Authentication:** None.
- **Request body:** `email` and `password` are required. Both are used as supplied except email is trimmed and lowercased for lookup.
- **Success:** `200`.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "user": "<user without password, with populated team>"
  }
}
```

- **Errors:** `400` if either field is missing; `401` for unknown email or password mismatch; `403` for an inactive account; `500` for an unexpected login failure.
- **Models:** User, with Team populated.

#### GET `/api/auth/me`

- **Authentication:** Required; any active authenticated role.
- **Headers:** `Authorization` required.
- **Body/query/path:** None.
- **Success:** `200` with `{ success: true, data: { user } }`. Password is excluded and team is populated by authentication middleware.
- **Errors:** Authentication middleware can return `401` or `403`; controller has no additional error response.

### Users

#### GET `/api/users`

- **Authentication/roles:** Required; `ADMINISTRATOR` or `MANAGER`.
- **Query:** Optional `role`, `team`, `search`, and `isActive`. `isActive` is true only when the literal string `"true"`; any other supplied value becomes false. Search creates a case-insensitive regular expression over name and email. Role/team values are passed to Mongoose without controller enum/ObjectId validation.
- **Success:** `200` with `{ success, count, data: users[] }`; passwords are excluded, team is populated with name, and results sort newest first.
- **Errors:** `401`/`403` from middleware; `500` for retrieval/database failures.
- **Models:** User, Team through population.

#### POST `/api/users`

- **Authentication/roles:** Required; `ADMINISTRATOR` only.
- **Body:** Required `name`, `email`, `password`, `role`; optional `team`.
- **Validation:** Role must be `ADMINISTRATOR`, `MANAGER`, or `EXECUTIVE`; email is trimmed/lowercased; team must identify an existing Team when supplied. Password is bcrypt-hashed with cost 12. The schema requires a password of at least six characters.
- **Success:** `201` with `{ success, message, data: { user } }`; password is excluded and team name is populated.
- **Errors:** `400` missing fields, invalid role, or nonexistent team; `409` duplicate email; `401`/`403` middleware failures; `500` unexpected failure.
- **Models:** User, Team.

#### PATCH `/api/users/:id`

- **Authentication/roles:** Required; `ADMINISTRATOR` only.
- **Path:** `id` is the User ID. Explicit ObjectId validation is not performed before `findById`.
- **Body:** Optional `name`, `role`, `team`, `isActive`. `team: null` removes the team; other supplied team IDs must exist. `role` must be one of the three model roles.
- **Success:** `200` with updated user, no password, and populated team name.
- **Errors:** `404` user not found; `400` invalid role or nonexistent team; `401`/`403` middleware failures; malformed IDs and other unexpected failures can become `500`.
- **Models:** User, Team.

### Teams

#### GET `/api/teams`

- **Authentication/roles:** Required; `ADMINISTRATOR` or `MANAGER`.
- **Headers/body/query/path:** No endpoint-specific inputs.
- **Success:** `200` with `{ success, count, data: teams[] }`, sorted by name; manager is populated with name and email.
- **Errors:** `401`/`403` middleware; `500` retrieval failure.
- **Models:** Team, User through manager population.

#### POST `/api/teams`

- **Authentication/roles:** Required; `ADMINISTRATOR` only.
- **Body:** Required `name`; optional `description` and `manager`.
- **Validation/behavior:** Name is trimmed. Description defaults to an empty string. If supplied, manager must identify a User whose role is `MANAGER`. The team is created and the manager User is separately updated with the new team ID.
- **Success:** `201` with populated manager.
- **Errors:** `400` missing name or invalid manager; `409` exact trimmed-name duplicate; `401`/`403` middleware; `500` other failures.
- **Models:** Team, User.

### Customers

#### POST `/api/customers`

- **Authentication:** Required; any active role.
- **Body:** Required `name`, `email`, `phone`; optional `dateOfBirth` and nested `address` fields `street`, `city`, `state`, `postalCode`, `country`.
- **Behavior:** Required strings are trimmed; email is lowercased; absent address fields become empty strings; `dateOfBirth` defaults to null; `createdBy` is the authenticated user.
- **Success:** `201` with `{ data: { customer } }`; `createdBy` is populated with name/email.
- **Errors:** `400` missing required fields; `401` authentication failure; schema/date/database issues can become `500`.
- **Models:** Customer, User through `createdBy`.

#### GET `/api/customers`

- **Authentication:** Required; any active role.
- **Query:** Optional `search`, `page` (default 1, minimum 1), and `limit` (default 10, clamped to 1..100). Search is escaped and case-insensitive over name/email/phone.
- **Access:** Administrators see all customers. Managers and executives first find applications matching their team/user access and restrict customers to those application customer IDs.
- **Success:** `200` with `data.customers` and `data.pagination` containing `page`, `limit`, `total`, and `totalPages`.
- **Errors:** `401` authentication failure; invalid query ObjectIds are not used here; database failures return `500`.
- **Models:** Customer, Application, User through `createdBy` population.

#### GET `/api/customers/:id`

- **Authentication:** Required.
- **Path:** Customer ObjectId required.
- **Access:** Administrators may view any existing customer. Other roles need at least one matching application (`assignedTeam` for managers, `assignedTo` for executives).
- **Success:** `200` with `{ data: { customer } }`; creator is populated with name/email.
- **Errors:** `400` invalid ID; `404` customer not found; `403` no matching application; `500` other failures.

#### PATCH `/api/customers/:id`

- **Authentication:** Required.
- **Path:** Customer ObjectId required.
- **Body:** Optional `name`, `email`, `phone`, `dateOfBirth`, and `address`. Supplied name/email/phone cannot be blank. Address fields replace only the supplied subfields and preserve existing values for omitted subfields. Date of birth can be cleared with a falsy value.
- **Access:** Administrator unrestricted; manager/executive require access to at least one related application.
- **Success:** `200` with updated populated customer.
- **Errors:** `400` invalid ID or blank scalar field; `404` customer not found; `403` access denied; `500` other failures.

#### GET `/api/customers/:id/applications`

- **Authentication:** Required.
- **Path:** Customer ObjectId required.
- **Access:** Administrator gets all applications for the customer; manager filter is own team; executive filter is own user ID. The controller checks that the customer exists before applying the application filter.
- **Success:** `200` with `{ success, count, data: { applications } }`, populated with customer, assigned user, and assigned team, newest first.
- **Errors:** `400` invalid ID; `404` customer not found; `500` retrieval failure. There is no explicit 403 response in this controller; an authorized user may receive an empty list.

### Applications

Application stages are `NEW`, `WAITING_FOR_INFORMATION`, `IN_PROGRESS`, `UNDER_REVIEW`, and `COMPLETED`. Priorities are `LOW`, `MEDIUM`, `HIGH`, and `URGENT`.

#### POST `/api/applications`

- **Authentication:** Required; any active role.
- **Body:** Required `customer` ObjectId and `title`; optional `description`, `priority`, `assignedTo`, and `assignedTeam`.
- **Validation:** Customer ID and supplied assigned-team ID must be valid ObjectIds; customer must exist; priority must be a defined enum. Title is trimmed. The controller does not verify that an assigned team exists.
- **Assignment behavior:** Executives are assigned to themselves and their team. Managers must have a team, are forced to that team, and may specify only a user in that team. Administrators may assign an active user; if no team is supplied, the user’s team is copied.
- **Success:** `201` with populated customer, assignee, team, creator, generated application number, stage, priority, and version.
- **Side effects:** Creates `APPLICATION_CREATED`; creates `APPLICATION_ASSIGNED` when assigned.
- **Errors:** `400` missing/invalid input, invalid priority, missing manager team, assigned user invalid/inactive; `403` manager cross-team assignment; `404` customer or assigned user not found; `401`; `500` other failures.
- **Models/services:** Application, Customer, User, Activity, `generateApplicationNumber`.

#### GET `/api/applications`

- **Authentication:** Required.
- **Query:** Optional `search`, `stage`, `priority`, `assignedTo`, `assignedTeam`, `customer`, `page` (default 1, minimum 1), and `limit` (default 10, clamped to 1..100). Search is escaped and case-insensitive over application number/title/description. IDs are validated when supplied; stage and priority are enum-validated.
- **Access:** Administrator all; manager own team; executive own assignee. Requested filters are added to, and cannot remove, the access filter.
- **Success:** `200` with populated `applications` and pagination (`page`, `limit`, `total`, `totalPages`).
- **Errors:** `400` invalid IDs, stage, or priority; `401`; `500` retrieval failure.

#### GET `/api/applications/:id`

- **Authentication:** Required.
- **Path:** Application ObjectId required.
- **Access:** `canAccessApplication`: administrator all, manager matching assigned team, executive matching assigned user.
- **Success:** `200` with populated application, customer details, assignee, team, and creator.
- **Errors:** `400` invalid ID; `404` not found; `403` ownership failure; `500` other failures.

#### PATCH `/api/applications/:id`

- **Authentication:** Required and ownership-checked.
- **Path/body:** Application ObjectId and required `version`. Optional update fields are `title`, `description`, and `priority`.
- **Validation/behavior:** Title cannot be blank; priority must be valid; at least one valid update field is required. Update succeeds only when database `version` equals `Number(version)`, then increments version. Records `APPLICATION_UPDATED` with changed field names.
- **Success:** `200` with populated updated application.
- **Errors:** `400` invalid ID, missing version, blank title, invalid priority, or no fields; `404`; `403`; `409` stale version; `500` other failures.

#### PATCH `/api/applications/:id/assignment`

- **Authentication:** Required.
- **Path/body:** Application ObjectId; required `version`; optional `assignedTo` and `assignedTeam`. Falsy assignment values remove the corresponding assignment.
- **Access:** Executives are rejected. Administrator or manager must pass application ownership. Managers are forced to their own team and may assign only an active user from that team. Administrators may assign any active user; if no team is supplied, the user’s team is copied. Supplied team existence is not checked.
- **Success:** `200` with populated application and assignment activity (`APPLICATION_ASSIGNED` or `APPLICATION_REASSIGNED`).
- **Errors:** `400` invalid ID, missing version, manager without team, inactive user; `403` executive/cross-team/access failures; `404` application or assigned user missing; `409` stale version; `500` other failures.

#### GET `/api/applications/:id/activities`

- **Authentication:** Required; application ownership checked.
- **Path:** Application ObjectId required.
- **Success:** The handler in `applicationRoutes` is mounted first and normally returns `200` with `count` and newest-first `data.activities`; `performedBy` is populated with name/email/role.
- **Errors:** `400` invalid ID; `404` application missing; `403` ownership failure; `500` history retrieval failure.
- **Duplicate registration:** `activityRoutes` separately registers the same path and same middleware under `/api`. Because `applicationRoutes` is mounted earlier, that second route is normally shadowed. The two handlers use different success/error messages and one includes `count` while the other does not.

### Workflow

#### PATCH `/api/applications/:id/stage`

- **Authentication:** Required and application ownership-checked.
- **Body:** Required `stage` and `version`.
- **Allowed transitions:** `NEW` -> `WAITING_FOR_INFORMATION` or `IN_PROGRESS`; `WAITING_FOR_INFORMATION` -> `IN_PROGRESS`; `IN_PROGRESS` -> `UNDER_REVIEW`; `UNDER_REVIEW` -> `COMPLETED`. Completed is terminal.
- **Behavior:** Validates ID, existence, access, transition, and version. On completion sets `completedAt`, increments version, records `STATUS_CHANGED`, creates or reuses a SyncRecord, and schedules synchronization asynchronously. The stage update response does not wait for external synchronization.
- **Success:** `200` with populated updated application.
- **Errors:** `400` invalid ID/missing fields/invalid transition/completed reopen; `404`; `403`; `409` stale version; `500` update failure. Sync-record creation errors are logged and do not turn an otherwise completed application into a failed response.

### Work items

Statuses are `TODO`, `IN_PROGRESS`, and `COMPLETED`; transitions are `TODO` -> `IN_PROGRESS` -> `COMPLETED`, with `COMPLETED` terminal.

#### POST `/api/work-items`

- **Authentication:** Required.
- **Body:** Required `application` ObjectId and `title`; optional `description`, `assignedTo`, and `dueDate`.
- **Behavior:** Application must exist, be accessible to the caller, and not be completed. Executives are assigned to themselves; managers must have a team and may assign only active users in that team; administrators may assign any active user and inherit that user’s team when no team is present. Title/description are trimmed; due date is stored or null.
- **Success:** `201` with populated application, assignee, team, creator, initial status, and version. Records `WORK_ITEM_CREATED` and assignment activity if assigned.
- **Errors:** `400` missing/invalid application, completed application, missing manager team, inactive assignee; `403` access or manager cross-team; `404` application/assignee missing; `500` other failures.

#### GET `/api/work-items`

- **Authentication:** Required.
- **Query:** Optional `application`, `status`, `assignedTo`, `page` (default 1, minimum 1), and `limit` (default 10, clamped to 1..100). IDs and status are validated when supplied.
- **Access:** Administrator all; manager own team; executive own assignee. An executive requesting another `assignedTo` receives 403. A manager without a team receives a successful empty paginated result.
- **Success:** `200` with populated work items and pagination.
- **Errors:** `400` invalid IDs/status; `403` executive filter violation; `401`; `500` retrieval failure.

#### GET `/api/work-items/:id`

- **Authentication:** Required; work-item ownership checked.
- **Path:** Work-item ObjectId required.
- **Success:** `200` with populated application, assignee, team, and creator.
- **Errors:** `400` invalid ID; `404`; `403` access failure; `500` other failures.

#### PATCH `/api/work-items/:id`

- **Authentication:** Required and ownership-checked.
- **Body:** Required `version`; optional `title`, `description`, and `dueDate`. Title cannot be blank; at least one update field is required. A falsy due date clears it.
- **Behavior:** Uses `version: Number(version)` optimistic concurrency and increments version.
- **Success:** `200` with populated work item.
- **Errors:** `400` invalid ID, missing version, blank title, or no update fields; `404`; `403`; `409` stale version; `500` other failures.

#### PATCH `/api/work-items/:id/assignment`

- **Authentication:** Required; executives cannot assign.
- **Body:** Required `version`; optional `assignedTo` (falsy removes assignment).
- **Behavior:** Validates target ID, target existence and active state. Managers may assign only within their own team. The saved team becomes the target user’s team, or the existing work-item team when unassigning. Version increments and `WORK_ITEM_ASSIGNED` is recorded.
- **Success:** `200` with populated work item.
- **Errors:** `400` invalid ID, missing version, invalid/inactive target, manager without team; `403` executive/access/cross-team; `404` item or target missing; `409` stale version; `500` other failures.

#### PATCH `/api/work-items/:id/status`

- **Authentication:** Required and ownership-checked.
- **Body:** Required `status` and `version`.
- **Behavior:** Validates the status transition, updates `completedAt` when completing, increments version, and records `WORK_ITEM_COMPLETED` on completion or `APPLICATION_UPDATED` for other status changes.
- **Success:** `200` with populated work item.
- **Errors:** `400` invalid ID, missing status/version, invalid transition; `404`; `403`; `409` stale version; `500` other failures.

### Synchronization and mock external system

#### GET `/api/applications/:id/sync`

- **Authentication:** Required; application ownership checked.
- **Path:** Application ObjectId required.
- **Success:** `200` with `data.syncRecord`, which is an object or `null` when no record exists.
- **Errors:** `400` invalid ID; `404` application missing; `403` access failure; `500` retrieval failure.

#### POST `/api/applications/:id/sync/retry`

- **Authentication:** Required; application ownership checked.
- **Path:** Application ObjectId required; no body required.
- **Behavior:** Application must be completed and have a SyncRecord. A successful record returns immediately. Otherwise status resets to `PENDING`, retry fields/errors clear, and the worker call is scheduled asynchronously.
- **Success:** `200` if already synchronized with the record; `202` when retry is scheduled.
- **Errors:** `400` invalid ID or application is not completed; `404` application or sync record missing; `403` access failure; `500` other failures.

#### POST `/api/mock-external/applications/sync`

- **Authentication:** None. This is the only implemented API endpoint with no authentication that persists business-like data besides health/login.
- **Headers:** Required `Idempotency-Key`.
- **Body:** Required `applicationNumber`, `customer`, `title`, and `completedAt`; `customer` is expected to contain `name`, `email`, and `phone`. Optional `priority` is stored, although the controller does not require it.
- **Behavior:** Waits for configured simulated latency, may return a configured random failure, checks the idempotency key, and creates a MockExternalRecord. Duplicate keys return the original external reference. Concurrent duplicate creation is handled through the unique-key error branch.
- **Success:** `200` with `data.externalReference` and `data.duplicate` (`false` for a new record, `true` for an existing one).
- **Errors:** `400` missing header/body data; `503` simulated external unavailability; `500` other persistence failures.

#### Duplicate PATCH `/api/applications/:id/assignment` from `assignmentRoutes`

This is a second registration of the same method/path. It is mounted after `applicationRoutes`, so the active application-controller route normally handles requests. The shadowed controller differs: it does not require `version`, only permits assignment to users with role `EXECUTIVE`, does not manage `assignedTeam`, and imports `canAssignApplication`, which is not exported by `applicationAccess.js`. If route order were changed, its call to the missing helper would fail and be caught as a 500. It is therefore a duplicate, inconsistent, and effectively unreachable implementation in the current mount order.

## 6. Consolidated Input Reference

### Headers

| Header | Required by | Meaning |
|---|---|---|
| `Authorization: Bearer <JWT>` | Every endpoint except health, login, and mock external sync | Authenticates an active user |
| `Content-Type: application/json` | JSON request bodies; parser supports JSON | Body format; not explicitly checked by controllers |
| `Idempotency-Key` | Mock external sync | Deduplicates external records |

### Path parameters

| Parameter | Endpoints |
|---|---|
| `:id` application ID | Application read/update/assignment/activity, stage, sync status/retry |
| `:id` customer ID | Customer read/update/applications |
| `:id` user ID | User update |
| `:id` work-item ID | Work-item read/update/assignment/status |

All explicitly validated path IDs use Mongoose ObjectId validation. User update and user/team query IDs are not consistently validated and may produce 500s from Mongoose cast errors.

### Query parameters

| Endpoint | Parameters and defaults |
|---|---|
| `/users` | `role`, `team`, `search`, `isActive`; all optional; no pagination |
| `/customers` | `search` optional; `page=1`, `limit=10`, limit clamped 1..100 |
| `/applications` | `search`, `stage`, `priority`, `assignedTo`, `assignedTeam`, `customer` optional; `page=1`, `limit=10`, limit clamped 1..100 |
| `/work-items` | `application`, `status`, `assignedTo` optional; `page=1`, `limit=10`, limit clamped 1..100 |

### Request bodies

| Endpoint | Required fields | Optional fields |
|---|---|---|
| Login | `email`, `password` | None |
| Create user | `name`, `email`, `password`, `role` | `team` |
| Update user | None | `name`, `role`, `team`, `isActive` |
| Create team | `name` | `description`, `manager` |
| Create customer | `name`, `email`, `phone` | `dateOfBirth`, nested address |
| Update customer | None | `name`, `email`, `phone`, `dateOfBirth`, nested address |
| Create application | `customer`, `title` | `description`, `priority`, `assignedTo`, `assignedTeam` |
| Update application | `version` | `title`, `description`, `priority` |
| Assign application | `version` | `assignedTo`, `assignedTeam` |
| Change application stage | `stage`, `version` | None |
| Create work item | `application`, `title` | `description`, `assignedTo`, `dueDate` |
| Update work item | `version` | `title`, `description`, `dueDate` |
| Assign work item | `version` | `assignedTo` |
| Change work-item status | `status`, `version` | None |
| Mock external sync | `applicationNumber`, `customer`, `title`, `completedAt` | `priority` |

## 7. Response Summary

| Method | Endpoint | Success | Main response |
|---|---|---:|---|
| GET | `/api/health` | 200 | `success`, message, ISO timestamp |
| POST | `/api/auth/login` | 200 | `data.token`, `data.user` |
| GET | `/api/auth/me` | 200 | `data.user` |
| GET | `/api/users` | 200 | `count`, `data[]` |
| POST | `/api/users` | 201 | `data.user` |
| PATCH | `/api/users/:id` | 200 | `data.user` |
| GET | `/api/teams` | 200 | `count`, `data[]` |
| POST | `/api/teams` | 201 | `data.team` |
| POST | `/api/customers` | 201 | `data.customer` |
| GET | `/api/customers` | 200 | `data.customers`, `data.pagination` |
| GET | `/api/customers/:id` | 200 | `data.customer` |
| PATCH | `/api/customers/:id` | 200 | `data.customer` |
| GET | `/api/customers/:id/applications` | 200 | `count`, `data.applications` |
| POST | `/api/applications` | 201 | `data.application` |
| GET | `/api/applications` | 200 | `data.applications`, `data.pagination` |
| GET | `/api/applications/:id` | 200 | `data.application` |
| PATCH | `/api/applications/:id` | 200 | `data.application` |
| PATCH | `/api/applications/:id/assignment` | 200 | `data.application` |
| GET | `/api/applications/:id/activities` | 200 | `count`, `data.activities` in active handler |
| PATCH | `/api/applications/:id/stage` | 200 | `data.application` |
| POST | `/api/work-items` | 201 | `data.workItem` |
| GET | `/api/work-items` | 200 | `data.workItems`, `data.pagination` |
| GET | `/api/work-items/:id` | 200 | `data.workItem` |
| PATCH | `/api/work-items/:id` | 200 | `data.workItem` |
| PATCH | `/api/work-items/:id/assignment` | 200 | `data.workItem` |
| PATCH | `/api/work-items/:id/status` | 200 | `data.workItem` |
| GET | `/api/applications/:id/sync` | 200 | `data.syncRecord` or null |
| POST | `/api/applications/:id/sync/retry` | 200 or 202 | Existing record or scheduled retry message |
| POST | `/api/mock-external/applications/sync` | 200 | `data.externalReference`, `data.duplicate` |
| GET | duplicate `/api/applications/:id/activities` | normally shadowed | Alternate activity response if mount order changes |
| PATCH | duplicate `/api/applications/:id/assignment` | normally shadowed | Alternate assignment controller; currently inconsistent/broken |

Common endpoint-specific errors are `400` validation/input, `401` authentication, `403` authorization, `404` missing resource, `409` duplicate or stale optimistic-concurrency state, `503` simulated mock external failure, and `500` unexpected failures. An endpoint's exact applicable statuses are listed in its section.

## 8. Database and Model Relationships

| Model | Important fields and relationships |
|---|---|
| User | Required name/email/password; role enum; optional `team` ref; `isActive`; password `select: false`; timestamps |
| Team | Unique name; description; optional `manager` User ref; `isActive`; timestamps |
| Customer | Required name/email/phone; date of birth; embedded address; required `createdBy` User ref; text index on name/email/phone |
| Application | Unique application number; required Customer ref; title/description; stage/priority enums; assigned User/Team refs; creator User ref; completion date; version; text index |
| WorkItem | Required Application ref; title/description; status enum; assigned User/Team refs; due/completion dates; creator; version |
| Activity | Application ref; activity type enum; description; optional performing User; actor type `USER` or `SYSTEM`; mixed metadata |
| SyncRecord | Unique Application ref and idempotency key; status; attempts; retry timestamps; error; external reference |
| MockExternalRecord | Unique idempotency key; application number; embedded customer snapshot; title/priority/completion date; received timestamp |

Relationship overview:

```text
User -> optionally belongs to Team
Team -> optionally names a manager User
User -> creates Customers, Applications, WorkItems, and Activities
Customer -> has many Applications
Application -> belongs to Customer; may be assigned to User and Team
Application -> has many WorkItems and Activities
Application -> has at most one SyncRecord
WorkItem -> belongs to Application; may be assigned to User and Team
SyncRecord -> produces a MockExternalRecord through the configured external URL when that URL points to the mock service
```

No delete endpoints or database-level cascade behavior are implemented. Population is used to return selected related fields; sensitive User passwords are excluded from normal user responses.

## 9. Background Jobs and Integrations

When an application reaches `COMPLETED`, the stage request creates/reuses a pending SyncRecord and schedules synchronization with `setImmediate`. The worker also runs once at startup and every 30 seconds, selecting up to 10 pending/retryable records. An in-process lock plus an atomic database claim prevents the same local worker from processing a record concurrently.

Synchronization posts application number, customer name/email/phone, title, priority, and completion date to the configured external URL plus `Idempotency-Key`. Success stores the external reference and creates a system `SYNC_SUCCEEDED` activity. Failure stores the message, marks the record `FAILED`, schedules exponential retry (one minute doubling up to one hour), and creates a best-effort `SYNC_FAILED` activity. There is no visible maximum attempt count or request timeout.

Actual external URL, delay, failure rate, database URI, JWT secret, token lifetime, and deployment topology are not determinable from the current code and are intentionally not reproduced.

## 10. Validation Rules

- User schema: name/email/password required; password minimum length six; role enum; email lowercase/trimmed. Controller validates required create fields, role, and team existence.
- Team schema: name required/unique/trimmed. Controller validates required name, duplicate exact trimmed name, and manager role/existence.
- Customer schema: name/email/phone and creator required; controller validates required create fields and nonblank update scalar fields. Email format is not validated as an email address.
- Application: customer/title/number/creator required; stage and priority model enums; controller validates customer and selected IDs, priority, stage query, assignment rules, and update version.
- Work item: application/title/creator required; status model enum; controller validates application ID, status, assignment target, title, and update version.
- Sync/mock records: required fields and unique keys are schema-enforced. Mock external controller requires idempotency key, application number, customer, title, and completedAt but does not validate their types or application existence.
- ObjectIds are explicitly validated in most application, customer, work-item, and sync paths. User update and some user/team query IDs are not consistently validated.
- There are no visible maximum string lengths, date-range rules, email-format rules, file rules, rate limits, or general schema-validation error mapper.

## 11. Feature-wise API Map

### Health

- GET `/api/health`

### Authentication

- POST `/api/auth/login`
- GET `/api/auth/me`

### Users

- GET `/api/users`
- POST `/api/users`
- PATCH `/api/users/:id`

### Teams

- GET `/api/teams`
- POST `/api/teams`

### Customers

- POST `/api/customers`
- GET `/api/customers`
- GET `/api/customers/:id`
- PATCH `/api/customers/:id`
- GET `/api/customers/:id/applications`

### Applications

- POST `/api/applications`
- GET `/api/applications`
- GET `/api/applications/:id`
- PATCH `/api/applications/:id`
- PATCH `/api/applications/:id/assignment`
- GET `/api/applications/:id/activities`
- PATCH `/api/applications/:id/stage`
- GET `/api/applications/:id/sync`
- POST `/api/applications/:id/sync/retry`

### Work items

- POST `/api/work-items`
- GET `/api/work-items`
- GET `/api/work-items/:id`
- PATCH `/api/work-items/:id`
- PATCH `/api/work-items/:id/assignment`
- PATCH `/api/work-items/:id/status`

### Mock external integration

- POST `/api/mock-external/applications/sync`

### Duplicate registrations

- GET `/api/applications/:id/activities` from `activityRoutes` (shadowed by application route)
- PATCH `/api/applications/:id/assignment` from `assignmentRoutes` (shadowed by application route)

## 12. Complete API Inventory

The table counts registered operations, so duplicate registrations are shown separately. The unique-path count is 29; the registered-operation count is 31 including health and duplicate registrations.

| # | Method | Endpoint | Purpose | Auth | Roles/ownership | Body | Query | Success |
|---:|---|---|---|---|---|---|---|---:|
| 1 | GET | `/api/health` | Health status | Public | None | None | None | 200 |
| 2 | POST | `/api/auth/login` | Issue JWT | Public | None | email/password | None | 200 |
| 3 | GET | `/api/auth/me` | Current user | Required | Any active user | None | None | 200 |
| 4 | GET | `/api/users` | List users | Required | Admin/Manager | None | role/team/search/isActive | 200 |
| 5 | POST | `/api/users` | Create user | Required | Admin | user fields | None | 201 |
| 6 | PATCH | `/api/users/:id` | Update user | Required | Admin | update fields | None | 200 |
| 7 | GET | `/api/teams` | List teams | Required | Admin/Manager | None | None | 200 |
| 8 | POST | `/api/teams` | Create team | Required | Admin | team fields | None | 201 |
| 9 | POST | `/api/customers` | Create customer | Required | Any active role | customer fields | None | 201 |
| 10 | GET | `/api/customers` | List visible customers | Required | Ownership-derived | None | search/page/limit | 200 |
| 11 | GET | `/api/customers/:id` | Read customer | Required | Ownership-derived | None | None | 200 |
| 12 | PATCH | `/api/customers/:id` | Update customer | Required | Ownership-derived | customer fields | None | 200 |
| 13 | GET | `/api/customers/:id/applications` | List customer applications | Required | Filtered by role | None | None | 200 |
| 14 | POST | `/api/applications` | Create application | Required | Role assignment rules | application fields | None | 201 |
| 15 | GET | `/api/applications` | Search/list applications | Required | Admin/team/self | None | filters/page/limit | 200 |
| 16 | GET | `/api/applications/:id` | Read application | Required | Admin/team/self | None | None | 200 |
| 17 | PATCH | `/api/applications/:id` | Update application | Required | Admin/team/self | version + fields | None | 200 |
| 18 | PATCH | `/api/applications/:id/assignment` | Assign application | Required | Admin/manager; no executive | version + assignment | None | 200 |
| 19 | GET | `/api/applications/:id/activities` | Read activity history | Required | Admin/team/self | None | None | 200 |
| 20 | PATCH | `/api/applications/:id/stage` | Change workflow stage | Required | Admin/team/self | stage/version | None | 200 |
| 21 | POST | `/api/work-items` | Create work item | Required | Application access | work-item fields | None | 201 |
| 22 | GET | `/api/work-items` | List visible work items | Required | Admin/team/self | None | filters/page/limit | 200 |
| 23 | GET | `/api/work-items/:id` | Read work item | Required | Admin/team/self | None | None | 200 |
| 24 | PATCH | `/api/work-items/:id` | Update work item | Required | Admin/team/self | version + fields | None | 200 |
| 25 | PATCH | `/api/work-items/:id/assignment` | Assign work item | Required | Admin/manager; no executive | version + assignee | None | 200 |
| 26 | PATCH | `/api/work-items/:id/status` | Change work status | Required | Admin/team/self | status/version | None | 200 |
| 27 | POST | `/api/mock-external/applications/sync` | Accept mock external sync | Public | None | sync payload | None | 200 |
| 28 | GET | `/api/applications/:id/sync` | Read sync state | Required | Admin/team/self | None | None | 200 |
| 29 | POST | `/api/applications/:id/sync/retry` | Schedule sync retry | Required | Admin/team/self | None | None | 200/202 |
| 30 | GET | `/api/applications/:id/activities` | Duplicate activity registration | Required | Alternate handler | None | None | Normally shadowed |
| 31 | PATCH | `/api/applications/:id/assignment` | Duplicate assignment registration | Required | Alternate handler | assignment only | None | Normally shadowed |

## 13. RBAC Master Matrix

Legend: ✅ allowed, ❌ not allowed, ⚠️ conditional on ownership or other controller rules.

| Endpoint family | Public | Authenticated | Administrator | Manager | Executive | Ownership/resource condition |
|---|---:|---:|---:|---:|---:|---|
| Health | ✅ | ✅ | ✅ | ✅ | ✅ | None |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | Credentials required |
| Auth me | ❌ | ✅ | ✅ | ✅ | ✅ | Active account |
| User list | ❌ | ⚠️ | ✅ | ✅ | ❌ | Route middleware role list |
| User create/update | ❌ | ⚠️ | ✅ | ❌ | ❌ | Administrator only |
| Team list | ❌ | ⚠️ | ✅ | ✅ | ❌ | Route middleware role list |
| Team create | ❌ | ⚠️ | ✅ | ❌ | ❌ | Administrator only |
| Customer create | ❌ | ✅ | ✅ | ✅ | ✅ | Any active role; creator recorded |
| Customer list/read/update | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Non-admin requires related accessible application |
| Customer applications | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Result filter by manager team/executive assignee |
| Application create | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Role-specific assignment; manager needs team |
| Application list/read/update | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Admin all; manager assigned team; executive assigned user |
| Application assignment | ❌ | ⚠️ | ✅ | ✅ | ❌ | Existing access; active target; manager own team; version |
| Application activities | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Application access |
| Application stage | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Application access, legal transition, version |
| Work-item create | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Accessible non-completed application; assignment rules |
| Work-item list/read/update/status | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Admin all; manager team; executive own assignment |
| Work-item assignment | ❌ | ⚠️ | ✅ | ✅ | ❌ | Existing access, active target, version |
| Sync read/retry | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | Accessible application; retry requires completed app |
| Mock external sync | ✅ | ✅ | ✅ | ✅ | ✅ | No authentication or application ownership check |
| Duplicate activity route | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Normally shadowed by earlier route |
| Duplicate assignment route | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Normally shadowed; alternate implementation is inconsistent/broken |

## 14. Potential Issues and Missing Protection

The following are observations from the current code. They are not changes made by this document.

### Confirmed issues

1. **Unauthenticated persistent mock endpoint** -> `mockExternalRoutes.js` / `mockExternalController.js` -> any caller can create MockExternalRecord data; the endpoint does not verify application existence, completion, or caller identity -> require authentication or isolate it to a trusted test environment and validate the referenced application.
2. **Duplicate activity and assignment routes** -> `server.js`, `applicationRoutes.js`, `activityRoutes.js`, and `assignmentRoutes.js` -> mount order shadows the later registrations and creates conflicting response behavior -> retain one canonical route/controller.
3. **Missing `canAssignApplication` export** -> `assignmentController.js` imports it, but `applicationAccess.js` exports only `buildApplicationAccessFilter` and `canAccessApplication` -> the alternate assignment controller would throw if reached -> remove the dead route or implement/export the intended helper consistently.
4. **Race-prone application number generation** -> `applicationService.js` reads the latest number and increments in application code -> concurrent creates can produce duplicate numbers and a 500 from the unique index -> use an atomic counter or retryable unique allocation.
5. **Assigned team existence/relationship is incomplete** -> active application creation/assignment validates team ID shape but not team existence or consistency with assigned user for administrators -> dangling or mismatched assignment references can be stored -> validate referenced team and user/team relationship.
6. **Inconsistent malformed-ID handling** -> user/team filters and user update pass some IDs directly to Mongoose -> cast errors can become 500 rather than client-facing 400 -> validate all externally supplied IDs consistently.
7. **User/team relationship updates are not transactional** -> team creation updates the manager in a separate write; later user/team changes do not maintain reciprocal manager references -> partial updates or stale relationships are possible -> use coordinated transactional updates or enforce relationship rules centrally.
8. **No visible external request timeout** -> `syncService.js` uses `fetch` without an abort timeout -> a slow external service can hold a worker operation for an indeterminate period -> add a bounded timeout and classify timeout failures.
9. **Retries have no maximum attempt/dead-letter state** -> `syncService.js` -> permanent external failures retry indefinitely with delay capped at one hour -> define a retry limit and operational terminal state.
10. **Activity writes are not transactional with business writes** -> application/work-item controllers create the primary record/update and activity separately -> history can be missing or a successful business change can be reported as 500 if activity creation fails -> use transactions or explicit event/outbox handling.

### Observations and possible risks

1. **Customer creation is available to every authenticated role** -> `customerRoutes.js` -> this may be intended, but no role restriction or ownership policy is present -> confirm business policy.
2. **Customer existence disclosure** -> `GET /api/customers/:id/applications` checks customer existence before filtering access -> callers without a related application can distinguish an existing customer from a nonexistent one through 404 vs an empty result -> consider uniform authorization behavior if enumeration matters.
3. **Email format and string lengths are not validated** -> user/customer/application/work-item controllers and schemas -> malformed or oversized values may be stored or fail later -> add explicit input constraints if required by the domain.
4. **No visible rate limiting** -> login and mock external synchronization -> brute-force or resource-abuse protection is not present in this repository -> apply rate limiting at the application or edge layer.
5. **Activity type mismatch** -> work-item status changes to `IN_PROGRESS` use `APPLICATION_UPDATED`, while `SYNC_STARTED` is model-allowed but unused -> consumers may receive semantically inaccurate/incomplete audit events -> align event types with behavior.
6. **Fixed demonstration accounts in the seed script** -> `seedUsers.js` -> running seed data outside development would create predictable credentials -> restrict or remove demonstration seed data for non-development environments.

## 15. Not Determinable From the Current Code

- Actual environment-variable values, including database URI, JWT secret/lifetime override, client origin, external URL, mock delay, and failure rate.
- Whether the mock endpoint is intentionally public for testing.
- Whether customer creation by all roles is intended business policy.
- Whether reverse-proxy security, HTTPS, WAF, rate limiting, or deployment-level authentication exists outside this repository.
- Whether multiple backend processes run in production and whether the in-process worker lock is sufficient in that deployment.
- Whether the configured external URL points to the included mock endpoint in a deployed environment.
- Whether deployed MongoDB has successfully created all schema-derived indexes.
- Whether any frontend or external client depends on the shadowed duplicate route behavior.