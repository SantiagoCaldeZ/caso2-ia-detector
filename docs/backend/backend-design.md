# Backend Design Document — IA Detector

## Purpose

This document defines the backend design for **IA Detector**.

The backend must be designed for a development team, not as a generic academic description. Every section must define concrete responsibilities, source code locations, inputs, outputs, states, business rules, errors, and implementation restrictions.

The backend supports the MVP flow:

1. User submits suspicious text, URL, image, or screenshot.
2. Backend creates a verification case.
3. Backend extracts the main claim.
4. Backend searches evidence or previous fact-checking results.
5. Backend calculates `evidenceScore`, `riskScore`, and `sourceAgreement`.
6. Backend classifies the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
7. Backend stores the case, evidence, risk signals, and audit log.
8. Frontend receives a structured result.

---

## Problem Statement

**Reduce the time to confirm truthfully information.**

---

## Backend Technology Stack

| Area | Decision | Reason |
|---|---|---|
| Runtime | Node.js 22 LTS | Stable runtime for TypeScript backend development. |
| Language | TypeScript 5.x | Type safety and shared DTO contracts with frontend. |
| Backend framework | NestJS 10.x | Clear modular architecture, controllers, services, guards, dependency injection, testing support. |
| API style | REST API over HTTPS | Simple for MVP, easy to test, compatible with frontend. |
| API documentation | OpenAPI / Swagger | Allows frontend and backend teams to validate endpoint contracts. |
| Database | PostgreSQL | Relational model fits users, verification cases, evidence, risk signals, audit logs. |
| ORM | Prisma | Type-safe database access, migrations, seed support. |
| Authentication | JWT access token + httpOnly refresh token | Matches frontend design and supports role-based access. |
| File storage for MVP | Local storage under `/storage/uploads` | Allows local MVP execution without cloud dependency. |
| AI execution for MVP | Mock/local stub through `AIAmbassador` | Allows local demo without paid AI provider. |
| Fact-check evidence | Google Fact Check Tools API or mock mode | Uses real integration when API key exists; deterministic mocks otherwise. |
| Testing | Jest + Supertest | Unit and API testing for NestJS backend. |
| Observability | Structured logs with `traceId` and `verificationCaseId` | Allows debugging verification flow. |
| CI/CD | GitHub Actions | Repository is hosted in GitHub. |

---

## Backend Responsibilities

The backend is responsible for:

- authenticating users,
- authorizing access by role,
- receiving verification requests,
- validating text, URL, image, and screenshot inputs,
- storing uploaded files for MVP,
- creating verification cases,
- extracting claims using `AIAmbassador`,
- calling fact-check evidence integration through `FactCheckEvidenceService`,
- calculating `evidenceScore`, `riskScore`, and `sourceAgreement`,
- classifying cases through `AIDecisionGate`,
- storing evidence and risk signals,
- storing verification history,
- storing audit logs,
- returning structured DTOs to the frontend,
- supporting local execution with mocks.

---

## Backend Out of Scope

The backend MVP will not implement:

- real video analysis,
- real deepfake detection,
- advanced image forensic analysis,
- automatic publishing,
- full newsroom collaboration,
- real-time multi-user editing,
- browser extension backend,
- mobile push notifications,
- production cloud deployment.

---

