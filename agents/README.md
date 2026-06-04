# AI Development Agents — IA Detector

## Purpose

This document defines the AI development agents that will support the construction and review of IA Detector.

These agents are not part of the user-facing product. They are development assistants used by the team to review design decisions, code structure, SOLID compliance, architecture alignment, database design, frontend implementation, backend implementation, and testing.

Every agent output must be documented with:

- findings,
- suggested corrections,
- corrections applied,
- files reviewed,
- date of review.

---

## Project Rule

Agents must review the project against the official documentation.

The source of truth is:

- `README.md`
- `docs/product/mvp-scope.md`
- `docs/frontend/frontend-design.md`
- `docs/backend/backend-design.md`
- `docs/data/database-design.md`
- `docs/architecture/system-integrations.md`
- `docs/architecture/architectural-patterns.md`
- `docs/architecture/agentic-patterns.md`
- `database/dbml/ia-detector.dbml`
- `prisma/schema.prisma`

If an agent finds that code and documentation disagree, the issue must be reported and corrected.

---

# Agent 1 — SOLID Reviewer Agent

## Purpose

Review backend and frontend classes/services for SOLID principle violations.

## Input

- Source files from `/src/frontend`
- Source files from `/src/backend`
- Backend design document
- Frontend design document

## Responsibilities

The agent must check:

- Single Responsibility Principle violations.
- Services with too many responsibilities.
- Direct dependency on external providers.
- Business logic inside controllers.
- Duplicated decision rules outside `AIDecisionGate`.
- Repeated validation logic.
- Hardcoded configuration.

## Expected Output

| Field | Required |
|---|---|
| Files reviewed | Yes |
| SOLID issue found | Yes/No |
| Principle violated | If applicable |
| Explanation | Yes |
| Suggested correction | Yes |
| Correction applied | Pending / Applied |

## Developer Rule

No code should be considered ready if the SOLID Reviewer Agent detects classification logic outside `AIDecisionGate`.

---

# Agent 2 — Architecture Validation Agent

## Purpose

Validate that the implementation matches the documented architecture.

## Input

- `docs/backend/backend-design.md`
- `docs/frontend/frontend-design.md`
- `docs/architecture/architectural-patterns.md`
- `docs/architecture/agentic-patterns.md`
- `/src`

## Responsibilities

The agent must verify:

- Controllers do not contain business logic.
- External integrations are not called directly from controllers.
- AI operations go through `AIAmbassador`.
- Fact-check integration goes through `FactCheckEvidenceService`.
- Classification goes through `AIDecisionGate`.
- Frontend uses the documented verification states.
- API DTOs match frontend and backend contracts.
- Folder structure matches the documented `/src` structure.

## Expected Output

| Field | Required |
|---|---|
| Architecture mismatch | Yes/No |
| Documented location | Yes |
| Actual location | Yes |
| Impact | Yes |
| Required correction | Yes |
| Correction applied | Pending / Applied |

---

# Agent 3 — Frontend Agent

## Purpose

Review the frontend implementation against the frontend design document.

## Input

- `docs/frontend/frontend-design.md`
- `/src/frontend`

## Responsibilities

The agent must verify:

- The UI supports text, URL, and image/screenshot input.
- The UI shows `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.
- The UI never shows final labels as `TRUE` or `FALSE`.
- The results page shows evidence, risk signals, scores, and source agreement.
- The frontend uses DTOs compatible with backend contracts.
- The verification flow follows the Figma prototype.
- Validation exists for empty text, invalid URL, unsupported image type, and image size.

## Expected Output

| Field | Required |
|---|---|
| Screen reviewed | Yes |
| Component reviewed | Yes |
| Issue found | Yes/No |
| Design rule violated | If applicable |
| Suggested correction | Yes |
| Correction applied | Pending / Applied |

---

# Agent 4 — Backend Agent

## Purpose

Review the backend implementation against the backend design document.

## Input

- `docs/backend/backend-design.md`
- `/src/backend`

## Responsibilities

The agent must verify:

- Controllers only receive requests and return DTOs.
- `CreateVerificationCaseService` orchestrates the verification workflow.
- `ClaimExtractionService` uses `AIAmbassador`.
- `FactCheckEvidenceService` uses cache and fact-check integration.
- `AIDecisionGate` is the only component that returns `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
- Provider failures are handled as controlled errors or partial evidence.
- Every verification case creates audit logs.
- Backend never returns `TRUE` or `FALSE`.

