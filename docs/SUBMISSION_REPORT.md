# Submission Report — Recruitment Management System

## 1. Project Summary
The Recruitment Management System is a full-stack application designed to support recruitment operations from requisition creation through candidate application, screening, interviews, feedback and offers. The solution separates frontend presentation, backend business logic and persistent data storage.

## 2. Technology
- **Frontend:** React, Vite, Material UI, Recharts, React Router and Axios.
- **Backend:** Node.js, Express, Mongoose and JWT.
- **Database:** MongoDB; local development configured as a single-node replica set (`rs0`) for transaction support.
- **Validation:** Request validation and schema-level constraints; workflow rules enforced in services.

## 3. Functional Scope
- Requisition management and approval/lifecycle operations.
- Candidate management and search.
- Application creation, screening and stage progression.
- Interview scheduling, panel assignment and status management.
- Structured interviewer feedback.
- Offer creation, approval and candidate response.
- Dashboard KPIs and charts.
- Authentication and administrator setup.
- Synthetic data generation/validation/export support (as implemented).

## 4. Architecture
The frontend calls REST endpoints through a shared Axios client. Express routes apply middleware and pass requests to controllers. Controllers delegate business rules to services, which use repositories/Mongoose models for persistence. MongoDB stores operational entities and workflow history.

See:
- `docs/SYSTEM_DESIGN.md`
- `docs/backend-architecture.md`
- `docs/database-architecture.md`
- `docs/frontend-architecture.md`

## 5. Data and Traceability
The data model uses internal MongoDB references and readable business identifiers. Application stage changes, requisition decisions and offer lifecycle actions retain history. Synthetic records are intended for assessment and avoid using real candidate personal information.

## 6. Validation and Testing
Testing should cover:
- API health and CRUD flows.
- Request/schema validation.
- Referential integrity and duplicate prevention.
- Workflow transition prerequisites.
- Interview availability/conflict rules.
- Feedback completion and offer approval requirements.
- Dataset uniqueness, foreign keys, enum/date checks and reconciliation.
- Reproducibility using fixed seed and scale.

Refer to `docs/TEST_PLAN.md` and `docs/SUBMISSION_CHECKLIST.md` for detailed evidence.

## 7. Run Instructions
1. Install backend dependencies and configure backend `.env`.
2. Ensure MongoDB is running and `rs0` is PRIMARY if transactions are used.
3. Start backend with `npm run dev`.
4. Install frontend dependencies and configure `VITE_API_URL`.
5. Start frontend with `npm run dev`.

Detailed setup is in the root `README.md`.

## 8. Known Limitations / Status
Update this section before submission with verified status:
- Implemented features: [list verified features]
- Incomplete features: [list honestly]
- Dataset volumes and validation: [insert actual output]
- Tests executed and results: [insert actual results]
- Deployment status: [local / staging / production]

## 9. Conclusion
The project provides a modular foundation for recruitment workflow management, with explicit domain entities, API separation and traceable workflow decisions. Final acceptance should be based on execution evidence, dataset validation output and the completed checklist.
