# Assessment Notes — Recruitment Management System

## Objective
Build a recruitment workflow system that manages requisitions, candidates, applications, structured screening, interview panels, feedback and offers. The system should make decisions and exceptions visible, retain traceability, and produce measurable/reconcilable outputs.

## Actors
- **Business Requester:** raises a hiring requisition and supplies role requirements.
- **Process Owner:** reviews hiring workflow and operational readiness.
- **Approver:** approves requisitions and offer decisions.
- **Operations Analyst:** manages candidates, applications, screening, interviews and reporting.
- **System Administrator:** manages users, configuration and system health.

## Core workflow
1. Maintain master data: Department, JobRequisition, Candidate and ResumeArtifact (plus Skill/Interviewer reference data).
2. Create applications only against valid candidates and requisitions.
3. Screen applications using job-related criteria and record scores/rationale.
4. Schedule interviews only for eligible applications and available interviewers.
5. Collect structured feedback from assigned panel members.
6. Progress applications through valid stages with explicit history.
7. Create offers only after required approvals; record candidate response and offer lifecycle.

## Key design principles
- Use deterministic business identifiers alongside MongoDB ObjectIds.
- Enforce referential integrity in service logic and indexes.
- Preserve event/history records; do not overwrite prior decisions.
- Keep derived metrics calculated from source records.
- Use synthetic candidate data for assessment datasets.
- Label edge cases and make them discoverable in validation output.
- Keep secrets in environment files, not source control.

## Deterministic ID conventions
- Requisition: `REQ-2026-000001`
- Candidate: `CAND-000001`
- Application: `APP-<requisition-id>-<candidate-id>`
- Interview: `INT-2026-000001`
- Feedback: `FB-<interview-id>-<interviewer-id>`
- Offer: `OFF-2026-000001`

## Required baseline volumes
| Entity | Baseline |
|---|---:|
| Requisitions | 100 |
| Candidates | 2,000 |
| Applications | 3,000 |
| Interviews | 600 |
| Offers | 150 |

Use a fixed seed (for example, `20261022`) and parameterized scale so the same seed/parameters reproduce the same logical dataset.

## Explicit edge cases
- Interviewer unavailable during requested slot.
- Duplicate application for the same candidate and requisition.
- Application stage advanced while feedback is missing.
- Offer salary outside the requisition band.
- Closed requisition with active applications.

Each edge case should be labelled in generated data or a companion edge-case manifest and checked by validation.

## Acceptance evidence
- Data dictionary for the required entities.
- Reproducible generator command and seed.
- Ground-truth CSV/JSON kept separate from generated operational data.
- Validation summary covering IDs, foreign keys, enums, date order, duplicate applications, lifecycle rules and reconciliation.
- CSV/JSON/SQL export capability.
- README, system design, test plan and submission runbook/checklist.
