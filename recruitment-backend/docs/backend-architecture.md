# Backend Architecture — Recruitment Management System

## 1. Overview

The backend is a Node.js application built with Express and Mongoose. It exposes REST endpoints for recruitment operations, applies request validation and authentication/authorization, and delegates business logic through controllers, services, and repositories.

**Runtime entry:** `server.js` (starts the process and connects MongoDB)  
**Express application:** `src/app.js`  
**Database connection:** `src/config/db.js`

## 2. Technology Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT-based authentication
- Zod request validation (via validation middleware and validators)
- Helmet, CORS, Morgan
- MongoDB sessions/transactions for multi-document workflows

## 3. Request Flow

```text
React + Vite client
       |
       | HTTP / JSON
       v
Express app (src/app.js)
  ├─ Helmet / CORS
  ├─ JSON + URL-encoded parsers
  ├─ Morgan request logging
  ├─ /api/health and /api/demo-data
  └─ API routers
       |
       v
Routes → Authentication / Validation middleware
       |
       v
Controllers (HTTP request/response)
       |
       v
Services (business rules, workflow transitions)
       |
       v
Repositories (Mongoose queries)
       |
       v
MongoDB collections
       |
       v
Not-found middleware → centralized error handler
```

## 4. Source Structure

| Directory | Responsibility |
|---|---|
| `src/config/` | MongoDB connection configuration |
| `src/controllers/` | Translate HTTP requests into service calls and responses |
| `src/middleware/` | Authentication, request validation, 404 and error handling |
| `src/models/` | Mongoose schemas, enums, references, indexes and timestamps |
| `src/repositories/` | Database access/query operations |
| `src/routes/` | Route definitions and middleware composition |
| `src/services/` | Domain rules, workflow logic and transaction orchestration |
| `src/validators/` | Request payload/query validation |
| `src/utils/` | Shared helpers: IDs, roles, scoring, transactions, query features |
| `src/seed/` | Synthetic data generation, loading and validation |
| `generated-data/` | Generated CSV/JSON/SQL, ground truth and manifest |
| `docs/` | Data dictionary and project documentation |

## 5. API Modules

| Module | Base path | Responsibility |
|---|---|---|
| Authentication | `/api/auth` | Bootstrap admin setup, login and identity/token workflows |
| Requisitions | `/api/requisitions` | Create/manage requisitions, submit/approve/reject and lifecycle |
| Interviewers | `/api/interviewers` | Interviewer profiles and availability |
| Candidates | `/api/candidates` | Candidate records, lookup and search |
| Applications | `/api/applications` | Candidate–requisition applications, screening and stage changes |
| Interviews | `/api/interviews` | Scheduling, panel assignment, rescheduling and completion |
| Feedback | `/api/feedback` | Structured interviewer feedback |
| Offers | `/api/offers` | Offer creation, approval and candidate response lifecycle |
| Health | `/api/health` | API health check |
| Demo data | `/api/demo-data` | Synthetic data endpoint (disabled in production unless explicitly enabled) |

Route definitions are in `src/routes/`; controllers, services and repositories are separated by domain.

## 6. Authentication and Authorization

- JWT signing/verification uses `JWT_SECRET`.
- Initial administrator bootstrap is protected by `BOOTSTRAP_ADMIN_SETUP_KEY`.
- User accounts are stored in the `User` collection; passwords are stored as hashes (`passwordHash` is excluded from normal query selection).
- Roles are defined in `src/utils/roles.js` and used by authorization logic.
- Keep secrets in `.env`; do not commit `.env` or expose secrets in frontend code.
- Bootstrap setup should be disabled/secured after the initial administrator is created.

## 7. Workflow and Integrity

- Services enforce business state transitions rather than allowing arbitrary status updates.
- Requisition approval and application stage changes retain history.
- Interview scheduling checks interviewer availability and prevents conflicting assignments according to service rules.
- Feedback is tied to an interview, application and panel interviewer.
- Offers follow approval and lifecycle rules; offer creation is linked to an application.
- Multi-document operations use `src/utils/withTransaction.js` and MongoDB sessions.
- Transaction support requires MongoDB replica-set mode (single-node `rs0` is sufficient for local development).

## 8. Error Handling and Observability

- `src/middleware/notFound.js` handles unmatched routes.
- `src/middleware/errorHandler.js` centralizes error responses.
- `src/utils/AppError.js` represents expected application errors.
- Morgan logs HTTP requests in development.
- `GET /api/health` can be used for a basic availability check.

## 9. Environment Configuration

Example `.env` (use actual values locally; never commit secrets):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/<database-name>?replicaSet=rs0
JWT_SECRET=<strong-random-secret>
BOOTSTRAP_ADMIN_SETUP_KEY=<different-strong-random-secret>
ENABLE_DEMO_DATA=true
```

## 10. Local Run

```bash
npm install
npm run dev
```

Check:

```text
GET http://localhost:5000/api/health
```