## Backend Layered Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ API Layer                                                    │
│ Controllers, guards, middlewares                             │
│ Receives HTTP requests and returns DTOs                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Application Layer                                            │
│ Use cases, services, orchestration, business rules           │
│ Creates cases, extracts claims, searches evidence, classifies │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Domain Layer                                                 │
│ Entities, enums, DTOs, business states                       │
│ No external provider logic                                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Infrastructure Layer                                         │
│ Database repositories, integrations, file storage, logging    │
│ Prisma, Google Fact Check client, mocks, local storage        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Shared Layer                                                 │
│ Config, validation, shared errors, common utilities           │
└──────────────────────────────────────────────────────────────┘
```

---

## Source Code Structure

```text
src/backend/
├── api/
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── VerificationController.ts
│   │   ├── HistoryController.ts
│   │   └── UploadController.ts
│   │
│   ├── guards/
│   │   ├── JwtAuthGuard.ts
│   │   └── RoleGuard.ts
│   │
│   └── middlewares/
│       ├── TraceIdMiddleware.ts
│       └── ErrorHandlerMiddleware.ts
│
├── application/
│   ├── verification/
│   │   ├── CreateVerificationCaseService.ts
│   │   ├── GetVerificationCaseService.ts
│   │   ├── ListVerificationHistoryService.ts
│   │   └── AIDecisionGate.ts
│   │
│   ├── claims/
│   │   └── ClaimExtractionService.ts
│   │
│   ├── evidence/
│   │   └── FactCheckEvidenceService.ts
│   │
│   ├── risk/
│   │   └── RiskAnalysisService.ts
│   │
│   ├── scoring/
│   │   ├── EvidenceScoreService.ts
│   │   ├── RiskScoreService.ts
│   │   └── SourceAgreementService.ts
│   │
│   └── ai/
│       ├── AIAmbassador.ts
│       ├── RetryManager.ts
│       └── AIResponseAdapter.ts
│
├── domain/
│   ├── verification/
│   │   ├── VerificationCase.ts
│   │   ├── VerificationStatus.ts
│   │   ├── VerificationRequestDTO.ts
│   │   ├── VerificationResultDTO.ts
│   │   └── AgentDecisionResult.ts
│   │
│   ├── evidence/
│   │   ├── EvidenceResult.ts
│   │   └── SourceAgreement.ts
│   │
│   ├── risk/
│   │   └── RiskSignal.ts
│   │
│   ├── audit/
│   │   └── AuditEvent.ts
│   │
│   └── users/
│       ├── User.ts
│       └── UserRole.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── PrismaClient.ts
│   │   └── repositories/
│   │       ├── VerificationRepository.ts
│   │       ├── EvidenceRepository.ts
│   │       ├── RiskSignalRepository.ts
│   │       ├── AuditLogRepository.ts
│   │       ├── UserRepository.ts
│   │       └── FactCheckCacheRepository.ts
│   │
│   ├── integrations/
│   │   └── factcheck/
│   │       ├── GoogleFactCheckClient.ts
│   │       ├── GoogleFactCheckAdapter.ts
│   │       └── mocks/
│   │           ├── pass-result.mock.json
│   │           ├── no-pass-result.mock.json
│   │           └── human-review-result.mock.json
│   │
│   ├── ai/
│   │   ├── AITextConnector.ts
│   │   ├── MockAIConnector.ts
│   │   ├── OCRConnector.ts
│   │   └── MockOCRConnector.ts
│   │
│   ├── storage/
│   │   └── LocalFileStorageService.ts
│   │
│   └── observability/
│       ├── LoggerService.ts
│       └── IntegrationLogger.ts
│
└── shared/
    ├── config/
    │   └── AppConfig.ts
    │
    ├── errors/
    │   ├── AppException.ts
    │   ├── ValidationException.ts
    │   ├── UnauthorizedException.ts
    │   ├── ForbiddenException.ts
    │   ├── ExternalProviderException.ts
    │   └── VerificationProcessingException.ts
    │
    └── validation/
        ├── textInputSchema.ts
        ├── urlInputSchema.ts
        └── imageInputSchema.ts
```

---

## Main Backend Workflow

```text
Frontend
   │
   │ POST /api/verifications
   ▼
VerificationController
   │
   ▼
CreateVerificationCaseService
   │
   ├── validate input
   ├── create case
   ├── extract claim
   ├── search evidence
   ├── analyze risk
   ├── calculate scores
   ├── run AIDecisionGate
   ├── save result
   ├── save audit log
   ▼
VerificationResultDTO
   │
   ▼
Frontend Results Page
```

---

## Main Backend Components

| Component | Location | Responsibility |
|---|---|---|
| `VerificationController` | `/src/backend/api/controllers/VerificationController.ts` | Receives verification requests and returns verification result DTOs. |
| `CreateVerificationCaseService` | `/src/backend/application/verification/CreateVerificationCaseService.ts` | Orchestrates the complete verification workflow. |
| `ClaimExtractionService` | `/src/backend/application/claims/ClaimExtractionService.ts` | Extracts the main claim using `AIAmbassador`. |
| `FactCheckEvidenceService` | `/src/backend/application/evidence/FactCheckEvidenceService.ts` | Searches evidence through cache and Google Fact Check integration. |
| `RiskAnalysisService` | `/src/backend/application/risk/RiskAnalysisService.ts` | Produces risk signals from content and evidence. |
| `EvidenceScoreService` | `/src/backend/application/scoring/EvidenceScoreService.ts` | Calculates `evidenceScore`. |
| `RiskScoreService` | `/src/backend/application/scoring/RiskScoreService.ts` | Calculates `riskScore`. |
| `SourceAgreementService` | `/src/backend/application/scoring/SourceAgreementService.ts` | Calculates `sourceAgreement`. |
| `AIDecisionGate` | `/src/backend/application/verification/AIDecisionGate.ts` | Classifies the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`. |
| `VerificationRepository` | `/src/backend/infrastructure/persistence/repositories/VerificationRepository.ts` | Persists verification case state. |
| `AuditLogRepository` | `/src/backend/infrastructure/persistence/repositories/AuditLogRepository.ts` | Persists audit events. |
| `LoggerService` | `/src/backend/infrastructure/observability/LoggerService.ts` | Writes structured logs with traceability fields. |

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Controller | Auth required | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `AuthController.login()` | No | Authenticates user with email and password. |
| `POST` | `/api/auth/refresh` | `AuthController.refresh()` | Refresh token cookie | Generates new access token. |
| `POST` | `/api/auth/logout` | `AuthController.logout()` | Yes | Clears refresh token cookie. |
| `GET` | `/api/auth/me` | `AuthController.me()` | Yes | Returns current user profile and role. |

