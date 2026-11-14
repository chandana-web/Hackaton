# Recruitment Management Backend

Node.js, Express, and MongoDB service for requisitions, applications, structured screening, interviews, panel feedback, and offers.

## Run the API

```powershell
npm install
Copy-Item .env.example .env
# Set MONGODB_URI and a long random JWT_SECRET in .env
npm run dev
```

`GET /api/health` is public. Recruitment API routes require a signed HS256 bearer token whose verified claims include `sub`, `role`, and `exp`. Users sign in through `POST /api/auth/login`; passwords are hashed with bcrypt and tokens expire after eight hours. Roles are `BUSINESS_REQUESTER`, `PROCESS_OWNER`, `APPROVER`, `OPERATIONS_ANALYST`, `INTERVIEWER`, `CANDIDATE`, and `SYSTEM_ADMIN`. The token subject, not a request-body actor field, is used for audit attribution.

For initial setup, configure `BOOTSTRAP_ADMIN_SETUP_KEY` to a unique random value of at least 32 characters and `JWT_SECRET` to a separate random value of at least 32 characters. Use the frontend's **First-time setup** flow to create the first System Admin. Setup is then closed once any user exists; only a System Admin can create additional accounts and assign roles through `/api/auth/users`. Do not expose the setup key publicly or reuse it as the JWT secret.

To provision an interviewer login, first add an active interviewer profile from the Interviewers screen, then associate that profile when creating the `INTERVIEWER` account. Interviewer accounts can see and complete only assigned interviews and submit feedback as their linked profile.

On Windows PowerShell, generate separate values with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set one generated value for `JWT_SECRET` and another for `BOOTSTRAP_ADMIN_SETUP_KEY` in the backend `.env` file. Keep the setup key private and remove it from the deployment environment after creating the first administrator.

For local development, `GET /api/demo-data` serves the generated synthetic dataset without authentication. It is enabled by default outside production; set `ENABLE_DEMO_DATA=false` to disable it, and do not enable it in production. This read-only endpoint does not import data into MongoDB or change the authentication requirements for other API routes.

Offer and interview/application state changes span multiple documents and use MongoDB transactions. Run MongoDB as a replica set (including local development) for these operations. For a local MongoDB server, set `replication.replSetName: rs0` in its `mongod.cfg`, restart the service, run `rs.initiate()` once in `mongosh`, and add `replicaSet=rs0` to the backend URI (for example, `mongodb://127.0.0.1:27017/recruitment?replicaSet=rs0`). Back up important data before changing database configuration.

## API resources

- `/api/requisitions` — requisition creation, approval, opening, hold, close, and cancellation
- `/api/candidates` — candidate records, search, and soft deactivation
- `/api/applications` — applications, criteria-derived screening, and permitted stage transitions
- `/api/interviews` — scheduling, rescheduling, completion, and cancellation
- `/api/feedback` — structured interviewer feedback
- `/api/offers` — drafting, approval, sending, response, withdrawal, and expiry
- `/api/auth` — one-time first-admin setup, login, current account, and admin user provisioning
- `/api/interviewers` — active interviewer directory and admin-managed interviewer availability

Mutations are role-gated. Applications cannot be created against closed requisitions or duplicated for the same candidate and requisition. Screening scores are derived from required skills and experience only. Interviewer availability and overlapping bookings are checked while holding short-lived per-interviewer scheduling locks. Offers require completed interview rounds, feedback from every assigned panel member, an in-band salary, and an approval before sending. Requisition, application, interview, and offer lifecycle changes append history.

## Synthetic data exports

The generator is deterministic and uses only synthetic profiles; no third-party candidate data is used.

```powershell
# Starter: 10 requisitions, 200 candidates, 300 applications, 60 interviews, 15 offers
npm run seed

# Requested full volume: 100 requisitions, 2,000 candidates, 3,000 applications, 600 interviews, 150 offers
npm run seed:full

# Choose an output folder, scale, and seed
node src/seed/seed.js --scale full --seed 20261022 --out generated-data
```

The output includes entity CSVs, `data.json`, normalized SQLite-compatible `seed-data.sql`, a separate `ground_truth.json`/`ground_truth.csv`, `source_manifest.json` with SHA-256 checksums, and `validation-summary.json`. Ground truth is intentionally excluded from the input JSON and SQL. Five known edge cases are injected after generation: duplicate application, interviewer overlap, stage advancement without feedback, offer above band, and closed requisition with active applications. They are labeled in ground truth and reconciliation passes only when the observed anomalies match those labels.

For reproducibility, run the same seed and scale into two empty output folders and compare the `sha256` values in their source manifests. The generator fixes its data-as-of date so output does not drift with wall-clock time.

## Data model and lifecycle

MongoDB ObjectIds are persistence keys and references. Exported synthetic data uses stable business IDs such as `REQ-2026-000001`, `CAND-000001`, `APP-<requisition-id>-<candidate-id>`, `INT-2026-000001`, `FB-<interview-id>-<interviewer-id>`, and `OFF-2026-000001`.

The API persists the normalized department, skill, candidate-skill, resume-artifact, and screening-rule entities. Legacy human-readable department/skill fields remain alongside optional references for gradual migration. Relationship cardinalities, field constraints, units, lifecycle rules, and effective-date behavior are documented in [docs/data-dictionary.md](./docs/data-dictionary.md).

## Validate

```powershell
npm test
node src/seed/seed.js --scale starter --seed 20261022 --out generated-data
node src/seed/seed.js --scale full --seed 20261022 --out generated-data-full
```

The Jest suite covers route mounting and authentication, input sanitization, screening derivation, offer approval prerequisites, atomic offer transitions, generator reproducibility, anomaly labels, and requested full-scale counts.
