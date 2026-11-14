# Recruitment Management Frontend

React + Vite + Material UI dashboard connected to the Recruitment Backend.

## Run
```bash
npm install
npm run dev
```

Run the backend separately. For local API login, configure MongoDB, `JWT_SECRET`
and `BOOTSTRAP_ADMIN_SETUP_KEY` in the backend `.env` file; see the backend
README for setup instructions. The local demo-data endpoint reads the checked-in
synthetic dataset from `recruitment-backend/generated-data/data.json`.

Set `VITE_API_URL` to your backend API root (default `http://localhost:5000/api`).
Backend CORS must allow the Vite origin (normally `http://localhost:5173`).

## Data modes

- **Demo data** is the default. It displays the generated synthetic records in
  read-only mode and does not require a JWT or MongoDB seed.
- **Authenticated API** sends requests to the configured backend. Choose this
  mode and sign in with an account. On a fresh database, use the one-time
  first-admin setup key configured on the backend. System Admins can create
  accounts and assign roles from the Users screen. Login tokens are kept in the
  current browser tab's session storage and expire after eight hours.
  Public self-registration is intentionally disabled; an admin provisions an
  Approver account from Users, then signs out so the Approver can sign in.

The backend exposes `/api/demo-data` without authentication only outside
production by default. Set `ENABLE_DEMO_DATA=false` to disable it. The endpoint
serves synthetic fixtures only; regular API resources remain authenticated.

## Included screens
Dashboard; Requisitions (CRUD + approval/lifecycle actions); Candidates (CRUD/search);
Applications (create, screening, status transitions); Interviews (schedule, reschedule,
complete/cancel); Feedback (submit and browse); Offers (create, submit approval, approve,
send, accept/reject, withdraw/expire); Users and Interviewers (System Admin only).

In demo mode these screens are browse-only. API mode preserves the backend's
existing JWT authentication and mutation workflows.