### Verification Endpoints

| Method | Endpoint | Controller | Auth required | Description |
|---|---|---|---|---|
| `POST` | `/api/verifications` | `VerificationController.create()` | Yes | Creates and processes a verification case. |
| `GET` | `/api/verifications/:caseId` | `VerificationController.getById()` | Yes | Returns one verification case. |
| `GET` | `/api/verifications` | `HistoryController.list()` | Yes | Returns verification history for current user. |
| `POST` | `/api/verifications/:caseId/rerun` | `VerificationController.rerun()` | Yes | Re-runs verification after claim edit. |

### Upload Endpoints

| Method | Endpoint | Controller | Auth required | Description |
|---|---|---|---|---|
| `POST` | `/api/uploads/image` | `UploadController.uploadImage()` | Yes | Uploads image or screenshot for OCR mock/local stub. |

### Audit Endpoints

| Method | Endpoint | Controller | Auth required | Role | Description |
|---|---|---|---|---|---|
| `GET` | `/api/audit/:caseId` | `HistoryController.audit()` | Yes | `journalist`, `admin` | Returns audit events for a case owned by the user or all cases if admin. |

---

## API Request and Response Contracts

### Create Verification Request

```ts
type CreateVerificationRequestDTO = {
  inputType: "TEXT" | "URL" | "IMAGE";
  content?: string;
  fileId?: string;
};
```

### Validation Rules

| Field | Rule |
|---|---|
| `inputType` | Required. Must be `TEXT`, `URL`, or `IMAGE`. |
| `content` | Required for `TEXT` and `URL`. |
| `fileId` | Required for `IMAGE`. |
| `TEXT content` | Minimum 10 characters, maximum 5000 characters. |
| `URL content` | Must be valid URL format. |
| `IMAGE fileId` | Must reference an uploaded `.jpg`, `.png`, or `.webp` file. |

### Verification Result DTO

```ts
type VerificationResultDTO = {
  caseId: string;
  status: "PASS" | "NO_PASS" | "HUMAN_REVIEW";
  inputType: "TEXT" | "URL" | "IMAGE";
  claim: string;
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: "HIGH" | "MEDIUM" | "LOW";
  evidence: EvidenceDTO[];
  riskSignals: RiskSignalDTO[];
  createdAt: string;
};
```

### Evidence DTO

```ts
type EvidenceDTO = {
  evidenceId: string;
  title: string;
  url: string;
  sourceName: string;
  rating?: string;
  relevanceScore: number;
  publishedAt?: string;
};
```

### Risk Signal DTO

```ts
type RiskSignalDTO = {
  type:
    | "NO_SOURCE"
    | "EMOTIONAL_LANGUAGE"
    | "CONTRADICTORY_EVIDENCE"
    | "LOW_SOURCE_AGREEMENT"
    | "OCR_UNCERTAINTY"
    | "PROVIDER_UNAVAILABLE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
};
```

### Upload Image Response DTO

```ts
type UploadImageResponseDTO = {
  fileId: string;
  originalFileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
};
```

### Error Response DTO

```ts
type ErrorResponseDTO = {
  traceId: string;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
};
```

---

## Verification Case States

| State | Meaning |
|---|---|
| `CREATED` | Case was created but processing has not started. |
| `PROCESSING` | Backend is extracting claim, searching evidence, and calculating scores. |
| `PASS` | Case can move forward to editorial review based on available evidence. |
| `NO_PASS` | Case should not move forward with the available evidence. |
| `HUMAN_REVIEW` | Case is ambiguous and requires human review. |
| `FAILED` | Processing failed due to validation, provider, or internal error. |

---

## Business Rules

### General Rules

