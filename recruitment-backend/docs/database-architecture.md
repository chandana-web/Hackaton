# Database Architecture — Recruitment Management System

## 1. Overview

The application uses MongoDB as its document database and Mongoose as its object-document mapper. MongoDB documents have `_id` ObjectIds as primary keys. Business-facing IDs (such as `REQ-2026-000001`) provide readable, deterministic identifiers for exports and operational workflows.

Local MongoDB is configured as a **single-node replica set named `rs0`**, enabling transaction support.

## 2. Logical Collections

| Collection / Model | Purpose |
|---|---|
| `departments` / Department | Organizational departments and cost centers |
| `requisitions` / Requisition | Job requisitions, requirements, approval and lifecycle history |
| `candidates` / Candidate | Candidate profile and contact information |
| `skills` / Skill | Shared skill master data |
| `candidateskills` / CandidateSkill | Candidate-to-skill bridge with effective dates |
| `resumeartifacts` / ResumeArtifact | Resume metadata/version artifacts for candidates |
| `applications` / Application | Candidate application to a requisition, screening and stage history |
| `screeningrules` / ScreeningRule | Requisition-specific weighted screening criteria and effective versions |
| `interviewers` / Interviewer | Interviewer profiles, skills and availability windows |
| `interviews` / Interview | Interview round, schedule, panel and outcome/status |
| `feedbacks` / Feedback | Structured feedback from each panel interviewer |
| `offers` / Offer | Offer details, approval and candidate response lifecycle |
| `users` / User | Login identities, password hashes, roles and bootstrap-admin marker |
| `counters` / Counter | Sequence/counter support for generated business IDs |

Actual collection naming follows Mongoose's model-name pluralization unless explicitly overridden.

## 3. Entity Relationships

```text
Department 1 ─────── * Requisition
Department 1 ─────── * Interviewer

Requisition 1 ────── * Application * ────── 1 Candidate
Candidate 1 ──────── * ResumeArtifact
Candidate 1 ──────── * CandidateSkill * ─── 1 Skill
Requisition * ────── * Skill (requiredSkillRefs)

Requisition 1 ────── * ScreeningRule
Application 1 ────── * Interview
Interview * ──────── * Interviewer (panel)
Interview 1 ──────── * Feedback
Application 1 ────── 0..1 Offer
```

## 4. Reference Strategy

- MongoDB `_id` ObjectIds are used for internal references.
- Mongoose `ref` fields support population and relationship navigation.
- Business IDs are stored as separate immutable/unique fields where applicable.
- Application has references to Candidate and Requisition; the candidate/requisition pair must be unique.
- Interview references an Application and contains/uses panel interviewer identifiers.
- Feedback references Interview, Application and the submitting interviewer.
- Offer references an Application and is constrained to at most one offer per application by business rule/index.
- Department and Skill masters are referenced from operational records; display strings are retained in some fields for compatibility.

## 5. Key Constraints and Indexes

The schemas define validation and indexes, including:

- Unique candidate email.
- Unique requisition/candidate/interviewer/user business identifiers where defined.
- Unique candidate + requisition application pair.
- Unique application + interview round.
- Unique interview + interviewer feedback submission.
- Unique offer per application.
- Unique department name and skill name (master data).
- Screening rule uniqueness by requisition and effective start.
- Query indexes on statuses, references, department/status, created date and common search fields.
- Enum constraints for employment type, requisition/application/interview/feedback/offer states and user roles.
- Numeric bounds for screening scores, weights, experience and salary.
- Date validation for availability windows and effective intervals.

MongoDB unique indexes are the final concurrency-safe enforcement layer; service validation provides clearer user-facing errors.

## 6. Lifecycle / Audit Data

Workflow changes are retained as events rather than silently replacing history:

- Requisition: `approvalHistory` and `statusHistory`.
- Application: `stageHistory` (previous/new status, actor, remarks, timestamp).
- Offer: approval and status history.
- Interview/feedback: status, timestamps and structured records.

Use UTC timestamps. Mongoose `timestamps: true` maintains `createdAt` and `updatedAt` on applicable models.

## 7. Transactions and Replica Set

The backend's `src/utils/withTransaction.js` starts a Mongoose session and runs multi-document operations inside `session.withTransaction()`.

Local `mongod.cfg` should include:

```yaml
replication:
  replSetName: rs0
```

Initialize once in `mongosh`:

```javascript
rs.initiate()
rs.status()
```

Confirm a member is `PRIMARY`, then use a connection string such as:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/<database-name>?replicaSet=rs0
```

Preserve the existing database name and credentials/query options. Do not run `rs.initiate()` repeatedly on an already initialized replica set.

## 8. Synthetic Dataset and Reproducibility

`src/seed/generateSynthetic.js` generates deterministic synthetic records; `src/seed/seed.js` loads seed data; `src/seed/validateSynthetic.js` validates generated records.

`generated-data/` contains CSV/JSON/SQL exports, `ground_truth` files, `source_manifest.json`, and `validation-summary.json`. The data dictionary is maintained at `docs/data-dictionary.md`.

Use synthetic/fictitious candidate information only; do not place real candidate personal data in generated fixtures.

## 9. Data Management Notes

- Keep database credentials and secrets in `.env`, outside version control.
- Back up the database before destructive seed/reset operations.
- Run validation after generation or import.
- Preserve source records and event history for traceability.
- Avoid manually editing generated outputs; regenerate them from the generator and fixed seed.
