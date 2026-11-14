# Test Plan — Recruitment Management System

## 1. Purpose
Verify functional correctness, data integrity, workflow rules, API behavior, frontend integration and synthetic dataset reproducibility.

## 2. Test Levels
- **Unit:** validators, scoring, ID generation, transition rules and availability helpers.
- **Integration:** service/repository behavior against test MongoDB.
- **API:** routes, authentication, authorization, validation and error responses.
- **UI:** navigation, forms, tables, dashboard loading and error states.
- **Data validation:** generated records, references, counts, lifecycle and reconciliation.
- **End-to-end:** complete recruitment journey.

## 3. Functional Test Cases

| ID | Area | Test | Expected result |
|---|---|---|---|
| REQ-01 | Requisition | Create valid requisition | Record created with unique business ID |
| REQ-02 | Requisition | Submit for approval | Status/history updated |
| REQ-03 | Requisition | Approve pending requisition | Approved state and actor history recorded |
| REQ-04 | Requisition | Approve invalid state | Rejected with validation/business error |
| CAN-01 | Candidate | Create valid candidate | Candidate persisted |
| CAN-02 | Candidate | Duplicate email | Conflict/validation error |
| APP-01 | Application | Apply candidate to open requisition | Application linked to both parents |
| APP-02 | Application | Duplicate candidate/requisition pair | Duplicate prevented |
| APP-03 | Application | Apply to closed requisition | Rejected |
| APP-04 | Application | Invalid stage transition | Rejected; history unchanged |
| SCR-01 | Screening | Score using configured criteria | Score/decision is traceable and bounded |
| INT-01 | Interview | Schedule with available panel | Interview created |
| INT-02 | Interview | Schedule unavailable interviewer | Rejected/flagged |
| INT-03 | Interview | Schedule overlapping panel assignment | Conflict prevented |
| INT-04 | Interview | Reschedule/cancel | State/history updated |
| FB-01 | Feedback | Submit panel feedback | Feedback linked to interview/application/interviewer |
| FB-02 | Feedback | Duplicate interviewer feedback | Duplicate prevented |
| FB-03 | Feedback | Advance stage with required feedback missing | Rejected or explicit exception |
| OFF-01 | Offer | Create offer for eligible selected application | Offer created |
| OFF-02 | Offer | Create before approval/selection | Rejected |
| OFF-03 | Offer | Salary outside requisition band | Validation or labelled exception |
| OFF-04 | Offer | Approve/send/accept/decline | Valid lifecycle and history recorded |
| AUTH-01 | Auth | Request protected route without token | Unauthorized response |
| AUTH-02 | Auth | Request with valid token/role | Access granted as permitted |
| UI-01 | Dashboard | API returns valid empty collection | Zero shown as valid empty state |
| UI-02 | Dashboard | API fails/auth required | Error shown; not silently converted to zero |

## 4. Data Validation Tests
- [ ] Business identifiers are unique and follow required patterns.
- [ ] Candidate emails are unique.
- [ ] All foreign keys resolve.
- [ ] Enum values are valid.
- [ ] Date ranges have correct ordering.
- [ ] Applications reference existing candidates and requisitions.
- [ ] Duplicate application pairs are absent.
- [ ] Interview panel references active interviewers.
- [ ] Feedback references valid interviews and panel members.
- [ ] Offers reference valid applications.
- [ ] Requisition/offer salary ranges are reconciled.
- [ ] Closed requisitions with active applications are detected.
- [ ] Stage advancement without feedback is detected.
- [ ] Dataset counts reconcile with manifest and ground truth.

## 5. Edge-Case Scenarios
1. Interviewer unavailable for requested slot.
2. Duplicate candidate application.
3. Feedback missing but application advanced.
4. Offer salary outside approved band.
5. Closed requisition with active applications.

Expected behavior should be explicit: reject, block, or record as a labelled exception. Do not silently ignore.

## 6. Reproducibility Tests
1. Generate dataset using seed `20261022` and baseline scale.
2. Save generated outputs and manifest.
3. Generate again with identical seed/scale.
4. Compare stable business IDs, entity counts and deterministic fields.
5. Validate both runs and compare ground-truth reconciliation.
6. Confirm a changed seed produces a different dataset.

## 7. API and UI Smoke Tests
- [ ] `GET /api/health` succeeds.
- [ ] Authentication/bootstrap endpoints behave securely.
- [ ] CRUD list/detail requests return documented envelopes.
- [ ] Validation errors have consistent status/message structure.
- [ ] Frontend API URL is configured correctly.
- [ ] JWT is attached for protected API calls.
- [ ] Loading, empty and error states are distinct.
- [ ] Dashboard chart data is derived from successful responses.

## 8. Test Evidence
Record before submission:

| Item | Result / Evidence |
|---|---|
| Test date | [fill] |
| Commit | [fill] |
| Test command(s) | [fill from package.json] |
| Passed / failed | [fill actual counts] |
| Dataset validation | [attach actual summary] |
| Known defects | [list] |

Do not claim tests passed unless they were actually executed.