- Backend must never return `TRUE` or `FALSE` as final classification.
- Backend must classify every completed case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
- Google Fact Check Tools API must never be treated as the final decision source.
- Empty evidence does not mean the information is true.
- If a provider fails, the backend must continue with partial evidence when possible.
- Every verification case must create at least one audit log entry.
- Every provider call must include `traceId` and `verificationCaseId`.
- Every result must include `evidenceScore`, `riskScore`, and `sourceAgreement`.

### Input Rules

| Input type | Rule |
|---|---|
| `TEXT` | Use content directly for claim extraction. |
| `URL` | Extract readable text or use mock content extraction in MVP. |
| `IMAGE` | Extract text using OCR mock/local stub in MVP. |

### Evidence Rules

- Evidence results must include source name, URL, rating when available, and relevance score.
- Evidence results must be stored before returning the final DTO.
- Evidence source URLs must be sanitized before storing or returning.
- Duplicate evidence URLs must be removed.

### Risk Signal Rules

- Risk signals must be stored as structured records.
- At least one risk signal must be generated when:
  - no evidence is found,
  - sources contradict each other,
  - provider is unavailable,
  - OCR mock extraction is uncertain,
  - risk score is greater than 60.

---

## AIDecisionGate Rules

`AIDecisionGate` is the only component allowed to classify a case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.

### Input

```ts
type AIDecisionGateInput = {
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: "HIGH" | "MEDIUM" | "LOW";
  evidenceCount: number;
  hasContradictoryEvidence: boolean;
};
```

### Output

```ts
type AgentDecisionResult = {
  status: "PASS" | "NO_PASS" | "HUMAN_REVIEW";
  reason: string;
};
```

### Decision Table

| Result | Condition |
|---|---|
| `PASS` | `evidenceScore >= 75`, `riskScore <= 35`, `sourceAgreement = HIGH`, and `evidenceCount >= 2`. |
| `HUMAN_REVIEW` | `evidenceScore` between 50 and 74, or `riskScore` between 36 and 60, or `hasContradictoryEvidence = true`. |
| `NO_PASS` | `evidenceScore < 50`, or `riskScore > 60`, or `sourceAgreement = LOW`, or `evidenceCount = 0`. |

### Developer Restrictions

- Do not classify cases inside controllers.
- Do not classify cases inside repositories.
- Do not duplicate decision rules outside `AIDecisionGate`.
- Do not return `PASS` when `evidenceCount = 0`.
- Do not return `PASS` when `sourceAgreement = LOW`.
- Every decision must include a reason string.

---

## Integration with AIAmbassador

The backend uses `AIAmbassador` for all AI-related operations.

### Required Calls

| Backend need | AIAmbassador method |
|---|---|
| Extract claim from text or URL content | `extractClaim(rawText)` |
| Analyze risk signals | `analyzeRisk(rawText, evidence)` |
| Extract text from image/screenshot | `extractTextFromImage(fileId)` |

### Rules

- Backend services must not call AI providers directly.
- All AI calls must go through `AIAmbassador`.
- MVP must run with `AI_MODE=mock`.
- If AI fails, the case must go to `HUMAN_REVIEW` or continue with partial evidence.
- AI responses must be normalized before reaching application services.

---

## Integration with Google Fact Check Tools API

The backend uses `FactCheckEvidenceService` to access fact-check evidence.

### Required Classes

| Class | Location |
|---|---|
| `FactCheckEvidenceService` | `/src/backend/application/evidence/FactCheckEvidenceService.ts` |
| `GoogleFactCheckClient` | `/src/backend/infrastructure/integrations/factcheck/GoogleFactCheckClient.ts` |
| `GoogleFactCheckAdapter` | `/src/backend/infrastructure/integrations/factcheck/GoogleFactCheckAdapter.ts` |
| `FactCheckCacheRepository` | `/src/backend/infrastructure/persistence/repositories/FactCheckCacheRepository.ts` |

### Rules

- Frontend must not call Google Fact Check Tools API directly.
- Controllers must not call Google Fact Check Tools API directly.
- `FactCheckEvidenceService` must check cache before provider calls.
- `GoogleFactCheckAdapter` must normalize provider responses.
- Mock mode must support `PASS`, `NO_PASS`, and `HUMAN_REVIEW` scenarios.

---

## Authentication and Authorization

### Authentication

- Login uses email and password.
- Backend returns:
  - access token with 15-minute lifetime,
  - refresh token stored in httpOnly cookie with 7-day lifetime.
- Access token is sent in `Authorization: Bearer <token>`.
- Refresh token is never exposed to frontend JavaScript.

### Roles

| Role | Permissions |
|---|---|
| `journalist` | Create verification cases, upload images, view own history, view own audit events. |
| `admin` | All journalist permissions plus view all histories and audit events. |

### Authorization Rules

