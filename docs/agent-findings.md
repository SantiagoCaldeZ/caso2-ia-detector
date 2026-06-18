# AI-Assisted Review Findings — IA Detector

This document records the relevant findings produced during AI-assisted review of IA Detector. It is not a replacement for the README. The README remains the official design and implementation contract.

The purpose of this document is to show how AI-assisted agents were used to improve the project in concrete, traceable ways: detecting inconsistencies, strengthening design decisions, aligning implementation details, and improving readiness for review.

---

## 1. Review Scope

The AI-assisted review focused on the following areas:

| Area                       | Review Goal                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Product contract           | Confirm that the system is described as a verification support tool, not as an absolute truth detector.            |
| README quality             | Strengthen the README as a design and implementation contract for developers.                                      |
| Backend architecture       | Check whether controller, service, repository, DTO, guard, and persistence responsibilities are clearly separated. |
| Frontend/backend alignment | Confirm that frontend configuration matches the backend API contract.                                              |
| Local execution            | Confirm that local development uses the same database and execution model described in the README.                 |
| Verification workflow      | Confirm that TEXT, URL, and IMAGE verification paths behave consistently with the MVP contract.                    |
| Auditability               | Confirm that verification cases generate traceable audit events.                                                   |
| Review readiness           | Identify issues that could confuse another developer or reviewer.                                                  |

---

## 2. Finding: README Must Be a Design Contract, Not a Status Report

### Observation

Earlier versions of the documentation mixed design decisions with implementation status. This created a risk that a developer could read the README as a progress log instead of as the authoritative construction contract.

### Decision

The README was reframed as a **Software Design and Implementation Contract**.

### Result

The README now clearly states that it defines:

* what the system must do;
* which frontend pages, backend modules, endpoints, DTOs, states, and records must exist;
* how the frontend, backend, database, storage, and integrations must communicate;
* which local tools are required;
* which design rules are mandatory;
* which behaviors are accepted or rejected by the MVP.

### Impact

This makes the document more useful for a developer who did not participate in the original design discussions.

---

## 3. Finding: IA Detector Must Not Return Absolute Truth Labels

### Observation

A previous risk in the design was using labels that sounded like the system was deciding truth directly, such as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.

### Decision

The product language was corrected to avoid absolute truth decisions.

### Result

The accepted editorial recommendation values are:

| Internal Value               | Meaning                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `READY_FOR_EDITORIAL_REVIEW` | Evidence and risk indicators allow the case to move to editorial review. |
| `DO_NOT_PUBLISH_YET`         | The case has high risk, contradiction, or insufficient support.          |
| `NEEDS_MANUAL_REVIEW`        | The case is ambiguous, partial, degraded, or requires human judgment.    |

### Impact

This keeps the system aligned with the product goal: supporting editorial verification instead of replacing journalistic judgment.

---

## 4. Finding: Frontend API Configuration Needed to Match the README

### Observation

The README defines `VITE_API_BASE_URL` as the frontend variable used to call the backend API.

The frontend configuration was reviewed to ensure that it uses the same variable name.

### Decision

Frontend configuration was aligned with the README contract.

### Result

The frontend now reads:

```ts
import.meta.env.VITE_API_BASE_URL
```

and falls back to:

```ts
http://localhost:3000/api
```

### Validation

The project search confirmed that `VITE_BACKEND_URL` is no longer used and that `VITE_API_BASE_URL` appears in the README and frontend configuration.

### Impact

A developer can now follow the README without needing undocumented knowledge about frontend environment variables.

---

## 5. Finding: Windows Launcher Needed to Match the Docker/PostgreSQL Contract

### Observation

The local launcher previously used a Prisma local database command that did not match the README's Docker/PostgreSQL development contract.

### Decision

The launcher was updated to use the documented local architecture:

```text
Frontend Vite/React
        ↓
Backend NestJS
        ↓
PostgreSQL in Docker
```

### Result

The launcher now performs the expected local startup sequence:

1. Install or update npm dependencies.
2. Start or create the `ia-detector-postgres` Docker container.
3. Generate Prisma Client.
4. Apply the Prisma schema to PostgreSQL.
5. Start backend and frontend development servers.

