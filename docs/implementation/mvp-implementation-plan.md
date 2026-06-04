# MVP Implementation Plan — IA Detector

## Purpose

This document defines the implementation plan for the IA Detector MVP.

The goal is to guide the development team through the correct build order so frontend, backend, database, integrations, mocks, tests, and demo flow stay aligned with the official design documentation.

This plan must be followed before writing disconnected features. Each phase includes:

- objective,
- required files,
- implementation tasks,
- dependencies,
- acceptance criteria.

---

## Source of Truth

The implementation must follow these documents:

| Area | Document |
|---|---|
| Product scope | `docs/product/mvp-scope.md` |
| UX prototype | `docs/ux/prototype.md` |
| Frontend design | `docs/frontend/frontend-design.md` |
| Backend design | `docs/backend/backend-design.md` |
| Database design | `docs/data/database-design.md` |
| System integrations | `docs/architecture/system-integrations.md` |
| Architectural patterns | `docs/architecture/architectural-patterns.md` |
| Agentic patterns | `docs/architecture/agentic-patterns.md` |
| DBML model | `database/dbml/ia-detector.dbml` |
| Prisma schema | `prisma/schema.prisma` |
| Seed data plan | `database/seed/README.md` |
| AI development agents | `agents/README.md` |

If implementation and documentation disagree, the team must either:

1. update the implementation to match the documentation, or
2. update the documentation and explain the reason in the commit message.

---

## MVP Goal

Build a local functional MVP where a journalist can:

1. log in,
2. submit suspicious text, URL, image, or screenshot,
3. receive a verification result,
4. see extracted claim, evidence, scores, risk signals, and classification,
5. view previous verification cases in history.

The MVP must support these classifications:

- `PASS`
- `NO_PASS`
- `HUMAN_REVIEW`

The MVP must not display final results as:

- `TRUE`
- `FALSE`

---

# Implementation Phases

---

## Phase 1 — Project Setup

### Objective

Create the base project structure, dependencies, environment files, and local execution setup.

### Required Files

```text
package.json
.env.example
.gitignore
src/
src/frontend/
src/backend/
prisma/schema.prisma
storage/uploads/.gitkeep
```

### Tasks

1. Initialize the root Node.js project.
2. Add base scripts for frontend, backend, linting, testing, Prisma, and development.
3. Create `.env.example`.
4. Ensure `.env`, `.env.local`, and uploaded files are not committed.
5. Create local upload folder for MVP image/screenshot files.

### Required Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ia_detector

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

AI_MODE=mock
AI_TIMEOUT_SECONDS=8
AI_MAX_RETRIES=2

FACT_CHECK_MODE=mock
FACT_CHECK_PROVIDER=mock
FACT_CHECK_TIMEOUT_SECONDS=8
FACT_CHECK_MAX_RETRIES=2
FACT_CHECK_MAX_RESULTS=5
FACT_CHECK_CACHE_TTL_MINUTES=60

UPLOAD_DIR=storage/uploads
MAX_IMAGE_SIZE_MB=5
```

### Acceptance Criteria

- The repository has a clear project structure.
- `.env.example` exists.
- Secrets are not committed.
- `storage/uploads/` exists with `.gitkeep`.
- Development scripts are defined in `package.json`.

---

## Phase 2 — Database Setup

### Objective

Prepare the PostgreSQL data model using Prisma.

### Required Files

```text
prisma/schema.prisma
database/dbml/ia-detector.dbml
database/seed/README.md
```

### Tasks

1. Validate that Prisma schema matches the DBML model.
2. Generate Prisma client.
3. Create initial Prisma migration.
4. Prepare database connection using `DATABASE_URL`.
5. Confirm that the following models exist:
   - `User`
   - `RefreshToken`
   - `UploadedFile`
   - `VerificationCase`
   - `EvidenceResult`
   - `RiskSignal`
   - `AuditLog`
   - `FactCheckCache`

### Required Commands

```bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name init_ia_detector_schema
```

### Acceptance Criteria

- Prisma schema formats without errors.
- Prisma client generates successfully.
- Initial migration is created.
- PostgreSQL database contains all MVP tables.
- Database model supports `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.

