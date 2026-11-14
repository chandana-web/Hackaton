# System Design — Recruitment Management System

## 1. Goals
- Manage the recruitment lifecycle from hiring request to offer response.
- Keep approvals, stage changes and feedback traceable.
- Prevent invalid relationships and workflow transitions.
- Provide operational visibility through a dashboard and exports.
- Support reproducible synthetic assessment datasets.

## 2. System Context

```text
Business Requester / Approver / Operations / Interviewer / Admin
                              |
                              v
                    React + Vite SPA
                  (MUI, Recharts, Axios)
                              |
                        HTTPS / JSON
                              |
                              v
                    Node.js + Express API
              ┌───────────────┼────────────────┐
              v               v                v
        Auth / RBAC       Validators       Controllers
              └───────────────┼────────────────┘
                              v
                           Services
                (workflow rules / transactions)
                              |
                              v
                      Repositories / ODM
                              |
                              v
                   MongoDB (replica set)
```

## 3. Logical Components

### Frontend
- Dashboard and KPI visualizations.
- Resource screens for requisitions, candidates, applications, interviews, feedback and offers.
- Shared API client and data-source abstraction.
- Demo/API mode and role-aware UI navigation.

### Backend
- REST route modules organized by domain.
- Authentication and authorization middleware.
- Validation middleware for request payloads and parameters.
- Controllers for HTTP concerns.
- Services for business rules, state transitions and transaction boundaries.
- Repositories for data access.
- Centralized errors and request logging.

### Database
- Master data and transactional collections.
- References and unique indexes enforce data integrity.
- Embedded event/history arrays or history records preserve decisions.
- MongoDB transactions protect multi-document updates.

## 4. Domain Model

```text
Department ──< Requisition ──< Application >── Candidate
                                  |
                                  ├──< Interview >──< Feedback
                                  |       |
                                  |       └── panel: Interviewer[]
                                  |
                                  └── Offer (0..1)

Candidate ──< ResumeArtifact
Candidate ──< CandidateSkill >── Skill
Requisition ──< ScreeningRule
Department ──< Interviewer
User ── actor for requests, approvals and workflow events
```

## 5. Recruitment Lifecycle

```text
Requisition Draft
  → Submitted
  → Pending Approval
  → Approved
  → Open
  → Closed / On Hold / Cancelled

Application
  → Applied
  → Screening
  → Shortlisted / Rejected
  → Interview(s)
  → Selected
  → Offer Pending Approval
  → Offer Approved
  → Offer Sent
  → Accepted / Declined / Expired / Withdrawn
```

Exact enum names and allowed transitions must match the implemented service validators. A transition should record actor, timestamp, previous state, next state and reason/remarks where applicable.

## 6. Screening and Decisions
- Screening criteria are job-related and associated with a requisition/rule version.
- Scores are calculated from defined criteria/weights or stored with a documented rationale.
- Derived score fields should be reproducible from source criteria.
- Screening decisions retain decision metadata and history.

## 7. Interview Scheduling
- An interview belongs to an application and a round.
- Panel members are selected from active interviewers.
- Requested time must fit interviewer availability.
- Conflicting assignments should be rejected or flagged.
- Reschedule/cancel operations append lifecycle history.
- Feedback is recorded per interviewer and linked to the interview/application.

## 8. Offer Controls
- Offer creation requires an eligible application and selection decision.
- Offer approval is separate from creation.
- Salary outside the requisition band is flagged/rejected according to policy.
- Offer status changes are validated and recorded.
- Candidate acceptance/decline is retained as an outcome.

## 9. Data Integrity
- Unique business IDs.
- Unique candidate email.
- Unique application per candidate/requisition.
- Referential validation for all parent records.
- Unique feedback per interview/interviewer.
- Date ordering and enum validation.
- Required parent/lifecycle state checks.
- Database indexes support common lookup and status filters.

## 10. Audit and Observability
- Preserve requisition approval/status history.
- Preserve application stage history.
- Preserve offer approval/status history.
- Store created/updated timestamps and actor information.
- Log API requests and centralized errors.
- Provide validation/reconciliation outputs for generated datasets.

## 11. Synthetic Data and Exports
Baseline dataset:
- 100 requisitions
- 2,000 candidates
- 3,000 applications
- 600 interviews
- 150 offers

Generation uses a fixed seed and scale parameter. Edge cases are explicitly labelled. Ground truth is separate from operational records. Exports include CSV, JSON and SQL, with manifest and validation summary.

## 12. Security
- JWT authentication and role-based backend authorization.
- Password hashes only; never expose password fields.
- Bootstrap admin setup protected by a separate secret and disabled/secured after initial use.
- Secrets held in environment variables.
- CORS restricted to approved frontend origins.
- Synthetic data only for assessment/demo scenarios.

## 13. Deployment View
- Frontend static build served by a web host/CDN.
- Backend Node process deployed separately.
- MongoDB deployed as managed cluster or replica set.
- Environment configuration and secrets supplied by deployment environment.
- Configure HTTPS, CORS, logs, backups and health checks before production use.