### Validation

The launcher was executed successfully and Prisma connected to:

```text
PostgreSQL database "ia_detector", schema "public" at "localhost:5432"
```

### Impact

The launcher now supports the same local execution model described in the README.

---

## 6. Finding: Backend and Frontend MVP Flow Is Demonstrable

### Observation

The project was reviewed after the frontend and backend were connected locally.

### Validation Results

The following flows were validated manually:

| Flow                 | Result                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Backend health check | Returns `status=ok` and `database=ok`.                                                              |
| Frontend startup     | Vite serves the app at `http://localhost:5173`.                                                     |
| Backend startup      | NestJS serves the API at `http://localhost:3000/api`.                                               |
| TEXT verification    | Creates a completed verification report.                                                            |
| URL verification     | Creates a completed verification report using deterministic/mock behavior.                          |
| IMAGE verification   | Creates a completed verification report with manual review recommendation and OCR uncertainty risk. |
| Verification history | Lists created cases for the current user.                                                           |
| Case detail          | Displays extracted claim, recommendation, scores, evidence, risk signals, and audit trail.          |
| Audit trail          | Shows events for the verification workflow.                                                         |

### Impact

The project can now be demonstrated through the UI, not only through backend endpoints.

---

## 7. Finding: Verification Reports Need Traceable Audit Events

### Observation

The README requires verification cases to produce a traceable audit trail.

### Decision

Audit events must be visible in the case detail view and must represent meaningful workflow steps.

### Result

The reviewed flow displays audit events such as:

* `VERIFICATION_CREATED`
* `INPUT_PREPROCESSED`
* `CLAIM_EXTRACTED`
* `EVIDENCE_SEARCH_STARTED`
* `EVIDENCE_SEARCH_COMPLETED`
* `RISK_ANALYSIS_COMPLETED`
* `ANALYSIS_REPORT_GENERATED`

### Impact

The system supports reviewability and traceability, which are important for an editorial verification product.

---

## 8. Finding: Layer Responsibilities Must Stay Explicit

### Observation

For the project to be maintainable, responsibilities must not be mixed across layers.

### Decision

The README defines explicit responsibility rules for:

| Layer              | Main Responsibility                                     |
| ------------------ | ------------------------------------------------------- |
| Controller         | HTTP routing, guards, DTO input/output.                 |
| Guard              | Authentication and authorization.                       |
| Service            | Business workflow and use-case orchestration.           |
| Repository         | Prisma persistence and database-specific queries.       |
| DTO                | API input/output shape.                                 |
| PrismaService      | Database client configuration and connection lifecycle. |
| Integration client | External provider communication.                        |
| Adapter            | Provider response normalization.                        |

### Impact

This gives developers a clear implementation boundary and reduces the risk of putting business rules in controllers or Prisma calls directly in API handlers.

---

## 9. Remaining Review Notes

The project is strong enough to demonstrate the MVP flow, but the following items should remain visible during review as intentional design constraints:

| Note                                                    | Explanation                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| Mock behavior is intentional                            | The MVP can run without live AI/OCR/fact-check provider credentials. |
| Reports are recommendations, not truth verdicts         | The system supports human editorial review.                          |
| Image verification uses deterministic OCR-like behavior | This is acceptable for the MVP demonstration contract.               |
| URL verification uses deterministic/mock extraction     | This keeps the demo stable and reproducible.                         |
| The README is authoritative                             | If code and README diverge, the team must update both deliberately.  |

---

## 10. Summary

AI-assisted review helped improve IA Detector by:

1. Strengthening the README as a design and implementation contract.
2. Removing product language that implied absolute truth decisions.
3. Aligning frontend environment configuration with the README.
4. Aligning the Windows launcher with Docker/PostgreSQL.
5. Validating the local MVP flow through backend, frontend, database, history, details, and audit trail.
6. Reinforcing layer responsibility rules.
7. Making the project easier for another developer to understand, run, and defend.

These findings support the final project goal: a robust, reviewable MVP design for an editorial verification workflow.