---

## Phase 3 — Backend Base Structure

### Objective

Create the backend folder structure and core NestJS modules.

### Required Files

```text
src/backend/api/controllers/AuthController.ts
src/backend/api/controllers/VerificationController.ts
src/backend/api/controllers/HistoryController.ts
src/backend/api/controllers/UploadController.ts

src/backend/api/guards/JwtAuthGuard.ts
src/backend/api/guards/RoleGuard.ts

src/backend/api/middlewares/TraceIdMiddleware.ts
src/backend/api/middlewares/ErrorHandlerMiddleware.ts

src/backend/shared/config/AppConfig.ts
src/backend/shared/errors/AppException.ts
src/backend/shared/errors/ValidationException.ts
src/backend/shared/errors/ExternalProviderException.ts
```

### Tasks

1. Create NestJS backend app structure.
2. Implement global config loading.
3. Implement `TraceIdMiddleware`.
4. Implement centralized error response format.
5. Create base controllers with placeholder methods.
6. Ensure controllers do not contain business logic.

### Acceptance Criteria

- Backend starts locally.
- All backend requests include or generate `traceId`.
- Errors return `ErrorResponseDTO`.
- Controllers delegate work to application services.
- No business logic exists inside controllers.

---

## Phase 4 — Authentication and Authorization

### Objective

Implement MVP authentication with email/password and JWT.

### Required Files

```text
src/backend/api/controllers/AuthController.ts
src/backend/api/guards/JwtAuthGuard.ts
src/backend/api/guards/RoleGuard.ts
src/backend/domain/users/User.ts
src/backend/domain/users/UserRole.ts
src/backend/infrastructure/persistence/repositories/UserRepository.ts
```

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email and password. |
| `POST` | `/api/auth/refresh` | Refresh access token. |
| `POST` | `/api/auth/logout` | Revoke refresh token. |
| `GET` | `/api/auth/me` | Return current user. |

### Tasks

1. Implement email/password login.
2. Store only password hashes.
3. Store only refresh token hashes.
4. Return access token.
5. Store refresh token in httpOnly cookie.
6. Implement role checks for `JOURNALIST` and `ADMIN`.

### Acceptance Criteria

- User can log in with seeded journalist account.
- User can call `/api/auth/me`.
- Refresh token is not exposed to frontend JavaScript.
- Protected endpoints reject unauthenticated requests.
- Role guard blocks unauthorized access.

---

## Phase 5 — Seed Data

### Objective

Create deterministic local demo data.

### Required Files

```text
database/seed/users.seed.ts
database/seed/verification-cases.seed.ts
database/seed/evidence-results.seed.ts
database/seed/risk-signals.seed.ts
database/seed/audit-logs.seed.ts
```

### Required Demo Users

| Email | Role |
|---|---|
| `journalist@iadetector.local` | `JOURNALIST` |
| `admin@iadetector.local` | `ADMIN` |

### Required Demo Cases

| Case | Input Type | Expected Status |
|---|---|---|
| Reliable evidence case | `TEXT` | `PASS` |
| Low evidence risky case | `URL` | `NO_PASS` |
| Screenshot partial evidence case | `IMAGE` | `HUMAN_REVIEW` |

### Tasks

1. Create seed script for users.
2. Create seed script for verification cases.
3. Create seed script for evidence results.
4. Create seed script for risk signals.
5. Create seed script for audit logs.
6. Ensure seeded history is visible to frontend.

### Acceptance Criteria

- Seed creates one journalist user.
- Seed creates one admin user.
- Seed creates one `PASS` case.
- Seed creates one `NO_PASS` case.
- Seed creates one `HUMAN_REVIEW` case.
- Each case has evidence or risk signals consistent with status.
- Each case has audit log entries.

---

## Phase 6 — Mock AI and OCR Layer

### Objective

Implement the AI Ambassador pattern using local mocks.

### Required Files

