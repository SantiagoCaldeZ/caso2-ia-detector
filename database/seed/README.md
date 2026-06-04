# Seed Data Plan — IA Detector

## Purpose

This document defines the seed data required for the IA Detector local MVP demo.

The seed data must allow the development team to test the main verification flow without depending on real external AI providers or real Google Fact Check credentials.

The local demo must support these scenarios:

- `PASS`
- `NO_PASS`
- `HUMAN_REVIEW`

---

## Required Seed Files

```text
database/seed/
├── README.md
├── users.seed.ts
├── verification-cases.seed.ts
├── evidence-results.seed.ts
├── risk-signals.seed.ts
└── audit-logs.seed.ts
```

---

## Seed Users

| Email | Role | Purpose |
|---|---|---|
| `journalist@iadetector.local` | `JOURNALIST` | Main user for MVP demo. |
| `admin@iadetector.local` | `ADMIN` | User for audit/history admin demo. |

## User Rules

- Passwords must be stored as hashes.
- Plain passwords must not be inserted directly into the database.
- The local demo password may be documented separately in development notes, but not stored as plain text in the database.

---

## Verification Case Seeds

The MVP must include at least three verification cases.

| Case | Input Type | Expected Status | Purpose |
|---|---|---|---|
| Reliable evidence case | `TEXT` | `PASS` | Shows a case with enough evidence and low risk. |
| Low evidence risky case | `URL` | `NO_PASS` | Shows a case with weak evidence and high risk. |
| Screenshot partial evidence case | `IMAGE` | `HUMAN_REVIEW` | Shows an ambiguous case requiring human review. |

---

## Case 1 — PASS

### Verification Case

| Field | Value |
|---|---|
| `inputType` | `TEXT` |
| `status` | `PASS` |
| `evidenceScore` | `82` |
| `riskScore` | `22` |
| `sourceAgreement` | `HIGH` |
| `decisionReason` | Reliable evidence found from multiple sources and low risk signals. |

### Required Evidence

At least 2 evidence records must be inserted.

| Field | Example |
|---|---|
| `provider` | `MOCK` |
| `sourceName` | `Mock Fact Check Source` |
| `relevanceScore` | `85` or higher |

### Required Risk Signals

At least 1 low-severity risk signal may be inserted.

---

## Case 2 — NO_PASS

### Verification Case

| Field | Value |
|---|---|
| `inputType` | `URL` |
| `status` | `NO_PASS` |
| `evidenceScore` | `35` |
| `riskScore` | `76` |
| `sourceAgreement` | `LOW` |
| `decisionReason` | Evidence is weak, risk is high, and source agreement is low. |

### Required Evidence

Evidence may be empty or low relevance.

### Required Risk Signals

At least 2 risk signals must be inserted:

- `NO_SOURCE`
- `EMOTIONAL_LANGUAGE`
- `LOW_SOURCE_AGREEMENT`

---

## Case 3 — HUMAN_REVIEW

### Verification Case

| Field | Value |
|---|---|
| `inputType` | `IMAGE` |
| `status` | `HUMAN_REVIEW` |
| `evidenceScore` | `61` |
| `riskScore` | `48` |
| `sourceAgreement` | `MEDIUM` |
| `decisionReason` | Evidence is partial and requires human editorial review. |

### Required Uploaded File

A mock uploaded file metadata record must exist in `uploaded_files`.

| Field | Example |
|---|---|
| `originalFileName` | `suspicious-screenshot-demo.png` |
| `mimeType` | `image/png` |
| `sizeBytes` | Less than 5 MB |
| `storagePath` | `storage/uploads/suspicious-screenshot-demo.png` |

### Required Risk Signals

At least 2 risk signals must be inserted:

- `OCR_UNCERTAINTY`
- `LOW_SOURCE_AGREEMENT`

---

## Audit Log Seeds

Each demo verification case must include audit logs for traceability.

Required audit events per case:

| Event | Required |
|---|---|
| `VERIFICATION_CREATED` | Yes |
| `CLAIM_EXTRACTED` | Yes |
| `EVIDENCE_SEARCH_COMPLETED` | Yes |
| `RISK_ANALYSIS_COMPLETED` | Yes |
| `AI_DECISION_COMPLETED` | Yes |

---

## Fact Check Cache Seeds

The local seed may include cached mock fact-check responses.

Required cache scenarios:

| Cache Scenario | Purpose |
|---|---|
| `pass-result.mock.json` | Used for reliable evidence case. |
| `no-pass-result.mock.json` | Used for low evidence case. |
| `human-review-result.mock.json` | Used for ambiguous case. |

Mock files must align with:

```text
/src/backend/infrastructure/integrations/factcheck/mocks/
```

---

## Acceptance Criteria

Seed data is ready when:

- The database contains one journalist user.
- The database contains one admin user.
- The database contains one `PASS` verification case.
- The database contains one `NO_PASS` verification case.
- The database contains one `HUMAN_REVIEW` verification case.
- Each case has evidence and risk signals consistent with its status.
- Each case has audit log entries.
- The image case references one uploaded file metadata record.
- The frontend can display the seeded cases in history.
- The backend demo can run without real AI or Google Fact Check credentials.