- All verification endpoints require authentication.
- `GET /api/verifications` returns only current user cases for `journalist`.
- `admin` may view all cases if endpoint supports admin mode.
- Audit log access must be restricted by case ownership or admin role.

---

## Error Handling

| Error Code | Situation | HTTP Status | System Behavior |
|---|---|---|---|
| `INVALID_INPUT` | Input is missing or invalid. | `400` | Return validation details. |
| `UNAUTHORIZED` | User is not authenticated. | `401` | Reject request. |
| `FORBIDDEN` | User lacks required role. | `403` | Reject request and log event. |
| `CASE_NOT_FOUND` | Case does not exist or user cannot access it. | `404` | Return controlled error. |
| `AI_PROVIDER_FAILED` | AI ambassador fails. | `200` or `500` depending on flow | Prefer `HUMAN_REVIEW` with partial evidence when possible. |
| `FACT_CHECK_PROVIDER_FAILED` | Fact-check provider fails. | `200` if partial, `502` if blocking | Continue with partial evidence when possible. |
| `UPLOAD_INVALID_TYPE` | File type is not allowed. | `400` | Reject file. |
| `UPLOAD_TOO_LARGE` | File exceeds maximum size. | `400` | Reject file. |
| `INTERNAL_ERROR` | Unexpected backend error. | `500` | Log with `traceId` and return generic message. |

---

## Observability

Every request must include or generate a `traceId`.

Every verification flow must include:

- `traceId`,
- `verificationCaseId`,
- `userId`,
- status,
- duration,
- provider mode,
- error code when applicable.

### Events to Log

| Event | When |
|---|---|
| `verification_case_created` | Case is created. |
| `claim_extraction_started` | Claim extraction begins. |
| `claim_extraction_completed` | Claim extraction succeeds. |
| `factcheck_search_started` | Fact-check evidence search begins. |
| `factcheck_search_completed` | Fact-check evidence search succeeds. |
| `risk_analysis_completed` | Risk signals are generated. |
| `ai_decision_completed` | `AIDecisionGate` returns status. |
| `verification_failed` | Verification fails. |
| `image_uploaded` | Image or screenshot is uploaded. |
| `history_opened` | User requests history. |
| `audit_log_created` | Audit event is stored. |

---

## Testing Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Jest | `AIDecisionGate`, scoring services, validators, adapters. |
| API tests | Supertest | Auth, verification, upload, history endpoints. |
| Integration tests | Jest + test database | Repositories and Prisma workflows. |
| Mock integration tests | Jest | Google Fact Check mock mode and AI mock mode. |

### Minimum Test Cases

- `AIDecisionGate` returns `PASS` for high evidence and low risk.
- `AIDecisionGate` returns `NO_PASS` when no evidence exists.
- `AIDecisionGate` returns `HUMAN_REVIEW` for contradictory evidence.
- Verification endpoint rejects empty text.
- Verification endpoint rejects invalid URL.
- Upload endpoint rejects unsupported file type.
- Fact-check mock mode returns deterministic evidence.
- History endpoint returns only current user cases for `journalist`.

---

## Local MVP Execution Requirements

The backend must support local execution with mock integrations.

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

### Local Demo Requirement

The backend must support deterministic demo cases:

| Demo case | Expected classification |
|---|---|
| Suspicious text with reliable supporting evidence | `PASS` |
| URL with low evidence and high risk | `NO_PASS` |
| Image/screenshot with partial extracted text | `HUMAN_REVIEW` |

---

## Developer Restrictions

- Do not implement business logic in controllers.
- Do not call external providers from controllers.
- Do not call AI providers directly from application services.
- Do not duplicate classification rules outside `AIDecisionGate`.
- Do not expose refresh tokens to frontend JavaScript.
- Do not store API keys in source code.
- Do not store uploaded files outside configured `UPLOAD_DIR`.
- Do not return `TRUE` or `FALSE` as final result.
- Do not mark a case as `PASS` without evidence.
- Do not ignore provider failures; convert them to controlled partial result or error state.

---

## Acceptance Criteria

The backend design is implemented correctly when:

- user can authenticate with email and password,
- user can submit text, URL, image, or screenshot,
- backend creates a verification case,
- backend extracts a claim using mock AI,
- backend searches evidence using mock or real fact-check integration,
- backend calculates `evidenceScore`, `riskScore`, and `sourceAgreement`,
- backend classifies every completed case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`,
- backend stores the case in history,
- backend stores evidence and risk signals,
- backend stores audit log events,
- frontend receives DTOs matching this document,
- MVP can run locally without real AI or Google credentials,
- no backend endpoint returns final labels as `TRUE` or `FALSE`.