```text
src/backend/application/ai/AIAmbassador.ts
src/backend/application/ai/RetryManager.ts
src/backend/application/ai/AIResponseAdapter.ts

src/backend/infrastructure/ai/MockAIConnector.ts
src/backend/infrastructure/ai/MockOCRConnector.ts
```

### Required Methods

| Class | Method |
|---|---|
| `AIAmbassador` | `extractClaim(rawText)` |
| `AIAmbassador` | `analyzeRisk(rawText, evidence)` |
| `AIAmbassador` | `extractTextFromImage(fileId)` |
| `MockAIConnector` | `sendPrompt(prompt)` |
| `MockOCRConnector` | `extractText(fileId)` |

### Tasks

1. Implement deterministic mock claim extraction.
2. Implement deterministic mock risk analysis.
3. Implement deterministic mock OCR for image/screenshot flow.
4. Normalize mock responses through `AIResponseAdapter`.
5. Apply timeout and retry through `RetryManager`.

### Acceptance Criteria

- Text input produces a claim.
- URL mock content produces a claim.
- Image/screenshot mock OCR produces extracted text.
- AI failures do not crash the verification flow.
- Backend can run with `AI_MODE=mock`.

---

## Phase 7 — Fact Check Mock Integration

### Objective

Implement Google Fact Check integration interface with mock mode first.

### Required Files

```text
src/backend/application/evidence/FactCheckEvidenceService.ts

src/backend/infrastructure/integrations/factcheck/GoogleFactCheckClient.ts
src/backend/infrastructure/integrations/factcheck/GoogleFactCheckAdapter.ts

src/backend/infrastructure/integrations/factcheck/mocks/pass-result.mock.json
src/backend/infrastructure/integrations/factcheck/mocks/no-pass-result.mock.json
src/backend/infrastructure/integrations/factcheck/mocks/human-review-result.mock.json

src/backend/infrastructure/persistence/repositories/FactCheckCacheRepository.ts
```

### Tasks

1. Implement `FactCheckEvidenceService.searchEvidence(claim)`.
2. Implement cache lookup by normalized claim.
3. Implement deterministic mock responses.
4. Implement adapter from mock/provider response to `EvidenceResult`.
5. Store mapped evidence results.
6. Do not call real Google provider when `FACT_CHECK_MODE=mock`.

### Acceptance Criteria

- Mock mode returns evidence for `PASS`.
- Mock mode returns weak or empty evidence for `NO_PASS`.
- Mock mode returns partial evidence for `HUMAN_REVIEW`.
- Cache is checked before provider/mock call.
- Empty evidence does not produce automatic `PASS`.

---

## Phase 8 — Verification Workflow

### Objective

Implement the complete backend verification flow.

### Required Files

```text
src/backend/application/verification/CreateVerificationCaseService.ts
src/backend/application/verification/GetVerificationCaseService.ts
src/backend/application/verification/ListVerificationHistoryService.ts
src/backend/application/verification/AIDecisionGate.ts

src/backend/application/claims/ClaimExtractionService.ts
src/backend/application/risk/RiskAnalysisService.ts
src/backend/application/scoring/EvidenceScoreService.ts
src/backend/application/scoring/RiskScoreService.ts
src/backend/application/scoring/SourceAgreementService.ts

src/backend/infrastructure/persistence/repositories/VerificationRepository.ts
src/backend/infrastructure/persistence/repositories/EvidenceRepository.ts
src/backend/infrastructure/persistence/repositories/RiskSignalRepository.ts
src/backend/infrastructure/persistence/repositories/AuditLogRepository.ts
```

### Required Workflow

```text
CreateVerificationCaseService.execute(request)
  ├── validate input
  ├── create verification case
  ├── extract claim
  ├── search evidence
  ├── analyze risk
  ├── calculate evidenceScore
  ├── calculate riskScore
  ├── calculate sourceAgreement
  ├── call AIDecisionGate
  ├── persist final case status
  ├── persist evidence
  ├── persist risk signals
  ├── persist audit logs
  └── return VerificationResultDTO
```

### AIDecisionGate Rules

