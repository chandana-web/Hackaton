# Recruitment workflow data dictionary

MongoDB documents have an immutable `_id` primary key. References below are MongoDB ObjectIds unless marked as a generated business ID. Exported files use the business IDs in the first column and reference those same IDs across files. The generator's fixed `dataAsOf` is `2027-01-31T00:00:00.000Z`; effective intervals are inclusive at their endpoints.

## Entities and cardinality

| Entity | Cardinality and optionality |
|---|---|
| Department | One department has zero or more requisitions and interviewers; each requisition has one department in generated data. |
| JobRequisition (`Requisition`) | One requisition has zero or more applications and one or more screening rules over time; required skills are many-to-many with Skill. |
| Candidate | One candidate has zero or more applications, resume artifacts, and candidate-skill links. |
| Application | Each application belongs to exactly one candidate and one requisition; one candidate/requisition pair is unique. An application has zero or more interviews and at most one offer. |
| ResumeArtifact | Each artifact belongs to exactly one candidate; a candidate can have multiple dated versions and at most one current artifact by application policy. |
| Skill | A skill can be required by many requisitions and held by many candidates. |
| CandidateSkill | Bridge between Candidate and Skill; unique candidate/skill pair with effective dates. |
| ScreeningRule | Each rule belongs to one requisition; a requisition can have multiple non-overlapping effective versions. |
| Interview | Each interview belongs to one application and has one or more interviewer panel members; application/round is unique. |
| Interviewer | One interviewer can participate in many interviews and belongs optionally to one department. |
| Feedback | Each feedback belongs to one interview, one application, and one panel interviewer; only one submission per interviewer/interview. |
| Offer | At most one offer per application; offer status and approval history are append-only events. |

History arrays are event records, not replacement state. Effective intervals use UTC timestamps, with `effectiveTo: null` meaning no scheduled end.

## Field definitions

`Required` means required for the generated record or API persistence; `Optional` means nullable or omitted. `Unique` is enforced by a MongoDB unique index where noted, and by the generator's validation for exported records.

### Department

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `departmentId` | String | Yes | `DEP-0001` style | Unique; immutable generated ID |
| `name` | String | Yes | Department name | Unique; 1–100 characters |
| `costCenter` | String | No | Local cost-center code | Trimmed |
| `isActive` | Boolean | Yes | `true` / `false` | Defaults to `true` |
| `createdAt`, `updatedAt` | Date | Yes | UTC timestamp | Managed timestamps |

### JobRequisition (`Requisition`)

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `requisitionId` | String | Generated | `REQ-2026-000001` | Unique, sparse, immutable |
| `title` | String | Yes | Job title | 2–100 characters |
| `department` | String | Yes | Display name | Required for compatibility |
| `departmentRef` | ObjectId ref | Optional | Department | Must reference an existing Department when set |
| `location` | String | Yes | Location label | Non-empty |
| `employmentType` | Enum | Yes | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` | Fixed enum |
| `experienceMin`, `experienceMax` | Number | Yes | Years | Non-negative; max >= min |
| `salaryMin`, `salaryMax` | Number | Optional | Annual salary in `currency` | Non-negative; max >= min when both set |
| `currency` | String | Optional | ISO 4217 code | Uppercase, 3 letters; defaults to `INR` |
| `openings` | Integer | Yes | Positions | >= 1 |
| `description` | String | Yes | Job description | Non-empty |
| `skills` | String[] | Optional | Job-related skill names | Used only as explicit job criteria |
| `requiredSkillRefs` | ObjectId[] ref | Optional | Skill IDs | Each reference must resolve |
| `hiringManager`, `createdBy` | String | Yes | Actor identifiers | Non-empty; creator cannot approve own request |
| `status` | Enum | Yes | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `OPEN`, `ON_HOLD`, `CLOSED`, `CANCELLED` | Defaults to `DRAFT`; changes follow state machine |
| `approvalHistory[]` | Event | Optional | `SUBMITTED`, `APPROVED`, `REJECTED` | Actor and timestamp retained |
| `statusHistory[]` | Event | Optional | Previous/new status, actor, remarks, timestamp | Appended for lifecycle changes |

### Candidate

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `candidateId` | String | Generated | `CAND-000001` | Unique, sparse, immutable |
| `firstName`, `lastName` | String | Yes | Synthetic or permitted name | Max 50 characters |
| `email` | String | Yes | `example.test` in synthetic data | Unique, lowercase, valid email |
| `phone` | String | Yes | International-formatted string | 7–20 characters |
| `location`, `currentCompany` | String | Optional | Non-sensitive profile metadata | Trimmed |
| `experience` | Number | Optional | Years | >= 0 |
| `skills` | String[] | Optional | Candidate skill names | No demographic attributes are used for screening |
| `skillRefs` | ObjectId[] ref | Optional | Skill IDs | Each reference must resolve |
| `resumeUrl` | String | Optional | URI | Valid URL when supplied |
| `source` | Enum | Optional | `LINKEDIN`, `CAREER_PAGE`, `REFERRAL`, `JOB_PORTAL`, `DIRECT`, `OTHER` | Defaults to `DIRECT` |
| `isActive` | Boolean | Yes | `true` / `false` | Deactivation preserves linked history |
| `notes` | String | Optional | Operational note | Max 2,000 characters |

### Application

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `applicationId` | String | Generated | `APP-<requisition-id>-<candidate-id>` | Unique, sparse, immutable |
| `candidate`, `requisition` | ObjectId refs | Yes | Candidate, Requisition | Both parents must exist |
| `(candidate, requisition)` | Compound key | Yes | One application per pair | Unique Mongo index |
| `status` | Enum | Yes | `APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `WITHDRAWN` | State machine; offer/hire transitions require offer workflow |
| `screening.score` | Number | Optional | 0–100 points | Derived from explicit job skills and experience |
| `screening.decision` | Enum | Optional | `PENDING`, `PASS`, `FAIL` | Derived from score and active threshold |
| `screening.criteriaBreakdown[]` | Object[] | Optional | Criterion, weight, score, contribution | No demographic/proxy inputs |
| `screening.remarks` | String | Optional | Reviewer note | Max 2,000 characters |
| `screening.screenedBy`, `screening.screenedAt` | String, Date | Optional | Actor and UTC time | Set during screening |
| `stageHistory[]` | Event[] | Yes | Previous/new status, actor, remarks, timestamp | Append-only; includes initial application event |
| `appliedAt`, `closedAt` | Date | Yes, nullable | UTC timestamps | `closedAt` set on terminal states |

