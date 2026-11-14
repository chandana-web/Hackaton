# Prompt History — Recruitment Management System

This file records the principal prompts/requirements used to plan and implement the assessment. It is a concise reconstruction of the prompts from project work, not a verbatim export of every chat message.

## 1. Assessment interpretation
> Design and implement a recruitment management workflow covering requisitions, applications, screening, interview panels, feedback and offers. Make decisions/exceptions visible, maintain traceability and provide measurable outputs.

## 2. System architecture
> Design a complete system architecture for the Recruitment Management System assessment, including entities, workflow, API modules, data integrity, audit history and deployment boundaries.

## 3. Database design
> Create MongoDB/Mongoose schemas for Department, JobRequisition, Candidate, Application, ResumeArtifact, Skill, CandidateSkill, ScreeningRule, Interviewer, Interview, Feedback, Offer and supporting user data. Use consistent IDs, references, indexes, unique constraints, validations and audit-friendly timestamps.

## 4. Synthetic data
> Generate reproducible synthetic baseline data: 100 requisitions, 2,000 candidates, 3,000 applications, 600 interviews and 150 offers. Use a fixed seed and parameterized scale. Include labelled edge cases and keep ground truth separate.

## 5. Validation and exports
> Validate uniqueness, foreign keys, enum values, date ordering, application duplicates, workflow/lifecycle rules and reconciliation. Export CSV, JSON and SQL with manifest and validation summary.

## 6. Backend implementation
> Implement a Node.js/Express/Mongoose REST backend with routes, controllers, services, repositories, request validation, centralized errors and workflow transitions for requisitions, candidates, applications, interviews, feedback and offers.

## 7. Interview scheduling
> Validate interviewer availability and avoid conflicting assignments during interview creation/rescheduling. Persist schedule and lifecycle changes with history.

## 8. Frontend implementation
> Create an integrated React + Vite frontend using Material UI and Recharts, with modern dashboard styling and screens connected to the backend APIs.

## 9. Authentication setup
> Configure JWT secret and a separate bootstrap administrator setup key in environment variables. Keep secrets out of source control and protect initial admin creation.

## 10. Documentation and repository
> Prepare separate backend, database and frontend architecture documents; project README; `.gitignore`; and assessment submission documentation.

## 11. Local MongoDB transaction setup
> Configure MongoDB as a single-node replica set (`rs0`), initialize it once, and add `replicaSet=rs0` to the backend MongoDB URI to support transactions.

## Reproducibility note
For a complete prompt audit trail, replace or supplement this summary with the original conversation exports or exact prompts used in each implementation session.