| Result | Condition |
|---|---|
| `PASS` | `evidenceScore >= 75`, `riskScore <= 35`, `sourceAgreement = HIGH`, and `evidenceCount >= 2`. |
| `HUMAN_REVIEW` | `evidenceScore` between 50 and 74, or `riskScore` between 36 and 60, or contradictory evidence exists. |
| `NO_PASS` | `evidenceScore < 50`, or `riskScore > 60`, or `sourceAgreement = LOW`, or `evidenceCount = 0`. |

### Acceptance Criteria

- Text verification returns `VerificationResultDTO`.
- URL verification returns `VerificationResultDTO`.
- Image verification returns `VerificationResultDTO`.
- `PASS` is never returned without evidence.
- `TRUE` and `FALSE` are never returned.
- Every completed case is saved in history.
- Every completed case has audit logs.

---

## Phase 9 — Upload Flow

### Objective

Allow image/screenshot upload for MVP.

### Required Files

```text
src/backend/api/controllers/UploadController.ts
src/backend/infrastructure/storage/LocalFileStorageService.ts
src/backend/shared/validation/imageInputSchema.ts
```

### Tasks

1. Validate file type.
2. Validate file size.
3. Store file locally under `storage/uploads`.
4. Store metadata in `uploaded_files`.
5. Return `UploadImageResponseDTO`.
6. Use returned `fileId` in image verification request.

### Allowed File Types

- `image/jpeg`
- `image/png`
- `image/webp`

### Maximum Size

```text
5 MB
```

### Acceptance Criteria

- Valid image uploads return `fileId`.
- Invalid file type is rejected.
- Files larger than 5 MB are rejected.
- Frontend never receives raw local file path.

---

## Phase 10 — Frontend Project Setup

### Objective

Create the frontend base following the frontend design document.

### Required Files

```text
src/frontend/
src/frontend/components/
src/frontend/features/
src/frontend/hooks/
src/frontend/services/
src/frontend/store/
src/frontend/types/
src/frontend/utils/
```

### Tasks

1. Create React + Vite + TypeScript app.
2. Configure Tailwind CSS.
3. Configure shadcn/ui.
4. Configure React Router.
5. Configure Zustand stores.
6. Configure TanStack Query.
7. Configure Axios API client.
8. Implement protected routes.

### Acceptance Criteria

- Frontend runs locally.
- User can reach login screen.
- User can reach dashboard after login.
- Frontend folder structure matches `docs/frontend/frontend-design.md`.

---

## Phase 11 — Frontend Verification Flow

### Objective

Implement the UI screens required by the MVP.

### Required Screens

```text
Dashboard / Verification Hub
Text Verification
URL Verification
Image / Screenshot Upload
Processing State
Results Page
Verification History
```

### Required Components

```text
ClassificationBadge
EvidenceList
RiskSignalList
ScoreMeter
VerificationWizard
ImageUploadDropzone
HistoryTable
```

### Tasks

1. Implement dashboard.
2. Implement text input flow.
3. Implement URL input flow.
4. Implement image upload flow.
5. Implement processing state.
6. Implement results page.
7. Implement history page.
8. Connect frontend to backend DTOs.

### Acceptance Criteria