### ResumeArtifact

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `resumeId` | String | Generated | `RES-2026-000001` | Unique and immutable in exports |
| `candidate` | ObjectId ref | Yes | Candidate | Parent must exist |
| `storageKey` | String | Yes | Storage reference, not file contents | Non-empty |
| `checksum` | String | Yes | SHA-256 hex | Exactly 64 hexadecimal characters |
| `source` | Enum | Yes | `CANDIDATE_UPLOAD`, `REFERRAL`, `SYNTHETIC` | Fixed enum |
| `uploadedAt` | Date | Yes | UTC timestamp | Effective artifact version date |
| `isCurrent` | Boolean | Yes | `true` / `false` | At most one current artifact per candidate by application policy |

### Skill

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `skillId` | String | Yes | `SKILL-0001` style | Unique |
| `name` | String | Yes | Skill label | Unique, max 80 characters |
| `category` | String | Yes | Skill taxonomy | Max 80 characters |
| `isActive` | Boolean | Yes | `true` / `false` | Defaults to `true` |

### CandidateSkill

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `candidate`, `skill` | ObjectId refs | Yes | Candidate, Skill | Both parents must exist |
| `candidateSkillId` | String | Generated | Candidate-skill business ID | Unique, sparse, immutable |
| `(candidate, skill, effectiveFrom)` | Compound key | Yes | One dated relationship version | Unique Mongo index; allows history |
| `proficiency` | Integer | Yes | 1–5 | Fixed range |
| `effectiveFrom`, `effectiveTo` | Date | Yes, nullable | UTC timestamps | End >= start; null end is open-ended |

### ScreeningRule

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `ruleId` | String | Yes | `RULE-2026-000001` | Unique |
| `requisition` | ObjectId ref | Yes | Requisition | Parent must exist |
| `requiredSkills[]` | Object[] | Optional | Skill ref/name and weight | Non-negative weights; names are job-related |
| `minimumExperience` | Number | Optional | Years | >= 0 |
| `experienceWeight` | Number | Optional | Score weight | 0–100 |
| `passThreshold` | Number | Yes | Score points | 0–100 |
| `effectiveFrom`, `effectiveTo` | Date | Yes, nullable | UTC timestamps | End >= start; rules are selected by effective date |
| `isActive` | Boolean | Yes | `true` / `false` | Defaults to `true` |

### Interviewer

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `interviewerId` | String | Yes | Stable interviewer identifier | Unique |
| `firstName`, `lastName` | String | Yes | Name | Non-empty |
| `email` | String | Yes | Email | Unique, lowercase |
| `department` | ObjectId ref | Optional | Department | Must resolve when supplied |
| `skills` | String[] | Optional | Interviewer expertise | Display/routing metadata |
| `availability[]` | Object[] | Optional | UTC start/end windows | End must be after start |
| `isActive` | Boolean | Yes | `true` / `false` | Inactive interviewers cannot be scheduled |
| `scheduleLockToken`, `scheduleLockExpiresAt` | String, Date | Internal | Short-lived scheduling lock | Not returned in normal queries; lock expires automatically |

