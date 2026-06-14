# IA Detector — Software Design and Implementation Contract

IA Detector is a web application for journalists and editorial teams who need to review suspicious digital content before publication.

The system does **not** decide whether a claim is absolutely true or false. It produces a **Verification Analysis Report**: a structured report that contains the extracted claim, reviewed evidence, risk signals, evidence score, risk score, source agreement, and a recommended editorial action for human review.

This `README.md` is the single source of truth for the MVP design and implementation contract. It defines what must be built, which endpoints exist, which frontend pages consume them, how the backend produces the analysis report, which data is stored, how integrations behave, which design patterns are applied, how the system is secured and observed, and how the MVP is accepted.

---

## Table of Contents

1. [Product Goal and MVP Boundary](#1-product-goal-and-mvp-boundary)
2. [Functional Use Cases](#2-functional-use-cases)
3. [Verification Analysis Pipeline](#3-verification-analysis-pipeline)
4. [Frontend Page Contracts](#4-frontend-page-contracts)
5. [Backend Module Contracts](#5-backend-module-contracts)
6. [HTTP API Contracts](#6-http-api-contracts)
7. [Data Model Contract](#7-data-model-contract)
8. [External Integration Contracts](#8-external-integration-contracts)
9. [Applied Design Patterns](#9-applied-design-patterns)
10. [Security Contract](#10-security-contract)
11. [Observability Contract](#11-observability-contract)
12. [C4 Architecture](#12-c4-architecture)
13. [UX Prototype and Testing Evidence](#13-ux-prototype-and-testing-evidence)
14. [Deployment Contract](#14-deployment-contract)
15. [QA and Acceptance Criteria](#15-qa-and-acceptance-criteria)
16. [Repository Structure and Validation](#16-repository-structure-and-validation)

---

## 1. Product Goal and MVP Boundary

### 1.1 Problem Statement

Original problem statement:

> Reduce the time to confirm truthfully information.

Refined implementation statement:

> Reduce the time required to verify the truthfulness of information.

The refined statement is used by this document to express the product goal in clear implementation language while preserving the original problem statement.

### 1.2 Product Goal

Journalists often receive urgent information through social media, websites, screenshots, images, messages, or forwarded claims. Before publishing, they need to review whether the information has supporting evidence, whether reviewed sources agree, and whether there are warning signs that require caution.

IA Detector reduces verification time by turning that review into a repeatable workflow:

1. Receive suspicious content.
2. Extract one main claim.
3. Search or simulate related evidence.
4. Identify risk signals.
5. Calculate evidence and risk indicators.
6. Calculate source agreement.
7. Generate a recommended editorial action.
8. Store the verification case and its audit trail.
9. Show the report to the journalist for human review.

The system supports editorial judgment. It does not replace journalists, editors, or fact-checking professionals.

### 1.3 Users and Roles

| Role | Description | MVP Permissions |
|---|---|---|
| `JOURNALIST` | Main user who verifies suspicious content before publication. | Register, log in, upload images, create verification cases, view own history, view own case details, view own audit trail. |
| `ADMIN` | Supervisory role for reviewing cases and audit trails. | Can review all cases and audit trails. Admin UI can be implemented after the journalist MVP flow. |

### 1.4 MVP In Scope

| Feature | Implementation Requirement |
|---|---|
| Authentication | Users can register, log in, refresh session, log out, and access protected routes. |
| Text verification | User submits text through the dashboard. Backend processes it with `TextInputHandler`. |
| URL verification | User submits URL through the dashboard. Backend processes it with `UrlInputHandler`. |
| Image / screenshot verification | User uploads an image first, then submits `uploadedFileId`. Backend processes it with `ImageInputHandler`. |
| Claim extraction | Backend extracts one main claim using `ClaimExtractionService`. |
| Evidence search | Backend searches cache first, then mock or live fact-check provider through `FactCheckEvidenceService`. |
| Evidence normalization | Backend converts provider/mock results into internal `EvidenceCandidate` objects before persistence and `EvidenceDTO` objects for API response. |
| Risk analysis | Backend creates risk signals through `RiskAnalysisService`. |
| Scoring | Backend calculates `evidenceScore`, `riskScore`, and `sourceAgreement` through deterministic scoring services. |
| Editorial recommendation | Backend calculates `recommendedAction` and `recommendationReason`. |
| Verification history | User can list own previous verification cases. |
| Case detail | User can open a complete saved report. |
| Audit trail | Backend stores traceable events for each important workflow step. |
| Deterministic demo mode | MVP runs without real AI/OCR or fact-checking credentials when mock modes are enabled. |

### 1.5 MVP Out of Scope

| Excluded Item | Reason |
|---|---|
| Real video analysis | Requires media processing outside MVP scope. |
| Real deepfake detection | Requires specialized models and validation outside MVP scope. |
| Automatic publishing | The system supports verification, not publication. |
| TRUE/FALSE verdict | The system generates an analysis report, not an absolute truth label. |
| Full newsroom collaboration | Comments, assignments, approvals, and multi-user workflows are future scope. |
| Browser extension | MVP is a web application. |
| Mobile app | MVP targets desktop web usage. |
| Real-time collaborative editing | Not required for the first implementation. |
| Rerun analysis | Not part of the MVP. The first version creates and stores one report per verification request. |

### 1.6 MVP Definition of Done

| Requirement | Acceptance Condition |
|---|---|
| Authentication works | A user can register, log in, refresh session, log out, and access protected routes. |
| Text verification works | Authenticated user submits valid text and receives a complete `VerificationAnalysisReportDTO`. |
| URL verification works | Authenticated user submits a valid URL and receives a complete or partial `VerificationAnalysisReportDTO`. |
| Image verification works | Authenticated user uploads an image, submits its `uploadedFileId`, and receives a complete or partial `VerificationAnalysisReportDTO`. |
| Report generation works | Backend returns `extractedClaim`, `evidence`, `riskSignals`, `evidenceScore`, `riskScore`, `sourceAgreement`, `recommendedAction`, `recommendationReason`, and `auditTrail`. |
| History works | User can list previous verification cases. |
| Case detail works | User can open a saved verification case and see the complete report. |
| Authorization works | User cannot access files, cases, or audit logs that belong to another user. |
| Audit trail works | Each verification case stores traceable workflow events. |
| Mock mode works | The system can run without real external AI/OCR or fact-checking credentials. |
| UX evidence is controlled | Prototype and UX testing evidence are linked or stored only when real and final. |

---

## 2. Functional Use Cases

### 2.1 Use Case Summary

| ID | Use Case | Actor | Main Endpoint(s) | Main Data |
|---|---|---|---|---|
| UC-01 | Register user | Journalist | `POST /api/auth/register` | `users`, `audit_logs` |
| UC-02 | Login user | Journalist | `POST /api/auth/login` | `users`, `refresh_tokens`, `audit_logs` |
| UC-03 | Refresh session | Journalist | `POST /api/auth/refresh` | `refresh_tokens`, `users`, `audit_logs` |
| UC-04 | Logout user | Journalist | `POST /api/auth/logout` | `refresh_tokens`, `audit_logs` |
| UC-05 | Upload image or screenshot | Journalist | `POST /api/uploads/image` | `uploaded_files`, `audit_logs` |
| UC-06 | Submit text verification | Journalist | `POST /api/verifications` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` |
| UC-07 | Submit URL verification | Journalist | `POST /api/verifications` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` |
| UC-08 | Submit image verification | Journalist | `POST /api/verifications` | `uploaded_files`, `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` |
| UC-09 | View verification history | Journalist | `GET /api/verifications` | `verification_cases` |
| UC-10 | View verification case detail | Journalist | `GET /api/verifications/:caseId` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs` |
| UC-11 | View audit trail | Journalist / Admin | `GET /api/audit/:caseId` | `verification_cases`, `audit_logs` |
| UC-12 | Check backend health | System / DevOps | `GET /api/health` | None |

### 2.2 MVP Traceability Matrix

This matrix connects each MVP use case to the frontend page, endpoint, backend service, data area, and acceptance criteria that validate it. It prevents requirements from remaining isolated or purely descriptive.

| Use Case | Frontend Page | Endpoint | Backend Service | Main Data | Acceptance Criteria |
|---|---|---|---|---|---|
| UC-01 Register user | `/register` | `POST /api/auth/register` | `RegisterService` | `users`, `audit_logs` | AC-01 |
| UC-02 Login user | `/login` | `POST /api/auth/login` | `LoginService` | `users`, `refresh_tokens`, `audit_logs` | AC-02 |
| UC-03 Refresh session | App boot / auth provider | `POST /api/auth/refresh` | `RefreshTokenService` | `refresh_tokens`, `users`, `audit_logs` | AC-03 |
| UC-04 Logout user | Authenticated layout | `POST /api/auth/logout` | `LogoutService` | `refresh_tokens`, `audit_logs` | AC-04 |
| UC-05 Upload image or screenshot | `/app` | `POST /api/uploads/image` | `UploadImageService` | `uploaded_files`, `audit_logs` | AC-05 |
| UC-06 Submit text verification | `/app` | `POST /api/verifications` | `CreateVerificationCaseService` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` | AC-06 |
| UC-07 Submit URL verification | `/app` | `POST /api/verifications` | `CreateVerificationCaseService` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` | AC-07 |
| UC-08 Submit image verification | `/app` | `POST /api/verifications` | `CreateVerificationCaseService` | `uploaded_files`, `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` | AC-08 |
| UC-09 View verification history | `/app/history` | `GET /api/verifications` | `ListVerificationHistoryService` | `verification_cases` | AC-12 |
| UC-10 View verification case detail | `/app/verification/:caseId`, `/app/history/:caseId` | `GET /api/verifications/:caseId` | `GetVerificationCaseService` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs` | AC-13 |
| UC-11 View audit trail | Result/detail audit panel | `GET /api/audit/:caseId` | `GetAuditTrailService` | `verification_cases`, `audit_logs` | AC-14 |
| UC-12 Check backend health | Deployment/monitoring | `GET /api/health` | `HealthService` | None | AC-15 |

Cross-cutting acceptance criteria such as unauthorized access, provider failure, no evidence, rate limiting, score calculation, observability, and security validation apply across multiple use cases. They are validated in the QA section even when they are not mapped to a single user-facing use case.

Implementation rule:

```text
A use case is not considered fully specified unless it appears in this matrix and has a matching frontend page, endpoint, backend service, data area, and acceptance criterion.
```

### 2.3 UC-01 — Register User

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is not authenticated. Email is not already registered. |
| Trigger | User submits registration form. |
| Main Flow | 1. Frontend validates name, email, and password. 2. Frontend calls `POST /api/auth/register`. 3. Backend validates payload. 4. Backend hashes password. 5. Backend creates user with role `JOURNALIST`. 6. Backend writes audit event `USER_REGISTERED`. 7. Backend returns user summary. |
| Error Flows | Duplicate email returns `409`. Invalid payload returns `400`. Unexpected error returns `500` with `traceId`. |
| Output | User account is created. |

### 2.4 UC-02 — Login User

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User account exists. |
| Trigger | User submits login form. |
| Main Flow | 1. Frontend validates email and password. 2. Frontend calls `POST /api/auth/login`. 3. Backend validates credentials. 4. Backend creates hashed refresh token. 5. Backend writes audit event `USER_LOGGED_IN`. 6. Backend returns access token and user summary. 7. Refresh token is stored as an httpOnly cookie. |
| Error Flows | Invalid credentials return `401`. Inactive user returns `403`. |
| Output | Authenticated session is created. |

### 2.5 UC-03 — Refresh Session

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User has a valid refresh token cookie. |
| Trigger | Frontend reloads the app or access token expires. |
| Main Flow | 1. Frontend calls `POST /api/auth/refresh`. 2. Backend validates refresh token cookie. 3. Backend revokes the previous refresh token hash. 4. Backend stores a new refresh token hash. 5. Backend returns a new access token. 6. Backend writes audit event `SESSION_REFRESHED`. |
| Error Flows | Missing refresh token returns `401`. Invalid or revoked token returns `401`. Expired token returns `401`. |
| Output | New access token is issued. |

### 2.6 UC-04 — Logout User

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. |
| Trigger | User clicks logout. |
| Main Flow | 1. Frontend calls `POST /api/auth/logout`. 2. Backend revokes current refresh token. 3. Backend clears refresh token cookie. 4. Backend writes audit event `USER_LOGGED_OUT`. 5. Frontend clears in-memory access token and redirects to `/login`. |
| Error Flows | Missing or invalid session returns `401`. |
| Output | Session is ended. |

### 2.7 UC-05 — Upload Image or Screenshot

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. |
| Trigger | User selects image file. |
| Main Flow | 1. Frontend validates MIME type and size. 2. Frontend calls `POST /api/uploads/image`. 3. Backend validates MIME type and size. 4. Backend stores file through storage service. 5. Backend creates `uploaded_files` record. 6. Backend writes audit event `FILE_UPLOADED`. 7. Backend returns `UploadedFileDTO`. |
| Error Flows | Unsupported file type returns `400` with error code `UNSUPPORTED_FILE_TYPE`. File larger than 5 MB returns `413` with error code `FILE_TOO_LARGE`. Storage failure returns `500` with error code `INTERNAL_ERROR` and `traceId`. |
| Output | `uploadedFileId` is available for image verification. |

### 2.8 UC-06 — Submit Text Verification

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. Text has at least 20 characters. |
| Trigger | User submits text from verification dashboard. |
| Main Flow | 1. Frontend calls `POST /api/verifications` with `inputType=TEXT`. 2. Backend validates request. 3. Backend creates verification case with `status=PROCESSING`. 4. `TextInputHandler` prepares text. 5. Common verification pipeline runs. 6. Backend persists report. 7. Backend marks case `COMPLETED`. 8. Backend returns `VerificationAnalysisReportDTO`. 9. Frontend navigates to `/app/verification/:caseId`. |
| Error Flows | Text shorter than 20 characters returns `400`. Claim extraction failure stores case as `FAILED` and returns `422`. Unexpected failure stores case as `FAILED` when possible and returns `500`. |
| Output | Complete analysis report or typed error. |

### 2.9 UC-07 — Submit URL Verification

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. URL is syntactically valid. |
| Trigger | User submits URL from verification dashboard. |
| Main Flow | 1. Frontend calls `POST /api/verifications` with `inputType=URL`. 2. Backend validates URL. 3. Backend creates verification case with `status=PROCESSING`. 4. `UrlInputHandler` extracts or simulates page text for MVP. 5. Common verification pipeline runs. 6. Backend persists report. 7. Backend marks case `COMPLETED`. 8. Backend returns `VerificationAnalysisReportDTO`. |
| Error Flows | Invalid URL returns `400`. URL extraction failure sets source content status as unavailable. `RiskAnalysisService` later creates `SOURCE_CONTENT_UNAVAILABLE` when usable content still exists; otherwise the case is stored as `FAILED` and the endpoint returns `422`. |
| Output | Complete or partial analysis report. |

### 2.10 UC-08 — Submit Image Verification

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. Image was previously uploaded. `uploadedFileId` belongs to current user. |
| Trigger | User submits image verification. |
| Main Flow | 1. Frontend uploads image using `POST /api/uploads/image`. 2. Frontend calls `POST /api/verifications` with `inputType=IMAGE` and `uploadedFileId`. 3. Backend validates file existence and ownership. 4. Backend creates verification case with `status=PROCESSING`. 5. `ImageInputHandler` obtains OCR text through mock/local behavior. 6. Common verification pipeline runs. 7. Backend persists report. 8. Backend marks case `COMPLETED`. 9. Backend returns `VerificationAnalysisReportDTO`. |
| Error Flows | File not found returns `404`. File belongs to another user returns `403`. OCR uncertainty sets OCR status as uncertain. `RiskAnalysisService` later creates `OCR_UNCERTAINTY` when usable OCR text exists. OCR with no usable text stores case as `FAILED` and returns `422`. |
| Output | Complete or partial analysis report. |

### 2.11 UC-09 — View Verification History

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. |
| Trigger | User opens history page. |
| Main Flow | 1. Frontend calls `GET /api/verifications`. 2. Backend loads paginated cases for current user. 3. Backend returns `VerificationHistoryItemDTO[]`. 4. Frontend displays history table. |
| Error Flows | Unauthenticated user receives `401`. No cases returns empty list. |
| Output | Paginated history list. |

### 2.12 UC-10 — View Verification Case Detail

| Item | Contract |
|---|---|
| Actor | Journalist |
| Preconditions | User is authenticated. Case belongs to user or user has role `ADMIN`. |
| Trigger | User opens result or history detail page. |
| Main Flow | 1. Frontend calls `GET /api/verifications/:caseId`. 2. Backend validates access. 3. Backend loads case, evidence, risk signals, and audit trail. 4. Backend returns `VerificationAnalysisReportDTO`. 5. Frontend renders report sections. |
| Error Flows | Case not found returns `404`. Case belongs to another user returns `403`. |
| Output | Existing report is displayed. |

### 2.13 UC-11 — View Audit Trail

| Item | Contract |
|---|---|
| Actor | Journalist / Admin |
| Preconditions | User is authenticated. Case belongs to user or user has role `ADMIN`. |
| Trigger | User opens audit trail panel. |
| Main Flow | 1. Frontend calls `GET /api/audit/:caseId`. 2. Backend validates access. 3. Backend returns audit events ordered by `createdAt`. |
| Error Flows | Case not found returns `404`. Unauthorized access returns `403`. |
| Output | Audit trail is displayed. This read operation does not create a new audit event in the MVP. |

### 2.14 UC-12 — Check Backend Health

| Item | Contract |
|---|---|
| Actor | System / DevOps |
| Preconditions | Backend service is running. |
| Trigger | Deployment check, monitoring check, or manual health check. |
| Main Flow | 1. Client calls `GET /api/health`. 2. Backend verifies application availability. 3. Backend returns `status=ok` and timestamp. |
| Error Flows | If backend is unavailable, infrastructure returns failure. If health service fails, endpoint returns `500`. |
| Output | Health status response. |

---

## 3. Verification Analysis Pipeline

### 3.1 Purpose

The pipeline defines how `POST /api/verifications` produces a `VerificationAnalysisReportDTO`.

The backend must not return a generic classification. It must produce a report with evidence, risk, scores, agreement, recommendation, reason, and audit trail.

### 3.2 Pipeline Overview

```text
Request validation
        ↓
Case creation
        ↓
Input preprocessing
        ↓
Claim extraction
        ↓
Claim normalization
        ↓
Evidence cache lookup
        ↓
Evidence provider/mock search
        ↓
Evidence normalization
        ↓
Risk analysis
        ↓
Scoring
        ↓
Editorial recommendation
        ↓
Persistence
        ↓
Response DTO
```

### 3.3 Pipeline Contract

| Step | Owner | Input | Output | Reads | Writes | Failure Behavior |
|---|---|---|---|---|---|---|
| 1. Validate request | `VerificationController` + validation schema | `CreateVerificationRequestDTO` | Validated request | None | None | Invalid input returns `400`. |
| 2. Create case | `CreateVerificationCaseService` | Validated request, `currentUserId`, `traceId` | Case with `status=PROCESSING` | `users` | `verification_cases`, `audit_logs` | Unexpected failure returns `500`; no report is created. |
| 3. Preprocess input | `InputHandlerStrategyFactory` + selected handler | Request payload | `PreprocessedInput` | `uploaded_files` only for `IMAGE` | `audit_logs` | Invalid ownership returns `403`; missing file returns `404`; unusable input returns `422`. |
| 4. Extract claim | `ClaimExtractionService` | `PreprocessedInput.contentForClaimExtraction` | `ExtractedClaimResult` | None | `audit_logs` | If claim cannot be extracted, case becomes `FAILED` and endpoint returns `422`. |
| 5. Normalize claim | `ClaimNormalizationService` | Extracted claim | `normalizedClaim` | None | None | Empty normalized claim marks case `FAILED` and returns `422`. |
| 6. Search cache | `FactCheckEvidenceService` | `normalizedClaim` | Cached evidence or cache miss | `fact_check_cache` | None | Cache failure is ignored and provider/mock search continues. |
| 7. Search raw evidence | `FactCheckEvidenceService` | `normalizedClaim` | `RawEvidenceSearchResult` with raw provider/mock/cache response, `ProviderStatus`, and `CacheStatus` | External provider, mock, or cache | `fact_check_cache` optional, `audit_logs` | Provider failure returns `providerStatus=UNAVAILABLE`, writes `EVIDENCE_SEARCH_FAILED`, and continues with empty raw evidence unless stale cache is available. |
| 8. Normalize evidence | `GoogleFactCheckAdapter` or mock adapter | `RawEvidenceSearchResult` | `EvidenceSearchResult` with `EvidenceCandidate[]`, `ProviderStatus`, and `CacheStatus` | None | None | Invalid provider item is skipped and logged. |
| 9. Store evidence | `EvidenceRepository` | `EvidenceCandidate[]` from `EvidenceSearchResult.evidence` | Stored `EvidenceDTO[]` | None | `evidence_results` | Persistence failure marks case `FAILED` and returns `500`. |
| 10. Analyze risk | `RiskAnalysisService` | Claim, evidence, input metadata, provider status, cache status | `RiskSignalDTO[]` | None | `risk_signals`, `audit_logs` | Failure marks case `FAILED` unless deterministic fallback is enabled. |
| 11. Calculate scores | `ScoringService` | Evidence and risk signals | `evidenceScore`, `riskScore`, `sourceAgreement` | None | None | Scores are clamped to 0–100. |
| 12. Recommend action | `EditorialRecommendationService` | Scores, source agreement, evidence count, provider status, cache status | `recommendedAction`, `recommendationReason` | None | None | Missing score data returns `NEEDS_MANUAL_REVIEW` with reason. |
| 13. Persist report | `VerificationRepository` | Final report fields | Updated case with `status=COMPLETED` | None | `verification_cases`, `audit_logs` | Failure marks case `FAILED` when possible and returns `500`. |
| 14. Return response | `VerificationController` | Stored case with relations | `VerificationAnalysisReportDTO` | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs` | None | Serialization error returns `500` with `traceId`. |

### 3.4 Transaction Rule

The backend must persist a traceable result for each verification request.

| Situation | Persistence Rule |
|---|---|
| Validation fails before case creation | No case is created. Return `400`. |
| Failure after case creation | Case is updated to `FAILED`, audit event `VERIFICATION_FAILED` is written, and typed error is returned. |
| Provider failure but claim exists | Case remains processable. `FactCheckEvidenceService` returns `providerStatus=UNAVAILABLE` and either `cacheStatus=MISS` or `cacheStatus=STALE_HIT`. `RiskAnalysisService` adds risk signal `PROVIDER_UNAVAILABLE`. If `cacheStatus=MISS`, the report is calculated with empty evidence. If `cacheStatus=STALE_HIT`, stale cached evidence may be used as fallback and the report must still show provider degradation context. |
| Persistence failure while saving final report | Return `500` with `traceId`. Case should be marked `FAILED` if update is still possible. |

### 3.5 Pipeline Data Types

#### `CreateVerificationRequestDTO`

```ts
type InputType = "TEXT" | "URL" | "IMAGE";

interface CreateVerificationRequestDTO {
  inputType: InputType;
  text?: string;
  url?: string;
  uploadedFileId?: string;
}
```

Validation:

| Field | Rule |
|---|---|
| `inputType` | Required. Must be `TEXT`, `URL`, or `IMAGE`. |
| `text` | Required when `inputType=TEXT`. Minimum 20 characters. |
| `url` | Required when `inputType=URL`. Must be a valid URL. |
| `uploadedFileId` | Required when `inputType=IMAGE`. Must belong to authenticated user. |

#### `PreprocessedInput`

```ts
interface PreprocessedInput {
  inputType: "TEXT" | "URL" | "IMAGE";
  originalInputPreview: string;
  contentForClaimExtraction: string;
  uploadedFileId?: string;
  metadata: {
    sourceUrl?: string;
    fileMimeType?: string;
    fileSizeBytes?: number;
    ocrMode?: "mock" | "local" | "provider";
  };
}
```

#### `ExtractedClaimResult`

```ts
interface ExtractedClaimResult {
  extractedClaim: string;
  normalizedClaim: string;
  confidence: number;
  extractionMode: "mock" | "provider";
}
```

#### `EvidenceCandidate`, `EvidenceDTO`, and `EvidenceSearchResult`

```ts
type EvidenceAgreement = "SUPPORTS" | "CONTRADICTS" | "PARTIAL" | "UNKNOWN";

interface EvidenceCandidate {
  title: string;
  sourceName: string;
  sourceUrl: string;
  publisher?: string;
  publishedAt?: string;
  summary: string;
  relevanceScore: number;
  agreement: EvidenceAgreement;
  provider: "mock" | "google_fact_check";
}

interface EvidenceDTO extends EvidenceCandidate {
  id: string;
}

type ProviderStatus = "SUCCESS" | "UNAVAILABLE" | "NOT_CALLED";
type CacheStatus = "HIT" | "MISS" | "STALE_HIT";

interface RawEvidenceSearchResult {
  rawEvidence: unknown[];
  providerStatus: ProviderStatus;
  cacheStatus: CacheStatus;
}

interface EvidenceSearchResult {
  evidence: EvidenceCandidate[];
  providerStatus: ProviderStatus;
  cacheStatus: CacheStatus;
}
```

Type usage:

| Type | Purpose |
|---|---|
| `EvidenceCandidate` | Internal normalized evidence object before persistence. It does not include `id`. |
| `EvidenceDTO` | API response evidence object after persistence. It includes `id`. |
| `RawEvidenceSearchResult` | Raw provider/mock/cache result before adapter normalization. |
| `EvidenceSearchResult` | Normalized evidence search result passed to risk, scoring, recommendation, and persistence services. |

Provider status:

| Provider Status | Meaning | Downstream Effect |
|---|---|---|
| `SUCCESS` | Live provider or mock search completed normally. | Empty evidence is treated as successful search with no relevant evidence. |
| `UNAVAILABLE` | Live provider could not be reached or failed after retries. | `RiskAnalysisService` adds `PROVIDER_UNAVAILABLE`. Recommendation rules treat the case as provider-degraded. |
| `NOT_CALLED` | Provider was not called because a fresh cache hit was used. | Cached evidence is used without provider degradation. |

Cache status:

| Cache Status | Meaning | Downstream Effect |
|---|---|---|
| `HIT` | Fresh cached normalized evidence was used. | Provider may be skipped and recommendation uses cached evidence. |
| `MISS` | No usable cache entry existed. | Provider/mock search is required. If provider fails, evidence is empty. |
| `STALE_HIT` | Expired cache was used only as fallback after provider failure. | Report may use cached evidence but must show provider degradation context. |

#### `RiskSignalDTO`

```ts
type RiskSeverity = "LOW" | "MEDIUM" | "HIGH";

interface RiskSignalDTO {
  id: string;
  type:
    | "NO_RELEVANT_EVIDENCE"
    | "CONTRADICTORY_EVIDENCE"
    | "LOW_SOURCE_AGREEMENT"
    | "PROVIDER_UNAVAILABLE"
    | "OCR_UNCERTAINTY"
    | "UNKNOWN_SOURCE"
    | "EMOTIONAL_LANGUAGE"
    | "RECENT_BREAKING_CLAIM"
    | "SOURCE_CONTENT_UNAVAILABLE";
  severity: RiskSeverity;
  description: string;
}
```

#### `AuditTrailEventDTO`

```ts
interface AuditTrailEventDTO {
  eventType: string;
  message: string;
  traceId: string;
  createdAt: string;
}
```

#### `VerificationAnalysisReportDTO`

```ts
type SourceAgreement = "HIGH" | "MEDIUM" | "LOW";

type RecommendedAction =
  | "READY_FOR_EDITORIAL_REVIEW"
  | "DO_NOT_PUBLISH_YET"
  | "NEEDS_MANUAL_REVIEW";

interface VerificationAnalysisReportDTO {
  caseId: string;
  inputType: "TEXT" | "URL" | "IMAGE";
  originalInputPreview: string;
  extractedClaim: string;
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: SourceAgreement;
  recommendedAction: RecommendedAction;
  recommendationReason: string;
  evidence: EvidenceDTO[];
  riskSignals: RiskSignalDTO[];
  auditTrail: AuditTrailEventDTO[];
  createdAt: string;
  completedAt?: string;
}
```

### 3.6 Evidence Relevance Rules

| Concept | Rule |
|---|---|
| Relevant evidence | `relevanceScore >= 60`. |
| Strong supporting evidence | `agreement=SUPPORTS` and `relevanceScore >= 70`. |
| Strong contradictory evidence | `agreement=CONTRADICTS` and `relevanceScore >= 70`. |
| Weak evidence | `relevanceScore < 60`. Weak evidence can be stored but does not count as relevant evidence for recommendation rules. |

### 3.7 Evidence Score Rules

`evidenceScore` measures the strength of available evidence. It is not a truth score.

| Evidence Agreement | Contribution |
|---|---:|
| `SUPPORTS` | `relevanceScore * 1.0` |
| `PARTIAL` | `relevanceScore * 0.5` |
| `UNKNOWN` | `relevanceScore * 0.25` |
| `CONTRADICTS` | `0` |

Rules:

| Rule | Requirement |
|---|---|
| Maximum items | Use up to 5 most relevant evidence items. |
| Empty evidence after successful evidence search | `evidenceScore = 0`. |
| Provider unavailable with no cache | `evidenceScore = 0`, but recommendation follows provider-degraded rule. |
| Final bounds | Clamp final score between 0 and 100. |
| Precision | Score is rounded to the nearest integer before persistence and API response. |

Formula:

```text
evidenceScore = average contribution of up to 5 most relevant evidence items
```

Precision rule:

```text
Evidence score is calculated as a number, rounded to the nearest integer, and clamped between 0 and 100 before persistence and API response.
```

### 3.8 Risk Score Rules

`riskScore` measures how risky it is to advance the case without additional review. It is not a truth score.

| Risk Signal Type | Severity | Score Contribution |
|---|---|---:|
| `NO_RELEVANT_EVIDENCE` | HIGH | +35 |
| `CONTRADICTORY_EVIDENCE` | HIGH | +30 |
| `LOW_SOURCE_AGREEMENT` | MEDIUM | +20 |
| `PROVIDER_UNAVAILABLE` | MEDIUM | +25 |
| `OCR_UNCERTAINTY` | MEDIUM | +15 |
| `UNKNOWN_SOURCE` | MEDIUM | +20 |
| `EMOTIONAL_LANGUAGE` | LOW | +10 |
| `RECENT_BREAKING_CLAIM` | MEDIUM | +15 |
| `SOURCE_CONTENT_UNAVAILABLE` | MEDIUM | +20 |

Risk signal deduplication rule:

```text
RiskAnalysisService must emit at most one risk signal per type per verification case. If duplicate signals of the same type are detected, they must be merged before calculating riskScore.
```

Risk signal emission rule:

```text
NO_RELEVANT_EVIDENCE must be emitted only when providerStatus=SUCCESS or cacheStatus is HIT or STALE_HIT and no relevant evidence exists. It must not be emitted when providerStatus=UNAVAILABLE and cacheStatus=MISS, because in that case the system could not search evidence.
```

Final value:

```text
riskScore = sum of risk signal contributions, rounded to the nearest integer and capped at 100
```

Precision rule:

```text
Risk score is calculated as a number, rounded to the nearest integer, and capped at 100 before persistence and API response.
```

### 3.9 Source Agreement Rules

| Value | Rule |
|---|---|
| `HIGH` | At least 2 relevant evidence items are `SUPPORTS` and no strong contradictory evidence exists. |
| `MEDIUM` | Evidence is mixed between `SUPPORTS`, `PARTIAL`, and `UNKNOWN`, with no strong contradiction. |
| `LOW` | Strong contradictory evidence exists, or no relevant evidence exists after a successful evidence search. |

### 3.10 Editorial Recommendation Rules

Recommendation rules are evaluated in priority order.

| Priority | Recommended Action | Rule |
|---:|---|---|
| 1 | `DO_NOT_PUBLISH_YET` | Strong contradictory evidence exists, or `riskScore > 60`. |
| 2 | `NEEDS_MANUAL_REVIEW` | `providerStatus=UNAVAILABLE`, `cacheStatus=MISS`, and claim extraction succeeded. |
| 3 | `DO_NOT_PUBLISH_YET` | `providerStatus=SUCCESS`, `cacheStatus=MISS`, and no relevant evidence exists after a successful evidence search. |
| 4 | `READY_FOR_EDITORIAL_REVIEW` | `evidenceScore >= 75`, `riskScore <= 35`, `sourceAgreement=HIGH`, and at least 2 relevant supporting evidence items exist. |
| 5 | `NEEDS_MANUAL_REVIEW` | Any intermediate, ambiguous, sensitive, partial, OCR-uncertain, or provider-degraded case not covered above. |

Cache fallback rule:

```text
If providerStatus=UNAVAILABLE and cacheStatus=STALE_HIT, the report may use stale cached evidence but must include provider degradation context through risk signal PROVIDER_UNAVAILABLE. Recommendation then follows the normal priority rules using the available cached evidence.
```

No-evidence rule:

```text
NO_RELEVANT_EVIDENCE and the no-evidence recommendation path apply only when evidence search completed successfully or cached evidence was available. They do not apply when providerStatus=UNAVAILABLE and cacheStatus=MISS.
```

This order prevents a provider outage from being treated the same as a successful search that found no supporting evidence.

### 3.11 Recommended Action Display Labels

| Internal Value | User-Facing Label |
|---|---|
| `READY_FOR_EDITORIAL_REVIEW` | Ready for editorial review |
| `DO_NOT_PUBLISH_YET` | Do not publish yet |
| `NEEDS_MANUAL_REVIEW` | Needs manual review |

The frontend must not display these internal values as raw technical labels unless they are shown in a developer/debug view.

### 3.12 Audit Events Generated by Verification

| Pipeline Moment | Audit Event |
|---|---|
| Case created | `VERIFICATION_CREATED` |
| Input preprocessed | `INPUT_PREPROCESSED` |
| Claim extracted | `CLAIM_EXTRACTED` |
| Evidence search started | `EVIDENCE_SEARCH_STARTED` |
| Evidence search completed | `EVIDENCE_SEARCH_COMPLETED` |
| Evidence provider failed | `EVIDENCE_SEARCH_FAILED` |
| Risk analysis completed | `RISK_ANALYSIS_COMPLETED` |
| Report generated | `ANALYSIS_REPORT_GENERATED` |
| Case failed | `VERIFICATION_FAILED` |

### 3.13 Example Report Response

This example is internally consistent with the recommendation rules because it contains at least 2 relevant supporting evidence items, low risk, and high source agreement.

```json
{
  "caseId": "8b7b8c72-8e5c-4c2f-a7a1-6a9f8c441001",
  "inputType": "TEXT",
  "originalInputPreview": "A public post claims that a national institution confirmed a new health measure...",
  "extractedClaim": "A national institution confirmed a new health measure.",
  "evidenceScore": 82,
  "riskScore": 10,
  "sourceAgreement": "HIGH",
  "recommendedAction": "READY_FOR_EDITORIAL_REVIEW",
  "recommendationReason": "At least two relevant sources support the extracted claim, source agreement is high, and risk signals are low.",
  "evidence": [
    {
      "id": "ev-001",
      "title": "Institution confirms new health measure",
      "sourceName": "Official Institution Website",
      "sourceUrl": "https://example.org/official-statement",
      "publisher": "Official Institution",
      "publishedAt": "2026-06-18T00:00:00.000Z",
      "summary": "The official statement supports the extracted claim.",
      "relevanceScore": 88,
      "agreement": "SUPPORTS",
      "provider": "mock"
    },
    {
      "id": "ev-002",
      "title": "Public health update summary",
      "sourceName": "Verified Fact Check Source",
      "sourceUrl": "https://example.org/fact-check",
      "publisher": "Verified Fact Check Source",
      "publishedAt": "2026-06-18T00:00:00.000Z",
      "summary": "The fact-check summary supports the official statement.",
      "relevanceScore": 76,
      "agreement": "SUPPORTS",
      "provider": "mock"
    }
  ],
  "riskSignals": [
    {
      "id": "risk-001",
      "type": "EMOTIONAL_LANGUAGE",
      "severity": "LOW",
      "description": "The submitted text uses promotional language, but evidence still supports the extracted claim."
    }
  ],
  "auditTrail": [
    {
      "eventType": "VERIFICATION_CREATED",
      "message": "Verification case created.",
      "traceId": "trace-001",
      "createdAt": "2026-06-18T00:00:00.000Z"
    },
    {
      "eventType": "ANALYSIS_REPORT_GENERATED",
      "message": "Verification analysis report generated.",
      "traceId": "trace-001",
      "createdAt": "2026-06-18T00:00:05.000Z"
    }
  ],
  "createdAt": "2026-06-18T00:00:00.000Z",
  "completedAt": "2026-06-18T00:00:05.000Z"
}
```

---

## 4. Frontend Page Contracts

### 4.1 Frontend Technology Contract

| Concern | Decision | Version |
|---|---|---|
| Runtime | Node.js | `22.x LTS` |
| Framework | React | `19.x` |
| Build tool | Vite | `7.x` |
| Language | TypeScript | `5.x` |
| Styling | Tailwind CSS | `4.x` |
| UI components | shadcn/ui | Package version defined in `package.json` when implementation starts. |
| Routing | React Router | `7.x` |
| API client | Axios | `1.x` |
| Server state | TanStack Query | `5.x` |
| Local UI state | Zustand | `5.x` |
| Forms | React Hook Form | `7.x` |
| Validation | Zod | `4.x` |
| Unit/component tests | Vitest + React Testing Library | Vitest `3.x`, RTL `16.x` |
| E2E tests | Playwright | `1.x` |
| Hosting target | Vercel | Managed platform, no application package version. |

Implementation rule:

```text
If a dependency version changes during implementation, this table must be updated in the same commit.
```

### 4.2 Frontend Authentication Rule

| Item | Contract |
|---|---|
| Access token | Stored in memory only. |
| Refresh token | Stored as httpOnly cookie by backend. |
| Page reload | Frontend calls `POST /api/auth/refresh` to obtain a new access token. |
| Logout | Frontend clears in-memory access token and calls `POST /api/auth/logout`. |
| Forbidden storage | Access token must not be stored in `localStorage`. |

### 4.3 Frontend Source Structure

```text
src/frontend/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       └── AuthProvider.tsx
│
├── features/
│   ├── auth/
│   ├── verification/
│   ├── history/
│   └── audit/
│
└── shared/
    ├── api/
    ├── components/
    ├── config/
    ├── errors/
    └── types/
```

### 4.4 Page Contract — `/login`

| Item | Contract |
|---|---|
| Route | `/login` |
| Page Component | `LoginPage` |
| Purpose | Authenticate existing users. |
| Initial API Calls | None |
| User-Triggered API Calls | `POST /api/auth/login` |
| Main Components | `AuthForm`, `EmailInput`, `PasswordInput`, `SubmitButton`, `FormErrorMessage` |
| Validation | Email required and valid. Password required. |
| Loading Behavior | Disable submit button and show loading indicator. |
| Error Behavior | `401` shows invalid credentials. `500` shows generic error with `traceId` if available. |
| Success Behavior | Store access token in memory and redirect to `/app`. |
| Navigation | Link to `/register`. |

### 4.5 Page Contract — `/register`

| Item | Contract |
|---|---|
| Route | `/register` |
| Page Component | `RegisterPage` |
| Purpose | Create journalist user account. |
| Initial API Calls | None |
| User-Triggered API Calls | `POST /api/auth/register` |
| Main Components | `AuthForm`, `NameInput`, `EmailInput`, `PasswordInput`, `SubmitButton`, `FormErrorMessage` |
| Validation | Name required. Email valid. Password minimum 8 characters. |
| Loading Behavior | Disable form and show loading indicator. |
| Error Behavior | `409` shows duplicate email. `400` shows field-level validation. |
| Success Behavior | Redirect to `/login` or `/app` according to backend response. |
| Navigation | Link to `/login`. |

### 4.6 Page Contract — `/app`

| Item | Contract |
|---|---|
| Route | `/app` |
| Page Component | `VerificationHubPage` |
| Purpose | Main dashboard for submitting suspicious content and viewing recent cases. |
| Initial API Calls | `GET /api/auth/me`; `GET /api/verifications?limit=5` |
| User-Triggered API Calls | `POST /api/uploads/image` only when `inputType=IMAGE`; `POST /api/verifications` for all input types. |
| Main Components | `VerificationInputPanel`, `InputTypeSelector`, `ImageUploadDropzone`, `RecentCasesList`, `SubmitVerificationButton`, `ReportGenerationStatus` |
| Validation | `TEXT`: minimum 20 characters. `URL`: valid URL. `IMAGE`: uploaded file required. Image MIME must be JPEG, PNG, or WEBP. Max image size is 5 MB. |
| Loading Behavior | Show progress message while upload or verification request is running. Disable duplicate submit. |
| Error Behavior | `400` shows field-level error. `401` redirects to `/login`. `403` shows authorization error. `500` shows generic error with `traceId`. |
| Empty State | If recent history is empty, show message encouraging first verification. |
| Success Behavior | Navigate to `/app/verification/:caseId`. |
| Navigation | History link navigates to `/app/history`. |

### 4.7 Page Contract — `/app/verification/:caseId`

| Item | Contract |
|---|---|
| Route | `/app/verification/:caseId` |
| Page Component | `VerificationResultPage` |
| Purpose | Display complete verification analysis report. |
| Initial API Calls | `GET /api/verifications/:caseId` |
| User-Triggered API Calls | `GET /api/audit/:caseId` if audit panel is opened or refreshed separately. |
| Main Components | `AnalysisSummaryCard`, `RecommendationBanner`, `ScoreSummary`, `EvidenceList`, `RiskSignalList`, `AuditTrailPanel` |
| Loading Behavior | Show report skeleton. |
| Error Behavior | `404` shows not found. `403` shows access denied. `401` redirects to `/login`. |
| Empty Evidence State | Show "No related evidence found" and display the recommendation reason. |
| Partial Report State | Show warning banner when risk signal `PROVIDER_UNAVAILABLE`, `OCR_UNCERTAINTY`, or `SOURCE_CONTENT_UNAVAILABLE` exists. |
| Success Behavior | Render report using user-facing recommendation labels. |
| Navigation | Back to `/app` and `/app/history`. |

### 4.8 Page Contract — `/app/history`

| Item | Contract |
|---|---|
| Route | `/app/history` |
| Page Component | `VerificationHistoryPage` |
| Purpose | Show paginated verification cases for current user. |
| Initial API Calls | `GET /api/verifications?page=1&limit=20` |
| User-Triggered API Calls | `GET /api/verifications?page=&limit=&status=&recommendedAction=` when filters or pagination change. |
| Main Components | `HistoryTable`, `HistoryFilters`, `PaginationControls`, `EmptyHistoryState` |
| Loading Behavior | Show table skeleton. |
| Error Behavior | `401` redirects to `/login`. `500` shows error with retry button. |
| Empty State | Show message when user has no verification cases. |
| Success Behavior | Clicking row navigates to `/app/history/:caseId`. |
| Navigation | Back to `/app`. |

### 4.9 Page Contract — `/app/history/:caseId`

| Item | Contract |
|---|---|
| Route | `/app/history/:caseId` |
| Page Component | `VerificationCaseDetailPage` |
| Purpose | Display saved case detail from history. |
| Initial API Calls | `GET /api/verifications/:caseId` |
| User-Triggered API Calls | `GET /api/audit/:caseId` if audit trail is refreshed separately. |
| Main Components | `AnalysisSummaryCard`, `EvidenceList`, `RiskSignalList`, `AuditTrailPanel` |
| Loading Behavior | Show case detail skeleton. |
| Error Behavior | `404` not found. `403` access denied. |
| Empty State | Not applicable if case exists. |
| Success Behavior | Render stored report. |
| Navigation | Back to `/app/history`. |

### 4.10 Frontend UI and Component Rules

| Rule | Requirement |
|---|---|
| Layout | Use a consistent authenticated layout for `/app`, `/app/verification/:caseId`, `/app/history`, and `/app/history/:caseId`. |
| Recommendation banner | Must show user-facing label, recommendation reason, evidence score, risk score, and source agreement. |
| Partial report banner | Must appear when `PROVIDER_UNAVAILABLE`, `OCR_UNCERTAINTY`, or `SOURCE_CONTENT_UNAVAILABLE` exists. |
| Error messages | Must be specific for validation errors and generic for unexpected errors, while displaying `traceId` when available. |
| Empty states | Must explain what the user can do next. |
| Accessibility | Form fields must have labels. Buttons must have accessible names. Color must not be the only way to communicate risk. |
| Responsive behavior | MVP targets desktop web but must remain usable on tablet-width screens. |

### 4.11 Frontend Message Catalog

| Situation | User-Facing Message |
|---|---|
| Provider unavailable | Evidence provider is currently unavailable. This report should be manually reviewed. |
| No relevant evidence found | No relevant evidence was found for the extracted claim. |
| OCR uncertainty | The image text could not be read with full confidence. Please review the extracted claim carefully. |
| Source content unavailable | The submitted URL could not be fully read. The report may be incomplete. |
| Strong contradiction | Strong contradictory evidence was found. Do not publish yet. |
| Access denied | You do not have permission to view this resource. |
| Unexpected error | Something went wrong. Please share this trace ID with support. |

### 4.12 Frontend Implementation Rules

| Rule | Requirement |
|---|---|
| No absolute truth labels | Frontend must not display `TRUE`, `FALSE`, `PASS`, `NO_PASS`, or `HUMAN_REVIEW` as product states. |
| Recommendation context required | Recommendation must be shown together with evidence score, risk score, source agreement, evidence list, and risk signals. |
| No raw provider data | Frontend must render normalized DTOs only. |
| Protected routes | `/app`, `/app/verification/:caseId`, `/app/history`, and `/app/history/:caseId` require authentication. |
| Traceable errors | API errors with `traceId` must display the trace ID in a support-friendly format. |
| Image flow | Image verification must upload the image first and then submit `uploadedFileId`. |
| Partial report visibility | Provider or OCR degradation must be visible as warning context, not hidden. |

---

## 5. Backend Module Contracts

### 5.1 Backend Technology Contract

| Concern | Decision | Version |
|---|---|---|
| Runtime | Node.js | `22.x LTS` |
| Framework | NestJS | `11.x` |
| Language | TypeScript | `5.x` |
| ORM | Prisma | `7.x` |
| Database | PostgreSQL through Supabase | PostgreSQL `15+` |
| File storage | Supabase Storage | Managed platform, no application package version. |
| Authentication | JWT access token + httpOnly refresh token | `@nestjs/jwt` compatible |
| Password hashing | Argon2id using `argon2` package | Package version defined in `package.json` when implementation starts. |
| API documentation | OpenAPI / Swagger | Nest Swagger-compatible |
| Testing | Jest + Supertest | Jest `30.x`, Supertest `7.x` |
| Backend hosting target | Render | Managed platform, no application package version. |

Implementation rule:

```text
If a dependency version changes during implementation, this table must be updated in the same commit.
```

### 5.2 Backend Source Structure

```text
src/backend/
├── api/
│   ├── controllers/
│   ├── guards/
│   ├── middlewares/
│   └── dto/
│
├── application/
│   ├── auth/
│   ├── verification/
│   ├── input-handlers/
│   ├── claims/
│   ├── evidence/
│   ├── risk/
│   ├── scoring/
│   └── ai/
│
├── domain/
│   ├── users/
│   ├── verification/
│   ├── evidence/
│   ├── risk/
│   └── audit/
│
├── infrastructure/
│   ├── persistence/
│   ├── integrations/
│   └── storage/
│
└── shared/
    ├── config/
    ├── errors/
    ├── logging/
    └── validation/
```

### 5.3 Module Contract — `CreateVerificationCaseService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/verification/CreateVerificationCaseService.ts` |
| Responsibility | Coordinates the complete verification analysis pipeline. |
| Inputs | `CreateVerificationRequestDTO`, `currentUserId`, `traceId` |
| Output | `VerificationAnalysisReportDTO` |
| Collaborators | `InputHandlerStrategyFactory`, `ClaimExtractionService`, `FactCheckEvidenceService`, `RiskAnalysisService`, `EvidenceScoreService`, `RiskScoreService`, `SourceAgreementService`, `EditorialRecommendationService`, repositories |
| Must Not | Call external providers directly. Access Prisma directly. Return raw provider JSON. Produce TRUE/FALSE labels. |
| Errors | Throws typed application exceptions only. Unexpected errors are converted to `AppException` with `traceId`. |
| Tests | Must test text, URL, image, provider failure, no evidence, high risk, unauthorized file, and persistence failure. |

### 5.4 Module Contract — Input Handlers

| Handler | Path | Responsibility | Input | Output |
|---|---|---|---|---|
| `TextInputHandler` | `src/backend/application/input-handlers/TextInputHandler.ts` | Validates and prepares text input. | `text` | `PreprocessedInput` |
| `UrlInputHandler` | `src/backend/application/input-handlers/UrlInputHandler.ts` | Validates URL and extracts or simulates page text. | `url` | `PreprocessedInput` |
| `ImageInputHandler` | `src/backend/application/input-handlers/ImageInputHandler.ts` | Validates uploaded file ownership and gets OCR text through mock/local behavior. | `uploadedFileId` | `PreprocessedInput` |

Implementation rule:

```text
After preprocessing, the backend analysis pipeline must use PreprocessedInput and must not contain additional input-type branching.
```

### 5.5 Module Contract — `ClaimExtractionService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/claims/ClaimExtractionService.ts` |
| Responsibility | Extracts one main claim from preprocessed content. |
| Input | `PreprocessedInput.contentForClaimExtraction` |
| Output | `ExtractedClaimResult` |
| Collaborators | `AIAmbassador`, `AuditLogRepository` |
| Must Not | Return multiple competing claims in the MVP. Return provider raw response. Decide truth/falsity. |
| Failure Behavior | If claim cannot be extracted, case is stored as `FAILED`, audit event `VERIFICATION_FAILED` is written, and endpoint returns `422`. |

### 5.6 Module Contract — `FactCheckEvidenceService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/evidence/FactCheckEvidenceService.ts` |
| Responsibility | Finds evidence related to the normalized claim. |
| Input | `normalizedClaim` |
| Output | `EvidenceSearchResult` |
| Collaborators | `FactCheckCacheRepository`, `GoogleFactCheckClient`, `MockFactCheckClient`, `GoogleFactCheckAdapter`, `EvidenceRepository` |
| Must Not | Expose provider API key. Return raw provider JSON. Treat empty evidence as false. |
| Failure Behavior | Provider failure returns `providerStatus=UNAVAILABLE` and either `cacheStatus=MISS` or `cacheStatus=STALE_HIT`, writes `EVIDENCE_SEARCH_FAILED`, and continues report generation. `RiskAnalysisService` is responsible for creating risk signal `PROVIDER_UNAVAILABLE`. |

### 5.7 Module Contract — `RiskAnalysisService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/risk/RiskAnalysisService.ts` |
| Responsibility | Produces risk signals based on claim, evidence, input metadata, and provider status. |
| Input | Claim, evidence candidates, input metadata, provider status, cache status |
| Output | `RiskSignalDTO[]` |
| Must Detect | `NO_RELEVANT_EVIDENCE`, `CONTRADICTORY_EVIDENCE`, `LOW_SOURCE_AGREEMENT`, `PROVIDER_UNAVAILABLE`, `OCR_UNCERTAINTY`, `UNKNOWN_SOURCE`, `EMOTIONAL_LANGUAGE`, `RECENT_BREAKING_CLAIM`, `SOURCE_CONTENT_UNAVAILABLE` |
| Must Not | Produce recommendation directly. Decide truth/falsity. |

### 5.8 Module Contract — Scoring Services

| Service | Path | Responsibility |
|---|---|---|
| `EvidenceScoreService` | `src/backend/application/scoring/EvidenceScoreService.ts` | Calculates `evidenceScore` using rules from section 3.7. |
| `RiskScoreService` | `src/backend/application/scoring/RiskScoreService.ts` | Calculates `riskScore` using rules from section 3.8. |
| `SourceAgreementService` | `src/backend/application/scoring/SourceAgreementService.ts` | Calculates `sourceAgreement` using rules from section 3.9. |
| `EditorialRecommendationService` | `src/backend/application/verification/EditorialRecommendationService.ts` | Calculates `recommendedAction` and `recommendationReason` using rules from section 3.10. |

Implementation rule:

```text
All scoring and recommendation services must be deterministic and independently unit-testable.
```

### 5.9 Module Contract — `AIAmbassador`

| Item | Contract |
|---|---|
| Path | `src/backend/application/ai/AIAmbassador.ts` |
| Responsibility | Single backend boundary for claim extraction, OCR text extraction, and AI-assisted risk hints. |
| Inputs | Text content or uploaded file metadata. |
| Outputs | Normalized internal results only. |
| Collaborators | `MockAIConnector`, `MockOCRConnector`, optional future provider connector, `AIResponseAdapter`, `RetryManager` |
| Must Not | Leak provider-specific response format outside `application/ai`. |
| Failure Behavior | Applies timeout, retry, adapter, and fallback behavior from integration contract. |

### 5.10 Module Contract — `GlobalExceptionFilter`

| Item | Contract |
|---|---|
| Path | `src/backend/shared/errors/GlobalExceptionFilter.ts` |
| Responsibility | Converts thrown errors into `ErrorResponseDTO`. |
| Input | Typed application exception or unexpected exception. |
| Output | `ErrorResponseDTO` with `traceId`, `statusCode`, `errorCode`, and safe message. |
| Must Not | Return stack traces, secrets, raw provider errors, or database internals. |

### 5.11 Repository Contracts

| Repository | Responsibility | Data Area |
|---|---|---|
| `UserRepository` | User lookup and creation. | Users |
| `RefreshTokenRepository` | Store, revoke, and validate hashed refresh tokens. | Sessions |
| `UploadedFileRepository` | Store and retrieve uploaded file metadata. | Uploaded files |
| `VerificationRepository` | Create, update, list, and retrieve verification cases. | Verification cases |
| `EvidenceRepository` | Store and retrieve normalized evidence. | Evidence results |
| `RiskSignalRepository` | Store and retrieve risk signals. | Risk signals |
| `AuditLogRepository` | Store and retrieve audit events. | Audit logs |
| `FactCheckCacheRepository` | Store and retrieve cached provider responses. | Fact-check cache |

Implementation rule:

```text
Application services must not import Prisma directly. Prisma access must stay inside repository classes.
```

---

## 6. HTTP API Contracts

### 6.1 API Rules

| Rule | Requirement |
|---|---|
| Base path | All application endpoints use `/api`. |
| Authentication | All endpoints except register, login, refresh, and health require authentication. |
| Authorization | Users access only their own files, cases, and audit logs unless role is `ADMIN`. |
| Error format | All errors return `ErrorResponseDTO`. |
| Traceability | All backend workflow errors include `traceId`. |
| Provider errors | External provider errors must not expose secrets or raw provider messages. |
| DTO format | API responses must use normalized internal DTOs. |

### 6.2 Shared DTOs

#### `ErrorResponseDTO`

```ts
interface ErrorResponseDTO {
  traceId: string;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}
```

#### `UserDTO`

```ts
interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "JOURNALIST" | "ADMIN";
}
```

#### `UploadedFileDTO`

```ts
interface UploadedFileDTO {
  id: string;
  originalFileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}
```

#### `VerificationHistoryItemDTO`

```ts
interface VerificationHistoryItemDTO {
  caseId: string;
  inputType: "TEXT" | "URL" | "IMAGE";
  originalInputPreview: string;
  extractedClaim?: string;
  evidenceScore?: number;
  riskScore?: number;
  sourceAgreement?: "HIGH" | "MEDIUM" | "LOW";
  recommendedAction?:
    | "READY_FOR_EDITORIAL_REVIEW"
    | "DO_NOT_PUBLISH_YET"
    | "NEEDS_MANUAL_REVIEW";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}
```

History item rule:

```text
Score, agreement, extractedClaim, and recommendation fields may be absent when status=PROCESSING or when status=FAILED before report generation.
```

### 6.2.1 Error Code Catalog

| Error Code | HTTP Status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | `400` | Request payload or query parameters are invalid. |
| `UNAUTHENTICATED` | `401` | Authentication is missing, invalid, revoked, or expired. |
| `FORBIDDEN_RESOURCE` | `403` | User is authenticated but cannot access the requested resource. |
| `RESOURCE_NOT_FOUND` | `404` | Requested resource does not exist. |
| `EMAIL_ALREADY_REGISTERED` | `409` | Registration email is already used by another account. |
| `CLAIM_EXTRACTION_FAILED` | `422` | Claim could not be extracted from submitted content. |
| `UNSUPPORTED_FILE_TYPE` | `400` | Uploaded file MIME type is not allowed. |
| `FILE_TOO_LARGE` | `413` | Uploaded file exceeds the configured maximum size. |
| `RATE_LIMIT_EXCEEDED` | `429` | User or IP exceeded the configured request limit. |
| `INTERNAL_ERROR` | `500` | Unexpected server error. |

Implementation rule:

```text
Frontend error handling must use errorCode first and statusCode second. Backend errors must never expose stack traces, secrets, provider keys, raw provider errors, or database internals.
```

### 6.3 System Endpoint

#### `GET /api/health`

| Item | Contract |
|---|---|
| Auth Required | No |
| Controller | `HealthController.getHealth` |
| Service | `HealthService` |
| Purpose | Validate backend availability for local checks, deployment checks, and monitoring. |
| Reads | None |
| Writes | None |

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-06-18T00:00:00.000Z"
}
```

### 6.4 Authentication Endpoints

#### `POST /api/auth/register`

| Item | Contract |
|---|---|
| Auth Required | No |
| Controller | `AuthController.register` |
| Service | `RegisterService` |
| Purpose | Create user account. |
| Reads | `users` |
| Writes | `users`, `audit_logs` |

Request:

```json
{
  "name": "Ana Reporter",
  "email": "ana@example.com",
  "password": "StrongPassword123"
}
```

Response `201`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Ana Reporter",
    "email": "ana@example.com",
    "role": "JOURNALIST"
  }
}
```

Errors:

| Status | Meaning |
|---:|---|
| `400` | Invalid input. |
| `409` | Email already registered. |
| `500` | Unexpected server error. |

#### `POST /api/auth/login`

| Item | Contract |
|---|---|
| Auth Required | No |
| Controller | `AuthController.login` |
| Service | `LoginService` |
| Purpose | Authenticate user. |
| Reads | `users` |
| Writes | `refresh_tokens`, `audit_logs` |

Request:

```json
{
  "email": "ana@example.com",
  "password": "StrongPassword123"
}
```

Response `200`:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid",
    "name": "Ana Reporter",
    "email": "ana@example.com",
    "role": "JOURNALIST"
  }
}
```

Errors:

| Status | Meaning |
|---:|---|
| `400` | Invalid input. |
| `401` | Invalid credentials. |
| `403` | Inactive or blocked user. |

#### `POST /api/auth/refresh`

| Item | Contract |
|---|---|
| Auth Required | Refresh token cookie |
| Controller | `AuthController.refresh` |
| Service | `RefreshTokenService` |
| Purpose | Issue new access token. |
| Reads | `refresh_tokens`, `users` |
| Writes | `refresh_tokens`, `audit_logs` |

Response `200`:

```json
{
  "accessToken": "jwt"
}
```

Errors:

| Status | Meaning |
|---:|---|
| `401` | Missing, invalid, revoked, or expired refresh token. |
| `500` | Unexpected server error. |

#### `POST /api/auth/logout`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `AuthController.logout` |
| Service | `LogoutService` |
| Purpose | Revoke current refresh token. |
| Reads | `refresh_tokens` |
| Writes | `refresh_tokens`, `audit_logs` |

Response `204`: no body.

Errors:

| Status | Meaning |
|---:|---|
| `401` | Unauthenticated. |
| `500` | Unexpected server error. |

#### `GET /api/auth/me`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `AuthController.me` |
| Service | `GetCurrentUserService` |
| Purpose | Return authenticated user summary. |
| Reads | `users` |
| Writes | None |

Response `200`:

```json
{
  "id": "uuid",
  "name": "Ana Reporter",
  "email": "ana@example.com",
  "role": "JOURNALIST"
}
```

### 6.5 Upload Endpoint

#### `POST /api/uploads/image`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `UploadController.uploadImage` |
| Service | `UploadImageService` |
| Purpose | Upload image or screenshot before image verification. |
| Reads | `users` |
| Writes | `uploaded_files`, `audit_logs` |
| Content Type | `multipart/form-data` |
| Allowed MIME Types | `image/jpeg`, `image/png`, `image/webp` |
| Max Size | 5 MB |

Response `201`:

```json
{
  "id": "uuid",
  "originalFileName": "screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 345000,
  "storagePath": "uploads/user-id/file-id.png",
  "createdAt": "2026-06-18T00:00:00.000Z"
}
```

Errors:

| Status | Error Code | Meaning |
|---:|---|---|
| `400` | `UNSUPPORTED_FILE_TYPE` | Uploaded file MIME type is not allowed. |
| `401` | `UNAUTHENTICATED` | User is not authenticated. |
| `413` | `FILE_TOO_LARGE` | Uploaded file exceeds 5 MB. |
| `500` | `INTERNAL_ERROR` | Storage failure or unexpected server error. |

### 6.6 Verification Endpoints

#### `POST /api/verifications`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `VerificationController.create` |
| Service | `CreateVerificationCaseService` |
| Purpose | Create verification case and return analysis report. |
| Reads | `users`, `uploaded_files` optional, `fact_check_cache` optional |
| Writes | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs`, `fact_check_cache` optional |

Request for text:

```json
{
  "inputType": "TEXT",
  "text": "Claim text with at least 20 characters."
}
```

Request for URL:

```json
{
  "inputType": "URL",
  "url": "https://example.com/article"
}
```

Request for image:

```json
{
  "inputType": "IMAGE",
  "uploadedFileId": "uuid"
}
```

Response `201`: `VerificationAnalysisReportDTO`.

Errors:

| Status | Meaning |
|---:|---|
| `400` | Invalid request body. |
| `401` | Unauthenticated. |
| `403` | Uploaded file belongs to another user. |
| `404` | Uploaded file not found. |
| `422` | Claim could not be extracted; case is stored as `FAILED` when case already exists. |
| `500` | Unexpected server error. |

Error detail rule for `422`:

```json
{
  "traceId": "trace-id",
  "statusCode": 422,
  "errorCode": "CLAIM_EXTRACTION_FAILED",
  "message": "Claim could not be extracted from the submitted content.",
  "details": {
    "caseId": "uuid"
  }
}
```

#### `GET /api/verifications`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `VerificationController.list` |
| Service | `ListVerificationHistoryService` |
| Purpose | Return paginated history for current user. |
| Reads | `verification_cases` |
| Writes | None |

Query parameters:

| Parameter | Type | Default |
|---|---|---|
| `page` | number | `1` |
| `limit` | number | `20` |
| `status` | `PROCESSING`, `COMPLETED`, `FAILED` | optional |
| `recommendedAction` | `READY_FOR_EDITORIAL_REVIEW`, `DO_NOT_PUBLISH_YET`, `NEEDS_MANUAL_REVIEW` | optional |

Response `200`:

```json
{
  "items": [
    {
      "caseId": "uuid",
      "inputType": "TEXT",
      "originalInputPreview": "Claim preview...",
      "extractedClaim": "Extracted claim...",
      "evidenceScore": 82,
      "riskScore": 10,
      "sourceAgreement": "HIGH",
      "recommendedAction": "READY_FOR_EDITORIAL_REVIEW",
      "status": "COMPLETED",
      "createdAt": "2026-06-18T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

#### `GET /api/verifications/:caseId`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `VerificationController.getById` |
| Service | `GetVerificationCaseService` |
| Purpose | Return full analysis report for one case. |
| Reads | `verification_cases`, `evidence_results`, `risk_signals`, `audit_logs` |
| Writes | None |

Response `200`: `VerificationAnalysisReportDTO`.

Errors:

| Status | Meaning |
|---:|---|
| `401` | Unauthenticated. |
| `403` | Case belongs to another user. |
| `404` | Case not found. |

### 6.7 Audit Endpoint

#### `GET /api/audit/:caseId`

| Item | Contract |
|---|---|
| Auth Required | Yes |
| Controller | `AuditController.getByCaseId` |
| Service | `GetAuditTrailService` |
| Purpose | Return audit trail for one verification case. |
| Reads | `verification_cases`, `audit_logs` |
| Writes | None |

Response `200`:

```json
{
  "items": [
    {
      "eventType": "VERIFICATION_CREATED",
      "message": "Verification case created.",
      "traceId": "trace-id",
      "createdAt": "2026-06-18T00:00:00.000Z"
    }
  ]
}
```

Implementation rule:

```text
This endpoint is read-only in the MVP. It must not create audit events as a side effect of a GET request.
```

---

## 7. Data Model Contract

The database model is implemented in [Prisma schema](prisma/schema.prisma) and documented in [DBML model](database/dbml/ia-detector.dbml).

Unless a constraint is explicitly described as database-level, the MVP may enforce it at application level through DTO validation, service rules, and repository guards. The README still defines the required behavior regardless of where the enforcement is implemented.

### 7.1 Enum Contract

| Enum | Values | Purpose |
|---|---|---|
| `UserRole` | `JOURNALIST`, `ADMIN` | Controls authorization behavior. |
| `VerificationStatus` | `PROCESSING`, `COMPLETED`, `FAILED` | Tracks technical processing state. |
| `InputType` | `TEXT`, `URL`, `IMAGE` | Describes submitted content type. |
| `SourceAgreement` | `HIGH`, `MEDIUM`, `LOW` | Summarizes agreement among evidence sources. |
| `RecommendedAction` | `READY_FOR_EDITORIAL_REVIEW`, `DO_NOT_PUBLISH_YET`, `NEEDS_MANUAL_REVIEW` | Stores editorial recommendation. |
| `EvidenceAgreement` | `SUPPORTS`, `CONTRADICTS`, `PARTIAL`, `UNKNOWN` | Describes how one evidence item relates to the extracted claim. |
| `RiskSeverity` | `LOW`, `MEDIUM`, `HIGH` | Describes risk signal severity. |
| `RiskSignalType` | `NO_RELEVANT_EVIDENCE`, `CONTRADICTORY_EVIDENCE`, `LOW_SOURCE_AGREEMENT`, `PROVIDER_UNAVAILABLE`, `OCR_UNCERTAINTY`, `UNKNOWN_SOURCE`, `EMOTIONAL_LANGUAGE`, `RECENT_BREAKING_CLAIM`, `SOURCE_CONTENT_UNAVAILABLE` | Describes the type of warning detected during verification. |
| `AuditEventType` | `USER_REGISTERED`, `USER_LOGGED_IN`, `USER_LOGGED_OUT`, `SESSION_REFRESHED`, `FILE_UPLOADED`, `VERIFICATION_CREATED`, `INPUT_PREPROCESSED`, `CLAIM_EXTRACTED`, `EVIDENCE_SEARCH_STARTED`, `EVIDENCE_SEARCH_COMPLETED`, `EVIDENCE_SEARCH_FAILED`, `RISK_ANALYSIS_COMPLETED`, `ANALYSIS_REPORT_GENERATED`, `VERIFICATION_FAILED` | Describes traceable workflow events. |

### 7.2 Table — `users`

| Item | Contract |
|---|---|
| Purpose | Stores journalist and admin accounts. |
| Used By | Auth endpoints, authorization checks, verification ownership. |
| Main Columns | `id`, `name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`, `deleted_at` |
| Constraints | `email` unique. `password_hash` required. |
| Relationships | One user has many refresh tokens, uploaded files, and verification cases. |
| Indexes | `email` unique for login. `role` optional for admin queries. |

### 7.3 Table — `refresh_tokens`

| Item | Contract |
|---|---|
| Purpose | Stores hashed refresh tokens for session renewal and logout. |
| Used By | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`. |
| Main Columns | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` |
| Constraints | `token_hash` required. Raw refresh token must never be stored. |
| Relationships | Many refresh tokens belong to one user. |
| Indexes | `user_id`, `token_hash`, `expires_at`. |

### 7.4 Table — `uploaded_files`

| Item | Contract |
|---|---|
| Purpose | Stores metadata for uploaded images or screenshots. File content is stored in object storage; local demo mode may use mock or local storage paths. |
| Used By | `POST /api/uploads/image`, `POST /api/verifications` with `inputType=IMAGE`. |
| Main Columns | `id`, `owner_user_id`, `original_file_name`, `mime_type`, `size_bytes`, `storage_path`, `sha256_hash`, `created_at`, `deleted_at` |
| Constraints | MIME type must be JPEG, PNG, or WEBP. Size must be 5 MB or less. |
| Relationships | Many files belong to one user. One file may be referenced by verification cases. |
| Indexes | `owner_user_id` for ownership lookup. `sha256_hash` for duplicate detection. |

### 7.5 Table — `verification_cases`

| Item | Contract |
|---|---|
| Purpose | Stores one verification request and final analysis summary. |
| Used By | `POST /api/verifications`, `GET /api/verifications`, `GET /api/verifications/:caseId`. |
| Main Columns | `id`, `user_id`, `input_type`, `raw_input`, `uploaded_file_id`, `original_input_preview`, `extracted_claim`, `status`, `evidence_score`, `risk_score`, `source_agreement`, `recommended_action`, `recommendation_reason`, `created_at`, `completed_at`, `failed_at` |
| Constraints | `uploaded_file_id` required only when `input_type=IMAGE`. Scores must be 0–100. `recommended_action` exists only after report generation. |
| Relationships | One case belongs to one user. One case has many evidence results, risk signals, and audit logs. |
| Lifecycle | Case is inserted as `PROCESSING`. It becomes `COMPLETED` when the report is generated or `FAILED` when an unrecoverable error occurs. |
| Indexes | `(user_id, created_at)` for history. `status` for technical filtering. `recommended_action` for editorial filtering. `uploaded_file_id` for image case lookup. |

### 7.6 Table — `evidence_results`

| Item | Contract |
|---|---|
| Purpose | Stores normalized evidence found for one verification case. |
| Used By | `POST /api/verifications`, `GET /api/verifications/:caseId`. |
| Main Columns | `id`, `case_id`, `title`, `source_name`, `source_url`, `publisher`, `summary`, `relevance_score`, `agreement`, `published_at`, `provider`, `created_at` |
| Constraints | `source_url` required. `relevance_score` must be 0–100. `agreement` defaults to `UNKNOWN`. |
| Relationships | Many evidence rows belong to one verification case. |
| Indexes | `case_id` for report loading. `provider` for provider diagnostics. `agreement` optional for scoring analysis. |

### 7.7 Table — `risk_signals`

| Item | Contract |
|---|---|
| Purpose | Stores warning signals detected during verification. |
| Used By | `POST /api/verifications`, `GET /api/verifications/:caseId`. |
| Main Columns | `id`, `case_id`, `type`, `severity`, `description`, `created_at` |
| Constraints | `type` must match `RiskSignalType`. `severity` must be `LOW`, `MEDIUM`, or `HIGH`. A verification case should not store duplicate risk signal types. |
| Relationships | Many risk signals belong to one verification case. |
| Indexes | `case_id` for report loading. `severity` optional for filtering high-risk cases. |

### 7.8 Table — `audit_logs`

| Item | Contract |
|---|---|
| Purpose | Stores traceable workflow events. |
| Used By | Auth, upload, verification, and audit endpoints. |
| Main Columns | `id`, `case_id`, `user_id`, `event_type`, `message`, `trace_id`, `metadata`, `created_at` |
| Constraints | `trace_id` required for backend workflow events. Audit logs must not store secrets. |
| Relationships | Audit log may belong to a case and/or user. |
| Indexes | `(case_id, created_at)` for audit trail. `user_id` for user activity. `trace_id` for debugging. |

### 7.9 Table — `fact_check_cache`

| Item | Contract |
|---|---|
| Purpose | Caches normalized provider responses to avoid repeated external calls for the same claim. |
| Used By | `FactCheckEvidenceService`. |
| Main Columns | `id`, `cache_key`, `normalized_claim`, `provider`, `response_data`, `expires_at`, `created_at`, `updated_at` |
| Constraints | `cache_key` unique. Expired cache must not be used for normal cache hits. Expired cache may be used only as `STALE_HIT` fallback when `providerStatus=UNAVAILABLE`. |
| Relationships | No direct case relationship required. Cache is claim/provider based. |
| Indexes | `cache_key` unique for lookup. `expires_at` for cleanup. `provider` for diagnostics. |
| Cached Data Rule | `response_data` stores normalized evidence used by the application, not raw provider responses. |

---

## 8. External Integration Contracts

### 8.1 Integration Rules

| Rule | Requirement |
|---|---|
| No frontend secrets | API keys must never be exposed to frontend code. |
| Provider isolation | Application services must use integration services/adapters, not raw provider clients. |
| Mock mode | MVP must run with deterministic mock integrations. |
| Failure tolerance | Provider failure must not crash the frontend. |
| Auditability | Provider failures must generate audit events. |
| Normalization | Raw provider responses must be adapted before persistence or response. |

### 8.2 Google Fact Check Tools API

| Item | Contract |
|---|---|
| Purpose | Search previous fact-checking evidence related to the normalized claim. |
| Mode | `mock` or `live` |
| Environment Variables | `FACT_CHECK_MODE`, `GOOGLE_FACT_CHECK_API_KEY`, `FACT_CHECK_TIMEOUT_SECONDS`, `FACT_CHECK_MAX_RETRIES`, `FACT_CHECK_CACHE_TTL_MINUTES` |
| Backend Boundary | `FactCheckEvidenceService` |
| Client | `GoogleFactCheckClient` |
| Adapter | `GoogleFactCheckAdapter` |
| Mock | `MockFactCheckClient` |
| Canonical Input | `normalizedClaim: string` |
| Canonical Output | `EvidenceSearchResult` containing `EvidenceCandidate[]`, `ProviderStatus`, and `CacheStatus` |
| Timeout | 8 seconds by default. |
| Retries | 2 retries by default. |
| Cache Key | `sha256(provider + ":" + normalizedClaim)` |
| Cache TTL | 60 minutes by default. |
| Failure Behavior | Provider failure returns `providerStatus=UNAVAILABLE`. If no usable fallback exists, `cacheStatus=MISS` and the pipeline continues with empty evidence. If stale cache fallback exists, `cacheStatus=STALE_HIT` and the pipeline continues with stale cached evidence plus provider degradation context. |
| Security | API key is read only by backend from environment variables. |

#### Evidence Search Result

`FactCheckEvidenceService` must return evidence, provider status, and cache status:

```ts
type ProviderStatus = "SUCCESS" | "UNAVAILABLE" | "NOT_CALLED";
type CacheStatus = "HIT" | "MISS" | "STALE_HIT";

interface EvidenceSearchResult {
  evidence: EvidenceCandidate[];
  providerStatus: ProviderStatus;
  cacheStatus: CacheStatus;
}
```

This result is passed to `RiskAnalysisService` and `EditorialRecommendationService` so the system can distinguish between:

| Situation | Provider Status | Cache Status | Meaning |
|---|---|---|---|
| Successful search with evidence | `SUCCESS` | `MISS` | Provider/mock search completed and returned evidence. |
| Successful search with no relevant evidence | `SUCCESS` | `MISS` | Evidence was searched, but nothing relevant was found. |
| Fresh cache hit | `NOT_CALLED` | `HIT` | Fresh cached evidence was used and provider was skipped. |
| Provider unavailable with no cache | `UNAVAILABLE` | `MISS` | Evidence could not be searched and no cache fallback exists. |
| Provider unavailable with stale cache | `UNAVAILABLE` | `STALE_HIT` | Provider failed, but expired cached evidence was used as fallback with degradation context. |

Implementation rule:

```text
Cache status and provider status must be evaluated together. Cache hit is not a provider status.
```

### 8.3 Fact Check Mock Fixtures

Mock mode must be deterministic. Fixture matching is case-insensitive and uses the normalized claim.

| Input Contains | Mock Evidence Behavior |
|---|---|
| `official`, `institution`, or `confirmed` | Return 2 supporting evidence items with relevance scores above 70. |
| `viral`, `unconfirmed`, or `rumor` | Return no evidence. `RiskAnalysisService` must add `NO_RELEVANT_EVIDENCE`. |
| `contradicted` or `false claim` | Return at least 1 strong contradictory evidence item. |
| Any other input | Return 1 `UNKNOWN` evidence item with relevance below 60. |

### 8.4 AI / OCR Provider or Mock

| Item | Contract |
|---|---|
| Purpose | Extract claim, OCR text, and optional risk hints. |
| Mode | `mock` or `live` |
| Environment Variables | `AI_MODE`, `AI_TIMEOUT_SECONDS`, `AI_MAX_RETRIES` |
| Backend Boundary | `AIAmbassador` |
| Mock AI | `MockAIConnector` |
| Mock OCR | `MockOCRConnector` |
| Adapter | `AIResponseAdapter` |
| Retry | `RetryManager` |
| Canonical Inputs | Text content, URL extracted content, or uploaded file metadata. |
| Canonical Outputs | `ExtractedClaimResult`, OCR text, optional risk hints. |
| Timeout | 8 seconds by default. |
| Retries | 2 retries by default. |
| Failure Behavior | If claim extraction fails, mark case as `FAILED`. If OCR is uncertain, return OCR status `UNCERTAIN`; `RiskAnalysisService` creates `OCR_UNCERTAINTY` and the pipeline continues when usable text exists. |
| Security | Raw provider response is never returned to frontend. |

### 8.5 AI/OCR Mock Fixtures

| Input Type | Mock Behavior |
|---|---|
| `TEXT` | Use the submitted text and extract the first meaningful sentence as the claim. |
| `URL` | Use deterministic simulated page content derived from the URL string. |
| `IMAGE` | Return deterministic OCR text based on uploaded file metadata. |
| Empty or unusable content | Return extraction failure. |
| Low-confidence OCR text | Return usable text with OCR status `UNCERTAIN`; `RiskAnalysisService` adds `OCR_UNCERTAINTY`. |

### 8.6 Object Storage

| Item | Contract |
|---|---|
| Purpose | Store uploaded image and screenshot files. |
| Environment Variables | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| Backend Boundary | `SupabaseStorageService` |
| Canonical Input | Uploaded file stream and metadata. |
| Canonical Output | `storagePath` |
| File Types | JPEG, PNG, WEBP |
| Max Size | 5 MB |
| Failure Behavior | Upload failure returns `500` with `traceId`; no verification case is created. |
| Security | Service role key is backend-only. Users access files through backend authorization. |

---

## 9. Applied Design Patterns

### 9.1 Pattern Documentation Format

Each applied pattern is documented with:

```text
Pattern
Context
Problem
Forces
Solution
Participants
Collaborations
Implementation Rules
Consequences
Code Location
```

Only patterns directly used by the MVP are included.

### 9.2 Strategy Pattern — Input Preprocessing

| Item | Contract |
|---|---|
| Pattern | Strategy |
| Context | TEXT, URL, and IMAGE submissions enter the same verification pipeline but require different preprocessing. |
| Problem | `CreateVerificationCaseService` should not contain input-specific branching logic after validation. |
| Forces | New input types may be added later. Image requires file lookup and OCR. URL requires URL-specific extraction or simulation. Text is direct. |
| Solution | Use one input handler strategy per input type. |
| Participants | `InputHandlerStrategy`, `TextInputHandler`, `UrlInputHandler`, `ImageInputHandler`, `InputHandlerStrategyFactory`, `CreateVerificationCaseService` |
| Collaborations | `CreateVerificationCaseService` asks the factory for a handler based on `inputType`. The handler returns `PreprocessedInput`. The rest of the pipeline uses `PreprocessedInput` only. |
| Implementation Rules | No input-type branching is allowed in the backend analysis pipeline after preprocessing. |
| Consequences | The verification pipeline remains stable when input handling changes. |
| Code Location | `src/backend/application/input-handlers/` |

### 9.3 Adapter Pattern — Evidence Normalization

| Item | Contract |
|---|---|
| Pattern | Adapter |
| Context | Google Fact Check Tools API returns provider-specific JSON. |
| Problem | Application services and frontend DTOs must not depend on provider response shape. |
| Forces | Provider responses may change. Mock and live modes must produce the same internal model. |
| Solution | Convert provider or mock responses into `EvidenceCandidate[]`. |
| Participants | `GoogleFactCheckClient`, `GoogleFactCheckAdapter`, `MockFactCheckClient`, `FactCheckEvidenceService` |
| Collaborations | `FactCheckEvidenceService` receives raw provider/mock output, passes it through adapter, and persists normalized evidence. |
| Implementation Rules | Controllers and application services must not return or persist raw provider JSON as report data. |
| Consequences | Internal evidence model remains stable even if provider changes. |
| Code Location | `src/backend/infrastructure/integrations/factcheck/` |

### 9.4 Ambassador Pattern — AI/OCR Boundary

| Item | Contract |
|---|---|
| Pattern | Ambassador |
| Context | Claim extraction and OCR may use mock behavior in MVP and a real provider later. |
| Problem | Business services should not know provider SDKs, retry logic, timeouts, or raw response shapes. |
| Forces | Provider may be unavailable. MVP must work without credentials. Provider can change later. |
| Solution | Use `AIAmbassador` as the single boundary for AI/OCR behavior. |
| Participants | `AIAmbassador`, `MockAIConnector`, `MockOCRConnector`, `AIResponseAdapter`, `RetryManager`, `ClaimExtractionService`, `ImageInputHandler` |
| Collaborations | Application services call `AIAmbassador`; ambassador applies mode, timeout, retry, adapter, and fallback behavior. |
| Implementation Rules | No service outside `application/ai` can call AI/OCR providers directly. |
| Consequences | Provider changes do not require rewriting verification workflow. |
| Code Location | `src/backend/application/ai/` |

### 9.5 Repository Pattern — Persistence Isolation

| Item | Contract |
|---|---|
| Pattern | Repository |
| Context | Application services need persistence but should not depend on Prisma details. |
| Problem | Direct Prisma usage inside use cases makes business logic harder to test and change. |
| Forces | Prisma schema may evolve. Tests need repository mocks. Application services must stay focused on workflow. |
| Solution | Use repositories for each persistence area. |
| Participants | `VerificationRepository`, `EvidenceRepository`, `RiskSignalRepository`, `AuditLogRepository`, `UserRepository`, `UploadedFileRepository`, `FactCheckCacheRepository` |
| Collaborations | Application services call repositories. Repositories call Prisma. |
| Implementation Rules | Prisma calls must stay inside repository classes. |
| Consequences | Business logic remains testable and persistence can change without rewriting use cases. |
| Code Location | `src/backend/infrastructure/persistence/repositories/` |

### 9.6 Frontend Container/Presentation Pattern — UI Separation

| Item | Contract |
|---|---|
| Pattern | Container / Presentation Component |
| Context | Frontend pages need data fetching, validation, navigation, and reusable UI. |
| Problem | Mixing API calls and visual markup in every component makes UI harder to test and reuse. |
| Forces | Same report summary appears in result and history detail pages. Loading and error states must be consistent. |
| Solution | Page components own data fetching and orchestration. Presentational components render DTOs and receive callbacks through props. |
| Participants | `VerificationHubPage`, `VerificationResultPage`, `AnalysisSummaryCard`, `EvidenceList`, `RiskSignalList`, `AuditTrailPanel` |
| Collaborations | Page components call hooks/API clients and pass normalized data to presentational components. |
| Implementation Rules | Presentational components must not call API clients directly. |
| Consequences | UI components become easier to test and reuse. |
| Code Location | `src/frontend/features/` and `src/frontend/shared/components/` |

---

## 10. Security Contract

### 10.1 Authentication

| Area | Requirement |
|---|---|
| Access token | JWT access token signed by backend and stored in frontend memory only. |
| Refresh token | Stored as httpOnly cookie. |
| Refresh token storage | Only hashed refresh tokens are stored. |
| Logout | Revokes current refresh token. |
| Protected routes | All verification, upload, history, and audit endpoints require authentication. |

### 10.2 Authorization

| Resource | Rule |
|---|---|
| Uploaded files | User can access only own uploaded files unless role is `ADMIN`. |
| Verification cases | User can access only own cases unless role is `ADMIN`. |
| Audit logs | User can access audit logs only for own cases unless role is `ADMIN`. |
| Admin access | Admin role can review all cases and audit trails. |

### 10.3 Passwords and Secrets

| Area | Requirement |
|---|---|
| Password hashing | Use Argon2id. Never store raw passwords. |
| API keys | External provider keys are backend-only. |
| `.env` | Must not be committed. |
| Error responses | Must not expose secrets, stack traces, provider keys, raw provider errors, or database internals. |

### 10.4 File Upload Security

| Area | Requirement |
|---|---|
| Allowed MIME types | JPEG, PNG, WEBP only. |
| Max file size | 5 MB. |
| Ownership | `uploadedFileId` must belong to current user. |
| Storage path | Generated by backend. Frontend does not choose storage path. |
| Deleted files | Deleted or unavailable files cannot be used for new verification cases. |

### 10.5 Audit Log Security

| Rule | Requirement |
|---|---|
| Traceability | Workflow events must include `traceId`. |
| No secrets | Audit metadata must not store passwords, refresh tokens, API keys, raw provider secrets, or file contents. |
| Case access | Audit trail follows the same authorization rule as verification cases. |

### 10.6 Cookie and CORS Policy

| Area | Requirement |
|---|---|
| Refresh cookie | Must be `httpOnly`. |
| Production cookie security | Must use `Secure=true` in production. |
| SameSite policy | Use `SameSite=Lax` for the MVP. |
| CORS | Backend allows only `FRONTEND_URL` as an approved origin. |
| CSRF posture | Refresh/logout rely on httpOnly cookie, `SameSite=Lax`, and strict CORS. If deployment requires cross-site cookies, add CSRF token protection. |

### 10.7 Rate Limiting

| Area | Limit | Rule |
|---|---:|---|
| Login/Register | 5 requests per minute | Per IP address. |
| Session refresh | 30 requests per minute | Per user/session. |
| Verification creation | 20 requests per hour | Per authenticated user. |
| Image upload | 20 uploads per hour | Per authenticated user. |
| Health check | Infrastructure-level protection | No user-level rate limit required. |

When a limit is exceeded, the backend returns `429 RATE_LIMIT_EXCEEDED` using `ErrorResponseDTO`.

---

## 11. Observability Contract

### 11.1 Traceability

| Item | Requirement |
|---|---|
| `traceId` | Every request handled by the backend must have a `traceId`. |
| Error responses | Must include `traceId`. |
| Audit logs | Verification workflow audit events must include `traceId`. |
| Provider calls | External provider failures must be logged with `traceId`. |

### 11.2 Structured Logs

Backend logs must include:

| Field | Purpose |
|---|---|
| `traceId` | Correlates request, audit logs, and errors. |
| `userId` | Identifies authenticated user when available. |
| `caseId` | Identifies verification case when available. |
| `event` | Describes the workflow event. |
| `durationMs` | Measures operation time. |
| `providerStatus` | Tracks external provider availability. |
| `cacheStatus` | Tracks whether evidence came from fresh cache, stale cache, or cache miss. |

Logs must not include passwords, refresh tokens, API keys, raw provider secrets, or full uploaded file contents.

### 11.3 Metrics

The backend should expose or record the following operational metrics when implementation starts:

| Metric | Purpose |
|---|---|
| Verification request count | Tracks product usage. |
| Verification success/failure count | Tracks reliability. |
| Provider failure count | Tracks dependency problems. |
| Average verification duration | Tracks user-perceived performance. |
| Upload failure count | Tracks storage or validation issues. |
| Auth failure count | Tracks suspicious login activity. |

---

## 12. C4 Architecture

The architecture is documented using C4 levels and C4 element naming conventions: people, software systems, containers, components, and external systems.

The Mermaid diagrams in this section must be opened in GitHub after every major README update. If GitHub rendering fails, PNG versions must be exported under `docs/assets/architecture/` and linked from this section.

### 12.1 C4 Level 1 — System Context

```mermaid
flowchart LR
    journalist["Person: Journalist"]
    editor["Person: Editor/Admin"]

    iaDetector["Software System: IA Detector"]

    googleFactCheck["External System: Google Fact Check Tools API"]
    aiProvider["External System: AI/OCR Provider or Mock"]
    objectStorage["External System: Object Storage"]

    journalist -->|"Submits suspicious content and reviews reports"| iaDetector
    editor -->|"Reviews cases and audit trails"| iaDetector
    iaDetector -->|"Searches evidence"| googleFactCheck
    iaDetector -->|"Extracts claim or OCR text"| aiProvider
    iaDetector -->|"Stores uploaded images"| objectStorage
```

Elements:

| Element | Type | Responsibility |
|---|---|---|
| Journalist | Person | Submits suspicious content and reviews reports. |
| Editor/Admin | Person | Reviews cases and audit trails. |
| IA Detector | Software System | Generates verification analysis reports. |
| Google Fact Check Tools API | External System | Provides fact-checking evidence. |
| AI/OCR Provider or Mock | External System | Extracts claims, OCR text, and risk hints. |
| Object Storage | External System | Stores uploaded images and screenshots. |

### 12.2 C4 Level 2 — Container Diagram

```mermaid
flowchart LR
    journalist["Person: Journalist"]
    editor["Person: Editor/Admin"]

    subgraph system["Software System: IA Detector"]
        frontend["Container: Frontend Web App"]
        backend["Container: Backend API"]
        database["Container: PostgreSQL Database"]
        storage["Container: Object Storage"]
    end

    googleFactCheck["External System: Google Fact Check Tools API"]
    aiProvider["External System: AI/OCR Provider or Mock"]

    journalist -->|"Uses"| frontend
    editor -->|"Uses"| frontend
    frontend -->|"REST/HTTPS JSON API"| backend
    backend -->|"Reads/Writes through repositories"| database
    backend -->|"Stores and reads uploaded files"| storage
    backend -->|"Queries evidence"| googleFactCheck
    backend -->|"Requests AI/OCR behavior"| aiProvider
```

Containers:

| Container | Technology | Responsibility |
|---|---|---|
| Frontend Web App | React 19, TypeScript 5, Vite 7 | Provides user interface for authentication, verification, history, and reports. |
| Backend API | NestJS 11, TypeScript 5 | Owns business workflow, APIs, auth, integrations, scoring, and persistence. |
| PostgreSQL Database | Supabase PostgreSQL | Stores users, cases, evidence, risks, audit logs, cache, and tokens. |
| Object Storage | Supabase Storage or equivalent | Stores uploaded images and screenshots. |

### 12.3 C4 Level 3 — Backend Component Diagram

```mermaid
flowchart TB
    monitoring["External: Deployment / Monitoring Check"]

    verificationController["Component: VerificationController"]
    uploadController["Component: UploadController"]
    authController["Component: AuthController"]
    auditController["Component: AuditController"]
    healthController["Component: HealthController"]

    authServices["Component: Auth Services"]
    uploadService["Component: UploadImageService"]
    createCaseService["Component: CreateVerificationCaseService"]
    inputHandlers["Component: Input Handlers"]
    claimService["Component: ClaimExtractionService"]
    evidenceService["Component: FactCheckEvidenceService"]
    riskService["Component: RiskAnalysisService"]
    scoringServices["Component: Scoring Services"]
    recommendationService["Component: EditorialRecommendationService"]
    aiAmbassador["Component: AIAmbassador"]
    repositories["Component: Repositories"]
    exceptionFilter["Component: GlobalExceptionFilter"]

    database["Container: PostgreSQL Database"]
    factCheck["External System: Google Fact Check Tools API"]
    aiProvider["External System: AI/OCR Provider or Mock"]
    storage["Container: Object Storage"]

    monitoring --> healthController
    healthController --> exceptionFilter

    verificationController --> createCaseService
    uploadController --> uploadService
    authController --> authServices
    auditController --> repositories

    createCaseService --> inputHandlers
    createCaseService --> claimService
    createCaseService --> evidenceService
    createCaseService --> riskService
    createCaseService --> scoringServices
    createCaseService --> recommendationService
    createCaseService --> repositories

    uploadService --> storage
    uploadService --> repositories
    authServices --> repositories

    inputHandlers --> aiAmbassador
    claimService --> aiAmbassador
    riskService --> aiAmbassador
    aiAmbassador --> aiProvider

    evidenceService --> factCheck
    evidenceService --> repositories
    repositories --> database

    verificationController --> exceptionFilter
    uploadController --> exceptionFilter
    authController --> exceptionFilter
    auditController --> exceptionFilter
```

Components:

| Component | Responsibility |
|---|---|
| `VerificationController` | Receives verification and history API requests. |
| `CreateVerificationCaseService` | Coordinates the verification pipeline. |
| `Input Handlers` | Convert text, URL, or image requests into `PreprocessedInput`. |
| `ClaimExtractionService` | Extracts one main claim. |
| `FactCheckEvidenceService` | Searches cache, mock evidence, or provider evidence. |
| `RiskAnalysisService` | Produces risk signals. |
| `Scoring Services` | Calculate evidence score, risk score, and source agreement. |
| `EditorialRecommendationService` | Produces recommended action and reason. |
| `AIAmbassador` | Controls AI/OCR provider boundary. |
| `Repositories` | Isolate persistence access. |
| `GlobalExceptionFilter` | Converts exceptions into safe `ErrorResponseDTO` responses. |
| `AuthController` | Receives authentication API requests for register, login, refresh, logout, and current user. |
| `UploadController` | Receives image upload requests and delegates file validation and storage. |
| `AuditController` | Receives audit trail requests and validates access through the audit service/repositories. |
| `HealthController` | Receives deployment or monitoring health check requests. |
| `Auth Services` | Handle registration, login, refresh token rotation, logout, and current user retrieval. |
| `UploadImageService` | Validates uploaded image files, stores them through object storage, and persists uploaded file metadata. |

---

## 13. UX Prototype and Testing Evidence

### 13.1 Current UX Artifacts

UX evidence is controlled: only final prototype exports and real Maze results are committed. No UX metrics are documented without participant results.

| Artifact | Link | Purpose |
|---|---|---|
| Figma Prototype | [Open Figma prototype](https://www.figma.com/design/rZvKoMlj3IDMIymKdWbDBb/IA-Detector?node-id=11-37&t=DAxirgS7FYhOJTWN-1) | Interactive prototype for the MVP flow. |
| Maze Test | [Open Maze test](https://t.maze.co/545947273) | Usability test for navigation and comprehension. |
| Prototype Assets Folder | [Open prototype assets](docs/assets/prototype/) | Final exported screens are stored here when approved. |
| UX Testing Assets Folder | [Open UX testing assets](docs/assets/ux-testing/) | Maze result evidence is stored here when participant results are available. |

### 13.2 UX Language Rules

The prototype and frontend must use editorial analysis language.

| Avoid | Use Instead |
|---|---|
| `TRUE` | `Ready for editorial review` |
| `FALSE` | `Do not publish yet` |
| `PASS` | `Ready for editorial review` |
| `NO_PASS` | `Do not publish yet` |
| `HUMAN_REVIEW` | `Needs manual review` |
| `truth score` | `evidence score` |
| `AI decision` | `analysis report` |
| `publish automatically` | `continue editorial review` |

### 13.3 Prototype Evidence Rule

The Figma prototype is the current source of truth for UI flow.

Prototype screenshots are committed only when the prototype is approved as final. This prevents outdated visual evidence from being stored in the repository.

Final screenshots must be stored in [prototype assets](docs/assets/prototype/).

### 13.4 UX Testing Evidence Rule

UX metrics must not be manually invented.

Maze results are added only after real participants complete the test. When available, exported evidence must be stored in [UX testing assets](docs/assets/ux-testing/).

### 13.5 UX Correction Traceability Rule

When Maze evidence exists, each correction must be traceable:

| Required Field | Meaning |
|---|---|
| Test finding | What users struggled with or misunderstood. |
| Correction applied | What was changed in the prototype. |
| Affected screen | Which prototype screen changed. |
| Evidence link | Link to screenshot or Maze evidence. |

No correction should be documented as applied unless the prototype was actually changed.

---

## 14. Deployment Contract

### 14.1 Current Repository Validation

The current repository contains the design contract, Prisma schema, DBML model, and validation scripts.

Current validation command:

```powershell
npm.cmd run validate
```

This command runs:

```text
prisma format && prisma validate
```

### 14.2 Target Environments

| Environment | Purpose | Notes |
|---|---|---|
| Local | Development and schema validation. | Can run with mock integrations. |
| Staging | Pre-production validation. | Uses deployed frontend/backend and staging database. |
| Production | Final deployed system. | Uses production secrets and storage. |


Mode rules by environment:

| Environment | `AI_MODE` | `FACT_CHECK_MODE` | Rule |
|---|---|---|---|
| Local | `mock` | `mock` | Development can run without external credentials. |
| Staging | `mock` or `live` | `mock` or `live` | Used to validate both deterministic and provider-backed behavior. |
| Production | `live` | `live` | Production must use live integrations unless deployment is explicitly labeled as a demo. |

### 14.3 Target Cloud Architecture

| Concern | Service |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database | Supabase PostgreSQL |
| Object storage | Supabase Storage or equivalent |
| External evidence provider | Google Fact Check Tools API |
| Version control | GitHub |
| CI/CD | GitHub Actions plus Vercel/Render deployment hooks |

### 14.4 Environment Variables

| Variable | Used By | Required In | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Prisma / Backend | Local, staging, production | PostgreSQL connection string. |
| `FRONTEND_URL` | Backend | Local, staging, production | CORS and redirect validation. |
| `BACKEND_URL` | Frontend | Local, staging, production | API base URL. |
| `JWT_ACCESS_SECRET` | Backend | Local, staging, production | Signs access tokens. |
| `JWT_REFRESH_SECRET` | Backend | Local, staging, production | Signs refresh tokens. |
| `SUPABASE_URL` | Backend | Local, staging, production | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Local, staging, production | Backend-only Supabase service key. |
| `SUPABASE_STORAGE_BUCKET` | Backend | Local, staging, production | Upload bucket name. |
| `FACT_CHECK_MODE` | Backend | Local, staging, production | `mock` or `live`. |
| `GOOGLE_FACT_CHECK_API_KEY` | Backend | Staging, production if live mode | Google Fact Check API key. |
| `FACT_CHECK_TIMEOUT_SECONDS` | Backend | Local, staging, production | Provider timeout. |
| `FACT_CHECK_MAX_RETRIES` | Backend | Local, staging, production | Provider retry count. |
| `FACT_CHECK_CACHE_TTL_MINUTES` | Backend | Local, staging, production | Cache duration. |
| `AI_MODE` | Backend | Local, staging, production | `mock` or `live`. |
| `AI_TIMEOUT_SECONDS` | Backend | Local, staging, production | AI/OCR timeout. |
| `AI_MAX_RETRIES` | Backend | Local, staging, production | AI/OCR retry count. |
| `MAX_IMAGE_SIZE_MB` | Backend | Local, staging, production | Upload validation limit. |

### 14.5 CI/CD Pipeline Contract

When implementation code exists, CI/CD must run the following stages:

| Stage | Required Check |
|---|---|
| Install | Dependencies install successfully. |
| Validate | Prisma validation succeeds. |
| Typecheck | TypeScript typecheck succeeds. |
| Test | Unit and integration tests pass. |
| Build | Frontend and backend build successfully. |
| Deploy | Deployment runs only after previous checks pass. |
| Smoke Test | Health check and main user flow pass after deployment. |

### 14.6 Deployment Acceptance Rules

| Rule | Requirement |
|---|---|
| Secrets | `.env` must not be committed. |
| Dependencies | `node_modules/` must not be committed. |
| Database | Prisma schema must validate before backend deployment. |
| Migrations | Production deployment must run migrations before starting backend. |
| Health Check | Backend must expose `GET /api/health`. |
| Smoke Test | After deployment, run login, create verification, open history, and open detail. |
| Rollback | Roll back if health check fails, authentication fails, or verification creation fails. |

---

## 15. QA and Acceptance Criteria

### 15.1 Functional Acceptance Criteria

| ID | Scenario | Acceptance Criteria |
|---|---|---|
| AC-01 | Register user | Given valid registration data, backend creates user and returns `201`. |
| AC-02 | Login user | Given valid credentials, backend returns access token and user summary. |
| AC-03 | Refresh session | Given valid refresh token cookie, backend returns new access token. |
| AC-04 | Logout user | Given authenticated user, backend revokes refresh token and returns `204`. |
| AC-05 | Upload image | Given valid image under 5 MB, backend stores file metadata and returns `uploadedFileId`. |
| AC-06 | Submit text verification | Given valid text, backend returns completed analysis report. |
| AC-07 | Submit URL verification | Given valid URL, backend returns completed or partial analysis report. |
| AC-08 | Submit image verification | Given owned `uploadedFileId`, backend returns completed or partial analysis report. |
| AC-09 | Unauthorized file access | Given another user's `uploadedFileId`, backend returns `403`. |
| AC-10 | No evidence found after successful search | Backend returns `DO_NOT_PUBLISH_YET` when `providerStatus=SUCCESS`, `cacheStatus=MISS`, and no relevant evidence exists. |
| AC-11 | Provider failure | Backend returns partial report when possible and includes `PROVIDER_UNAVAILABLE` risk signal. |
| AC-12 | History | User sees only own verification cases. |
| AC-13 | Case detail | User can open own case and see evidence, risk signals, scores, recommendation, and audit trail. |
| AC-14 | Audit trail | Case contains required audit events in chronological order. |
| AC-15 | Health check | `GET /api/health` returns `200` and status `ok`. |

### 15.2 Quality Attribute Scenarios

| Attribute | Scenario | Expected System Response |
|---|---|---|
| Performance | User submits a text verification in mock mode. | Report is generated in under 5 seconds under normal local conditions. |
| Reliability | Fact-check provider fails and no cache exists. | System returns a partial report with `PROVIDER_UNAVAILABLE` and `NEEDS_MANUAL_REVIEW`, unless a stronger rule applies. |
| Security | User attempts to open another user's case. | Backend returns `403 FORBIDDEN_RESOURCE`. |
| Usability | User receives `DO_NOT_PUBLISH_YET`. | UI shows recommendation reason, evidence context, and risk signals. |
| Maintainability | A new input type is added later. | A new input handler is added without changing scoring or recommendation services. |
| Observability | Provider call fails. | Backend logs provider status, `traceId`, and case context without exposing secrets. |
| Testability | Scoring rules change. | Scoring services can be unit-tested independently from controllers and providers. |

### 15.3 Backend Unit Tests

| Test                                        | Expected Result                                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| High evidence, low risk, high agreement     | `READY_FOR_EDITORIAL_REVIEW`.                                                                                                 |
| Low evidence after successful search        | `DO_NOT_PUBLISH_YET`.                                                                                                         |
| Medium evidence and medium agreement        | `NEEDS_MANUAL_REVIEW`.                                                                                                        |
| High risk                                   | `DO_NOT_PUBLISH_YET`.                                                                                                         |
| Strong contradiction                        | `DO_NOT_PUBLISH_YET`.                                                                                                         |
| Successful search with no relevant evidence | `NO_RELEVANT_EVIDENCE` is emitted and recommendation follows the no-evidence rule from section 3.10.                          |
| Provider unavailable with no cache          | `PROVIDER_UNAVAILABLE` is emitted, `NO_RELEVANT_EVIDENCE` is not emitted, and recommendation follows provider-degraded rules. |
| Provider unavailable with stale cache       | Stale cached evidence is used only as fallback and provider degradation context is visible.                                   |
| Fresh cache hit                             | Provider is not called and cached evidence is used.                                                                           |
| Cache miss                                  | Provider or mock client is called.                                                                                            |
| Expired cache with provider available       | Provider or mock client is called again.                                                                                      |
| OCR uncertainty                             | `RiskAnalysisService` adds `OCR_UNCERTAINTY`.                                                                                 |
| Evidence score below 0 or above 100         | Score is clamped to 0–100.                                                                                                    |
| Evidence score decimal result               | Score is rounded to the nearest integer and clamped to 0–100.                                                                 |
| Risk score decimal result                   | Score is rounded to the nearest integer and capped at 100.                                                                    |
| Duplicate risk signals                      | Duplicate signal types are merged before calculating `riskScore`.                                                             |
| Evidence search result statuses             | Recommendation logic receives both `providerStatus` and `cacheStatus`.                                                        |
| Repository isolation                        | Application services do not import Prisma directly.                                                                           |

### 15.4 API Integration Tests

| Endpoint | Test |
|---|---|
| `GET /api/health` | Returns `200` and status `ok`. |
| `POST /api/auth/register` | Creates user and rejects duplicate email. |
| `POST /api/auth/login` | Authenticates valid user and rejects invalid credentials. |
| `POST /api/auth/refresh` | Returns new access token when refresh token is valid. |
| `POST /api/auth/logout` | Revokes refresh token and prevents reuse. |
| `POST /api/uploads/image` | Accepts JPEG/PNG/WEBP under 5 MB and rejects unsupported files. |
| `POST /api/uploads/image` | File larger than 5 MB returns `413 FILE_TOO_LARGE`. |
| `POST /api/verifications` | Creates complete report for text, URL, and image. |
| `POST /api/verifications` | Stores failed case when claim extraction fails after case creation. |
| `GET /api/verifications` | Returns only current user's cases. |
| `GET /api/verifications/:caseId` | Rejects unauthorized access. |
| `GET /api/audit/:caseId` | Returns ordered audit events and rejects unauthorized access. |
| Error responses | All typed API errors include `traceId`, `statusCode`, `errorCode`, and `message`. |
| Rate limit exceeded | Protected endpoints return `429 RATE_LIMIT_EXCEEDED`. |
| CORS restricted origin | Requests from unknown origins are rejected by backend CORS policy. |

### 15.5 Frontend Tests

| Page | Test |
|---|---|
| `/login` | Required fields and invalid credentials are handled. |
| `/register` | Required fields and duplicate email are handled. |
| `/app` | Text, URL, and image validation works. |
| `/app` | Image flow uploads file before creating verification. |
| `/app/verification/:caseId` | Report renders recommendation, scores, evidence, risk signals, and audit trail. |
| `/app/verification/:caseId` | Partial report warning is shown when provider or OCR risk signals exist. |
| `/app/history` | Empty state and table state render correctly. |
| Protected routes | Unauthenticated user is redirected to `/login`. |

### 15.6 Security and Observability Tests

| Test | Expected Result |
|---|---|
| Access another user's case | Returns `403`. |
| Access another user's audit trail | Returns `403`. |
| Use another user's uploaded file | Returns `403`. |
| Upload unsupported file | Returns `400`. |
| Error response | Does not expose stack trace, secrets, or raw provider error. |
| Audit log metadata | Does not store passwords, tokens, API keys, or raw file contents. |
| Provider failure | Logs provider failure with `traceId`. |
| Health check | Returns status without exposing secrets. |
| Rate limit exceeded | Returns `429 RATE_LIMIT_EXCEEDED`. |
| CORS restricted origin | Requests from unknown origins are rejected. |
| Duplicate risk signal attempt | Duplicate risk signal types are not counted twice. |
| Provider unavailable with stale cache | Response includes provider degradation context and uses stale cache only as fallback. |
| Provider unavailable with no cache | Response includes `PROVIDER_UNAVAILABLE` and does not include `NO_RELEVANT_EVIDENCE`. |
| Fact-check stale cache fallback | Expired cache is used only when provider is unavailable and response includes provider degradation context. |
| Structured logs include cache status | Logs include `cacheStatus` when evidence search is executed. |

### 15.7 Smoke Test

Before review or deployment, manually verify:

```text
1. Register a user.
2. Log in.
3. Submit a text verification.
4. Confirm report displays extracted claim, scores, evidence, risks, and recommendation.
5. Submit a URL verification.
6. Upload an image and submit image verification.
7. Open history.
8. Open case detail.
9. Open audit trail.
10. Confirm no forbidden absolute-truth product labels appear in UI.
```

---

## 16. Repository Structure and Validation

### 16.1 Current Repository Structure

```text
caso2-ia-detector/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── prisma.config.ts
│
├── docs/
│   └── assets/
│       ├── prototype/
│       │   └── .gitkeep
│       │
│       └── ux-testing/
│           └── .gitkeep
│
├── database/
│   └── dbml/
│       └── ia-detector.dbml
│
└── prisma/
    └── schema.prisma
```

### 16.2 Supporting Artifacts

| Artifact | Link |
|---|---|
| Prisma schema | [Open Prisma schema](prisma/schema.prisma) |
| DBML model | [Open DBML model](database/dbml/ia-detector.dbml) |
| Prototype assets | [Open prototype assets folder](docs/assets/prototype/) |
| UX testing assets | [Open UX testing assets folder](docs/assets/ux-testing/) |

### 16.3 Files That Must Not Be Committed

```text
.env
node_modules/
```

If a clean ZIP is required, generate it from Git instead of compressing the local folder:

```powershell
git archive --format=zip --output caso2-ia-detector-clean.zip HEAD
```

### 16.4 Local Environment Variable for Prisma

Prisma reads the database URL from `prisma.config.ts`.

Before validating locally, define:

```powershell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/ia_detector"
```

### 16.5 Validation Commands

Run:

```powershell
npm.cmd run validate
```

Expected result:

```text
Prisma schema loaded from prisma\schema.prisma.
Formatted prisma\schema.prisma
The schema at prisma\schema.prisma is valid
```

### 16.6 Grep Checks

These checks exclude `README.md` because this document intentionally mentions forbidden labels and deprecated terms to define what must not appear in product code, product UI, or supporting implementation artifacts.

Run:

```powershell
git grep -n "PASS\|NO_PASS\|HUMAN_REVIEW" -- ':!README.md'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "AI_DECISION_COMPLETED" -- ':!README.md'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "Pending\|pending\|goal-map\|Goal Map\|mvp-scope.md\|problem-statement.md\|frontend-design.md\|ux-testing-results.md" -- ':!README.md'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "Stores metadata for images or screenshots. Stores metadata" -- ':!README.md'
```

Expected result:

```text
No output.
```

### 16.7 Git Status Check

Before committing, run:

```powershell
git status
```

Confirm that these are not staged:

```text
.env
node_modules/
```

### 16.8 Documentation Review Checklist

Before sending for review:

| Check | Expected Result |
|---|---|
| README opens correctly in GitHub. | No broken rendering in headings, tables, or diagrams. |
| Table of contents links work. | Each link navigates to the correct section. |
| Mentioned files exist or are explicitly described as controlled future evidence. | No dead links to non-existing PNG files. |
| Mermaid diagrams render. | If not, create `docs/assets/architecture/`, export PNG versions, and link existing PNG files only. |
| Technology versions are present. | Frontend and backend technology tables include versions. |
| API contracts are complete. | Each endpoint includes method, path, auth, controller, service, request, response, errors, reads, and writes. |
| Data model is useful. | Each table includes purpose, endpoint usage, columns, constraints, relationships, and indexes. |
| Patterns are applied. | Each pattern includes context, problem, forces, solution, participants, collaborations, rules, consequences, and location. |
| QA is testable. | Acceptance criteria and tests are concrete. |
| Product language avoids absolute truth labels. | UI and implementation artifacts do not use forbidden labels as product states. |
| Cache fallback rules are consistent. | `STALE_HIT` is allowed only as provider-failure fallback, and normal expired cache is not treated as fresh evidence. |
| README render is validated in GitHub. | Tables, Mermaid diagrams, internal anchors, and relative links render correctly. |