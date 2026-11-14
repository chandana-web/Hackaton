# Submission Checklist — Recruitment Management System

## Application
- [ ] Backend starts successfully.
- [ ] Frontend starts successfully.
- [ ] MongoDB connection is healthy.
- [ ] Replica set `rs0` is PRIMARY when transactions are used.
- [ ] Frontend API base URL points to the correct backend.
- [ ] Login/bootstrap flow works; bootstrap endpoint is secured after setup.
- [ ] Requisition create/submit/approve/reject/open/close actions work.
- [ ] Candidate create/search/update works.
- [ ] Duplicate candidate–requisition application is rejected.
- [ ] Screening score/decision is job-related and traceable.
- [ ] Interview scheduling checks interviewer availability.
- [ ] Feedback is captured per panel interviewer.
- [ ] Application stage progression validates prerequisites.
- [ ] Offer approval and candidate response lifecycle work.
- [ ] UI displays API errors instead of silently showing zero values.

## Dataset and evidence
- [ ] Baseline volumes match assessment targets.
- [ ] Generator uses fixed seed and configurable scale.
- [ ] Re-running with same seed/parameters is reproducible.
- [ ] Ground truth is separate from operational generated data.
- [ ] Required edge cases are labelled.
- [ ] Validation summary has no unexplained failures.
- [ ] CSV, JSON and SQL exports are present.
- [ ] Manifest records seed, scale, timestamp/version and counts.
- [ ] Reconciliation totals are documented.

## Documentation
- [ ] Root README is updated with setup/run instructions.
- [ ] Backend architecture document is present.
- [ ] Database architecture document is present.
- [ ] Frontend architecture document is present.
- [ ] Data dictionary matches implemented schema.
- [ ] Assessment notes and system design are present.
- [ ] Test plan and submission runbook are present.
- [ ] Prompt history is included (summary or exact history).

## Git and security
- [ ] `.gitignore` is at repository root.
- [ ] `.env` files are not tracked.
- [ ] No passwords, JWT secrets, bootstrap keys or DB credentials are committed.
- [ ] `.env.example` contains placeholders only.
- [ ] `node_modules`, build output and local database files are ignored.
- [ ] Git status is clean after final commit.
- [ ] Repository remote and branch are correct.
- [ ] README and docs are included in the commit.

## Final handoff
- [ ] Record commit hash.
- [ ] Record run commands and environment requirements.
- [ ] Include screenshots/demo evidence if requested.
- [ ] Note known limitations and incomplete items honestly.
