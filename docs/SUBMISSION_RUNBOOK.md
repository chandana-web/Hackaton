# Submission Runbook — Recruitment Management System

## 1. Purpose
This runbook provides repeatable steps to configure, start, verify and hand off the Recruitment Management System.

## 2. Prerequisites
- Node.js and npm installed.
- MongoDB installed/running or a reachable MongoDB deployment.
- Git repository cloned.
- Backend and frontend dependencies installed.

## 3. Environment setup

### Backend
From `recruitment-backend/`:

```powershell
Copy-Item .env.example .env
```

Set values in `.env`:
- `PORT`
- `NODE_ENV`
- `MONGODB_URI` (include `replicaSet=rs0` for local replica-set MongoDB)
- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_SETUP_KEY`

Generate independent secrets:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Do not commit `.env`.

### Frontend
From `recruitment-frontend/`, configure `.env` as needed:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not put backend secrets in frontend variables.

## 4. Start MongoDB (local replica set)
1. Confirm `mongod.cfg` includes:

```yaml
replication:
  replSetName: rs0
```

2. Restart the MongoDB Windows service.
3. Open `mongosh` and verify:

```javascript
rs.status()
```

A member should show `PRIMARY`. Initialize only if the replica set has never been initialized:

```javascript
rs.initiate()
```

## 5. Start services

Terminal 1:

```powershell
cd recruitment-backend
npm install
npm run dev
```

Verify:

```text
http://localhost:5000/api/health
```

Terminal 2:

```powershell
cd recruitment-frontend
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

## 6. Smoke test
- [ ] Backend health endpoint returns success.
- [ ] Frontend loads without console errors.
- [ ] API base URL is correct.
- [ ] Login/bootstrap works if enabled.
- [ ] Dashboard API requests succeed and display actual values.
- [ ] Create/read a requisition.
- [ ] Create/read a candidate.
- [ ] Create an application and verify duplicate protection.
- [ ] Schedule an interview with an available panel.
- [ ] Submit feedback.
- [ ] Verify offer approval/lifecycle restrictions.
- [ ] Confirm errors are visible and understandable.

## 7. Dataset execution
Use the exact generator/seed/validation commands documented in the backend package scripts and `src/seed/` README. Record:
- Seed and scale parameters.
- Generated entity counts.
- Validation summary.
- Export locations.
- Ground-truth reconciliation result.

Do not guess command names; inspect `recruitment-backend/package.json` scripts before running.

## 8. Git handoff
From project root:

```bash
git status
git add .
git commit -m "Complete recruitment management system submission"
git push origin main
```

Before pushing, verify `.env`, `node_modules`, build output and local MongoDB data are ignored.

## 9. Troubleshooting
- **MongoDB connection error:** verify service status, port, URI/database name and credentials.
- **Transaction/replica-set error:** verify `rs.status()` shows PRIMARY and URI includes `replicaSet=rs0`.
- **Authentication needed:** login and attach JWT; verify backend route middleware and token configuration.
- **Dashboard values are zero:** inspect Network responses; distinguish successful empty data from failed API calls.
- **CORS error:** configure backend CORS for the frontend origin.
- **Port in use:** change the relevant port and update frontend API URL.

## 10. Handoff
Record the repository URL, branch/commit, environment requirements, startup commands, test evidence, generated dataset artifacts and known limitations.