### Interview

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `interviewId` | String | Generated | `INT-2026-000001` | Unique, sparse, immutable |
| `application` | ObjectId ref | Yes | Application | Parent must exist |
| `round`, `roundName` | Integer, String | Yes | Round number and label | Round >= 1; application/round unique |
| `interviewType` | Enum | Yes | `TECHNICAL`, `HR`, `MANAGERIAL`, `SCREENING`, `OTHER` | Fixed enum |
| `mode` | Enum | Yes | `ONLINE`, `ONSITE` | Fixed enum |
| `scheduledAt` | Date | Yes | UTC timestamp | Must be in future when scheduled |
| `durationMinutes` | Integer | Yes | Minutes | 15–480; defaults to 60 |
| `panel[]` | Object[] | Yes | Interviewer ID, name, optional email | Non-empty; no duplicate IDs |
| `status` | Enum | Yes | `SCHEDULED`, `RESCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` | Valid state transitions only |
| `result` | Enum | Yes | `PENDING`, `PASS`, `FAIL`, `ON_HOLD` | Structured result |
| `statusHistory[]`, `rescheduleHistory[]` | Event[] | Optional | Actor, prior/new state or date, reason, timestamp | Appended on changes |
| `scheduledBy`, `notes`, `cancellationReason` | String | Required, optional | Actor and operational text | Notes max 2,000 characters |

### Feedback

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `feedbackId` | String | Generated | `FB-<interview-id>-<interviewer-id>` | Unique, sparse, immutable |
| `interview`, `application` | ObjectId refs | Yes | Interview, Application | Must match each other |
| `interviewerId`, `interviewerName`, `submittedBy` | String | Yes | Panel member and authenticated actor | Submitter must be an assigned panel member |
| `competencies[]` | Object[] | Yes | Name, 1–5 rating, comments | At least one competency |
| `overallRating` | Number | Yes | 1–5 | Structured rating |
| `recommendation` | Enum | Yes | `STRONG_YES`, `YES`, `NO`, `STRONG_NO`, `HOLD` | Fixed enum |
| `strengths`, `weaknesses`, `comments` | String | Optional | Structured notes | 2,000/2,000/3,000 character limits |
| `submittedAt` | Date | Yes | UTC timestamp | Defaults to current time |
| `(interview, interviewerId)` | Compound key | Yes | One submission | Unique Mongo index |

### Offer

| Field | Type | Required | Allowed values / units | Unique / validation |
|---|---|---:|---|---|
| `_id` | ObjectId | Yes | Mongo key | Primary key |
| `offerId` | String | Generated | `OFF-2026-000001` | Unique, sparse, immutable |
| `application` | ObjectId ref | Yes | Application | One offer per application |
| `position`, `department` | String | Yes | Role and department labels | Non-empty |
| `salary` | Number | Yes | Annual amount in `currency` | >= 0 and within approved requisition band |
| `currency` | String | Optional | ISO 4217 | Three-letter uppercase code |
| `offerDate`, `expiryDate`, `joiningDate` | Date | Yes | UTC timestamps | Expiry and joining date after offer date |
| `status` | Enum | Yes | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `WITHDRAWN` | Approval required before sending |
| `createdBy`, `approvedBy` | String | Required, optional | Authenticated actor IDs | Creator cannot approve own offer |
| `approvedAt`, `sentAt`, `respondedAt` | Date | Optional | UTC timestamps | Set at corresponding transition |
| `statusHistory[]`, `negotiationHistory[]` | Event[] | Optional | Previous/new state, actor, terms, reason, timestamp | Append-only history |
| `rejectionReason` | String | Optional | Candidate response | Required when a sent offer is rejected |

## Lifecycle and scoring rules

- Requisition: `DRAFT/REJECTED → PENDING_APPROVAL → APPROVED → OPEN → ON_HOLD/CLOSED`; cancellation is terminal. A requester cannot approve their own requisition. Closing is rejected while active applications remain.
- Application: application creation starts at `APPLIED`; screening uses only explicit required skills and experience. Interview scheduling advances an eligible application. Generic status updates cannot create `OFFER` or `HIRED`; those changes are controlled by the offer workflow.
- Interview: scheduling/rescheduling requires active interviewers, availability-window coverage, no overlapping active booking, and a unique round. Locks are acquired in interviewer-ID order and expire after five minutes.
- Feedback: only an authenticated assigned interviewer may submit once, and only after completion. Offers require feedback from every assigned panel member for every completed round.
- Offer: salary is checked against the approved requisition band; submission and approval are separate steps; the offer creator cannot approve; sending requires approval. Send/accept/reject/expiry changes update offer and application inside one Mongo transaction.
- Synthetic data: baseline rows are generated first; the five known anomalies are then changed and labeled separately. The fixed-seed generator derives screening and offer outcomes from documented criteria; it does not use demographic fields.