- User can submit suspicious text.
- User can submit suspicious URL.
- User can upload image/screenshot.
- User can see `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
- User can see evidence, risk signals, and scores.
- User can view previous verification cases.
- UI never shows final labels as `TRUE` or `FALSE`.

---

## Phase 12 — History and Audit

### Objective

Implement history and audit visibility.

### Backend Requirements

```text
GET /api/verifications
GET /api/verifications/:caseId
GET /api/audit/:caseId
```

### Frontend Requirements

```text
HistoryTable
CaseDetailView
AuditLogView for allowed users
```

### Rules

- Journalist can only see own cases.
- Admin can see all cases if admin mode is implemented.
- Audit logs must not expose secrets.
- Audit logs must include traceability events.

### Acceptance Criteria

- Journalist can see own verification history.
- Journalist can open previous case.
- Audit events exist for each demo case.
- Unauthorized access is blocked.

---

## Phase 13 — Testing

### Objective

Validate MVP behavior before demo.

### Backend Tests

| Test | Required |
|---|---|
| `AIDecisionGate` returns `PASS` for high evidence and low risk. | Yes |
| `AIDecisionGate` returns `NO_PASS` for low evidence or high risk. | Yes |
| `AIDecisionGate` returns `HUMAN_REVIEW` for ambiguous case. | Yes |
| Text verification rejects empty input. | Yes |
| URL verification rejects invalid URL. | Yes |
| Image upload rejects invalid file type. | Yes |
| History endpoint blocks unauthorized access. | Yes |

### Frontend Tests

| Test | Required |
|---|---|
| Classification badge renders `PASS`. | Yes |
| Classification badge renders `NO_PASS`. | Yes |
| Classification badge renders `HUMAN_REVIEW`. | Yes |
| Results page shows evidence list. | Yes |
| Results page shows risk signals. | Yes |
| Text form validates empty input. | Yes |
| URL form validates invalid URL. | Yes |
| Image upload validates file type. | Yes |

### Acceptance Criteria

- Backend tests pass.
- Frontend tests pass.
- Main local demo flow works.
- MVP can be shown without real AI or Google credentials.

---

## Phase 14 — UX Testing Results Integration

### Objective

Apply changes from Figma/Maze UX testing before final MVP demo.

### Required Files

```text
docs/ux/ux-testing-results.md
docs/frontend/frontend-design.md
docs/product/mvp-scope.md
```

### Tasks

1. Review UX testing results.
2. Identify corrections that affect UI.
3. Update Figma prototype.
4. Update frontend implementation if needed.
5. Document corrections applied.

### Acceptance Criteria

- UX testing was completed with at least 4 external design students.
- Detected issues are documented.
- Corrections are documented.
- Final UI reflects important UX corrections.

---

## Phase 15 — Local Demo Preparation

### Objective

Prepare the final local demo flow.

### Required Demo Flow

1. Login as journalist.
2. Submit suspicious text and receive `PASS`.
3. Submit suspicious URL and receive `NO_PASS`.
4. Submit image/screenshot and receive `HUMAN_REVIEW`.
5. Open verification history.
6. Open previous case.
7. Show evidence and risk signals.
8. Explain that the system does not return `TRUE` or `FALSE`.

### Required Demo Accounts

| Email | Role |
|---|---|
| `journalist@iadetector.local` | `JOURNALIST` |
| `admin@iadetector.local` | `ADMIN` |

### Acceptance Criteria

- Demo can run locally.
- Demo does not depend on real AI credentials.
- Demo does not depend on real Google Fact Check credentials.
- Demo shows all three classifications.
- Demo aligns with README and design documents.

---

## Recommended Build Order

| Order | Phase | Dependency |
|---|---|---|
| 1 | Project Setup | None |
| 2 | Database Setup | Project Setup |
| 3 | Backend Base Structure | Project Setup |
| 4 | Authentication and Authorization | Backend Base + Database |
| 5 | Seed Data | Database |
| 6 | Mock AI and OCR Layer | Backend Base |
| 7 | Fact Check Mock Integration | Backend Base + Database |
| 8 | Verification Workflow | Auth + AI Mock + Fact Check Mock |
| 9 | Upload Flow | Backend Base + Database |
| 10 | Frontend Project Setup | Project Setup |
| 11 | Frontend Verification Flow | Backend DTOs |
| 12 | History and Audit | Backend Workflow + Database |
| 13 | Testing | Backend + Frontend |
| 14 | UX Testing Results Integration | Figma/Maze testing |
| 15 | Local Demo Preparation | Full MVP |

---

## Definition of Done for MVP

The MVP is considered complete when:

- Repository documentation is updated.
- Frontend runs locally.
- Backend runs locally.
- Database runs locally.
- Seed data is loaded.
- User can log in.
- User can verify text.
- User can verify URL.
- User can verify image/screenshot.
- System returns `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.
- System shows evidence, risk signals, and scores.
- System stores verification history.
- System stores audit logs.
- Tests for critical flows pass.
- UX testing results are documented.
- Demo flow can be executed without slides.
- No final result is shown as `TRUE` or `FALSE`.