## Expected Output

| Field | Required |
|---|---|
| Endpoint reviewed | Yes |
| Service reviewed | Yes |
| Issue found | Yes/No |
| Business rule violated | If applicable |
| Suggested correction | Yes |
| Correction applied | Pending / Applied |

---

# Agent 5 — Database Agent

## Purpose

Review database schema, Prisma schema, DBML, and seed data alignment.

## Input

- `docs/data/database-design.md`
- `database/dbml/ia-detector.dbml`
- `prisma/schema.prisma`
- `database/seed/`

## Responsibilities

The agent must verify:

- DBML and Prisma schema define the same entities.
- Required enums match backend DTOs.
- Verification cases support `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.
- Evidence, risk signals, audit logs, uploaded files, and cache are correctly related.
- Refresh tokens are stored as hashes.
- Passwords are stored as hashes.
- No table stores final truth labels as `TRUE` or `FALSE`.
- Seed data supports local demo flows.

## Expected Output

| Field | Required |
|---|---|
| Schema reviewed | Yes |
| Mismatch found | Yes/No |
| Affected table/model | If applicable |
| Suggested correction | Yes |
| Correction applied | Pending / Applied |

---

# Agent 6 — Testing Agent

## Purpose

Review whether the MVP has enough tests to validate the main flow.

## Input

- `docs/backend/backend-design.md`
- `docs/frontend/frontend-design.md`
- `/src`
- `/tests`

## Responsibilities

The agent must verify tests for:

- `AIDecisionGate` returns `PASS` for high evidence and low risk.
- `AIDecisionGate` returns `NO_PASS` when evidence is weak or risk is high.
- `AIDecisionGate` returns `HUMAN_REVIEW` for ambiguous cases.
- Text verification flow.
- URL verification flow.
- Image/screenshot verification flow.
- Invalid input handling.
- Unauthorized access.
- History access by owner.
- Mock fact-check responses.

## Expected Output

| Field | Required |
|---|---|
| Test file reviewed | Yes |
| Missing test | Yes/No |
| Risk if missing | Yes |
| Suggested test | Yes |
| Correction applied | Pending / Applied |

---

# Agent Review Log Template

Every agent review must be documented using this format.

```md
## Review — [Agent Name]

| Field | Value |
|---|---|
| Date | YYYY-MM-DD |
| Reviewer | Name of team member using the agent |
| Files reviewed | List of files |
| Agent used | Agent name |
| Result | Passed / Issues found |

### Findings

| ID | Finding | Severity | Suggested Correction | Correction Applied |
|---|---|---|---|---|
| F-001 | Pending | Pending | Pending | Pending |

### Summary

Pending.
```

---

## Current Agent Review Status

| Agent | Status |
|---|---|
| SOLID Reviewer Agent | Pending |
| Architecture Validation Agent | Pending |
| Frontend Agent | Pending |
| Backend Agent | Pending |
| Database Agent | Pending |
| Testing Agent | Pending |

---

## Acceptance Criteria

The AI development agent documentation is complete when:

- each required agent has a clear purpose,
- each agent has defined inputs,
- each agent has concrete responsibilities,
- each agent has expected output format,
- agent review results can be documented,
- corrections suggested by agents can be tracked,
- agents review the project against official documentation,
- agents do not replace developer responsibility.