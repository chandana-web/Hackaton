# Data Dictionary — Recruitment Management System

> Field names below describe the intended logical contract. Confirm exact names/types against the current Mongoose schemas before treating this as a schema migration specification.

## Conventions
- Internal references: MongoDB ObjectId.
- Business identifiers: deterministic strings, unique and immutable.
- Dates: UTC ISO-8601.
- Enumerations: values should be centralized and validated.
- Audit fields: `createdAt`, `updatedAt`; workflow histories append events.

## 1. Department
| Field | Type | Description |
|---|---|---|
| departmentId | String | Unique business ID |
| name | String | Department display name; unique |
| code | String | Short department code |
| description | String | Optional details |
| isActive | Boolean | Whether department can be selected |
| createdAt / updatedAt | Date | Audit timestamps |

## 2. JobRequisition (Requisition)
| Field | Type | Description |
|---|---|---|
| requisitionId | String | `REQ-YYYY-######`; unique |
| title | String | Role title |
| departmentId | ObjectId | Department reference |
| requesterId | ObjectId/String | Requesting user |
| headcount | Number | Number of openings |
| employmentType | Enum | Full-time, contract, internship, etc. |
| location | String | Work location/remote policy |
| requiredSkills | Array | Job-related required skills |
| minExperience / maxExperience | Number | Experience range |
| salaryMin / salaryMax | Number | Compensation band |
| status | Enum | Draft, pending approval, approved/open, on hold, closed/cancelled |
| approvalHistory | Array | Append-only approval events |
| statusHistory | Array | Append-only lifecycle events |
| createdAt / updatedAt | Date | Audit timestamps |

## 3. Candidate
| Field | Type | Description |
|---|---|---|
| candidateId | String | `CAND-######`; unique |
| firstName / lastName | String | Synthetic candidate name |
| email | String | Unique contact email |
| phone | String | Synthetic contact number |
| location | String | Candidate location |
| totalExperience | Number | Years of experience |
| skills | Array/reference | Candidate skills |
| source | Enum/String | Referral, portal, agency, etc. |
| createdAt / updatedAt | Date | Audit timestamps |

## 4. Application
| Field | Type | Description |
|---|---|---|
| applicationId | String | `APP-<req>-<candidate>`; unique |
| requisitionId | ObjectId | Requisition reference |
| candidateId | ObjectId | Candidate reference |
| appliedAt | Date | Application submission date |
| screeningScore | Number | Derived/recorded score |
| screeningDecision | Enum | Pending, pass, reject, review |
| stage | Enum | Current recruitment stage |
| stageHistory | Array | Previous/new stage, actor, reason, timestamp |
| status | Enum | Active, withdrawn, rejected, hired, etc. |
| createdAt / updatedAt | Date | Audit timestamps |

## 5. ResumeArtifact
| Field | Type | Description |
|---|---|---|
| resumeArtifactId | String | Unique artifact identifier |
| candidateId | ObjectId | Candidate reference |
| fileName | String | Resume filename/label |
| storageKey / url | String | Storage locator (avoid public sensitive URLs) |
| version | Number | Resume version |
| uploadedAt | Date | Upload timestamp |
| metadata | Object | Parsed synthetic metadata, source and checksum |

## 6. Interview
| Field | Type | Description |
|---|---|---|
| interviewId | String | `INT-YYYY-######`; unique |
| applicationId | ObjectId | Application reference |
| round | Number/String | Interview round |
| scheduledStart / scheduledEnd | Date | Slot in UTC |
| panel | Array | Interviewer references |
| mode / location | String | Online/on-site details |
| status | Enum | Scheduled, completed, cancelled, rescheduled |
| outcome | Enum | Optional interview outcome |
| createdAt / updatedAt | Date | Audit timestamps |

## 7. Feedback
| Field | Type | Description |
|---|---|---|
| feedbackId | String | `FB-<interview>-<interviewer>`; unique |
| interviewId | ObjectId | Interview reference |
| applicationId | ObjectId | Application reference |
| interviewerId | ObjectId | Interviewer reference |
| ratings | Object | Structured competency ratings |
| recommendation | Enum | Strong hire, hire, hold, no hire |
| comments | String | Job-related notes |
| submittedAt | Date | Submission timestamp |

## 8. Offer
| Field | Type | Description |
|---|---|---|
| offerId | String | `OFF-YYYY-######`; unique |
| applicationId | ObjectId | Application reference |
| salary / currency | Number/String | Offer compensation |
| joiningDate | Date | Proposed joining date |
| approvalStatus | Enum | Pending, approved, rejected |
| status | Enum | Draft, approved, sent, accepted, declined, withdrawn, expired |
| approvalHistory | Array | Append-only approval events |
| statusHistory | Array | Append-only offer events |
| createdAt / updatedAt | Date | Audit timestamps |

## 9. Interviewer
| Field | Type | Description |
|---|---|---|
| interviewerId | String | Unique business ID |
| name / email | String | Interviewer identity |
| departmentId | ObjectId | Department reference |
| skills | Array | Interview competency tags |
| availability | Array | Available date/time windows |
| isActive | Boolean | Eligible for panel assignment |

## 10. Skill
| Field | Type | Description |
|---|---|---|
| skillId | String | Unique business ID |
| name | String | Canonical skill name; unique |
| category | String | Skill grouping |
| isActive | Boolean | Available for selection |

## 11. CandidateSkill
| Field | Type | Description |
|---|---|---|
| candidateId | ObjectId | Candidate reference |
| skillId | ObjectId | Skill reference |
| proficiency | Enum/Number | Proficiency level |
| years | Number | Experience with skill |
| lastUsedAt | Date | Optional last-used date |

## 12. ScreeningRule
| Field | Type | Description |
|---|---|---|
| screeningRuleId | String | Unique rule identifier |
| requisitionId | ObjectId | Requisition reference |
| criterion | String | Job-related criterion |
| weight | Number | Non-negative weight |
| minimumScore | Number | Threshold |
| effectiveFrom / effectiveTo | Date | Rule validity window |
| version | Number | Rule version |
| isActive | Boolean | Rule availability |

## 13. User (supporting entity)
| Field | Type | Description |
|---|---|---|
| userId | String/ObjectId | User identity |
| name / email | String | Login/profile |
| passwordHash | String | Hashed password; never return to client |
| role | Enum | Requester, approver, operations, interviewer, admin |
| isActive | Boolean | Login eligibility |
| createdAt / updatedAt | Date | Audit timestamps |

## Integrity and validation
- Enforce unique business IDs and candidate email.
- Enforce unique candidate–requisition application pair.
- Enforce unique feedback per interview and interviewer.
- Validate all references and enums.
- Ensure start time precedes end time; joining date and lifecycle timestamps are coherent.
- Check salary against requisition band and flag exceptions.
- Treat aggregate/dashboard values as derived from source records.
