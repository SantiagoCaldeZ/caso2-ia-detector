# Database Design Document — IA Detector

## Purpose

This document defines the database design for **IA Detector**.

The database must support the MVP verification flow:

1. A journalist submits suspicious text, URL, image, or screenshot.
2. The backend creates a verification case.
3. The backend extracts the main claim.
4. The backend searches evidence or previous fact-checking results.
5. The backend calculates `evidenceScore`, `riskScore`, and `sourceAgreement`.
6. The backend classifies the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
7. The backend stores the case, evidence, risk signals, uploaded file references, and audit logs.
8. The frontend displays the result and history.

This document is written for the development team. Each table includes responsibilities, fields, relationships, rules, indexes, and implementation notes.

---

## Database Technology Decisions

| Area | Decision |
|---|---|
| Database engine | PostgreSQL |
| ORM | Prisma |
| ID strategy | UUID primary keys |
| Timestamp strategy | `createdAt`, `updatedAt`, and optional `deletedAt` where needed |
| Soft delete | Used only for uploaded files and users if required |
| Audit strategy | Append-only `audit_logs` table |
| Cache strategy | Database-backed cache for fact-check results in MVP |
| Migration strategy | Prisma migrations |
| Seed strategy | Deterministic seed data for local MVP demo |

---

## Main Entities

| Entity | Purpose |
|---|---|
| `users` | Stores registered users and roles. |
| `refresh_tokens` | Stores hashed refresh tokens for session management. |
| `verification_cases` | Stores each verification request and its final classification. |
| `evidence_results` | Stores evidence sources found for a verification case. |
| `risk_signals` | Stores risk indicators detected during analysis. |
| `uploaded_files` | Stores metadata for images or screenshots uploaded by users. |
| `audit_logs` | Stores traceable events for verification and security actions. |
| `fact_check_cache` | Stores cached fact-check provider results for repeated claims. |

---

## Entity Relationship Overview

```text
users
  ├── refresh_tokens
  ├── verification_cases
  ├── uploaded_files
  └── audit_logs

verification_cases
  ├── evidence_results
  ├── risk_signals
  ├── audit_logs
  └── uploaded_files optional reference

fact_check_cache
  └── reused by FactCheckEvidenceService
```

---

## Enums

### UserRole

```ts
enum UserRole {
  JOURNALIST
  ADMIN
}
```

### UserStatus

```ts
enum UserStatus {
  ACTIVE
  DISABLED
}
```

### VerificationInputType

```ts
enum VerificationInputType {
  TEXT
  URL
  IMAGE
}
```

### VerificationStatus

```ts
enum VerificationStatus {
  CREATED
  PROCESSING
  PASS
  NO_PASS
  HUMAN_REVIEW
  FAILED
}
```

### SourceAgreement

```ts
enum SourceAgreement {
  HIGH
  MEDIUM
  LOW
}
```

### RiskSeverity

```ts
enum RiskSeverity {
  LOW
  MEDIUM
  HIGH
}
```

### RiskSignalType

```ts
enum RiskSignalType {
  NO_SOURCE
  EMOTIONAL_LANGUAGE
  CONTRADICTORY_EVIDENCE
  LOW_SOURCE_AGREEMENT
  OCR_UNCERTAINTY
  PROVIDER_UNAVAILABLE
}
```

### AuditEventType

```ts
enum AuditEventType {
  USER_LOGIN
  USER_LOGOUT
  VERIFICATION_CREATED
  CLAIM_EXTRACTED
  EVIDENCE_SEARCH_COMPLETED
  RISK_ANALYSIS_COMPLETED
  AI_DECISION_COMPLETED
  VERIFICATION_FAILED
  IMAGE_UPLOADED
  HISTORY_OPENED
  AUDIT_LOG_VIEWED
}
```

---

# Table Design

---

## 1. `users`

### Purpose

Stores user accounts for journalists and admins.

### Source code mapping

| Layer | Location |
|---|---|
| Domain entity | `/src/backend/domain/users/User.ts` |
| Repository | `/src/backend/infrastructure/persistence/repositories/UserRepository.ts` |
| Auth controller | `/src/backend/api/controllers/AuthController.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `email` | VARCHAR(255) | Yes | Unique. Used for login. |
| `name` | VARCHAR(150) | Yes | Display name. |
| `passwordHash` | TEXT | Yes | Never store plain password. |
| `role` | UserRole | Yes | `JOURNALIST` or `ADMIN`. |
| `status` | UserStatus | Yes | Default: `ACTIVE`. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |
| `updatedAt` | TIMESTAMP | Yes | Updated timestamp. |
| `deletedAt` | TIMESTAMP | No | Optional soft delete. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `users_email_unique` | `email` | Login lookup and uniqueness. |
| `users_role_idx` | `role` | Admin filtering if needed. |

### Rules

- `email` must be unique.
- `passwordHash` must never be returned to frontend.
- Disabled users cannot create verification cases.
- Only `ADMIN` can view all verification cases.

---

## 2. `refresh_tokens`

### Purpose

Stores hashed refresh tokens for secure session renewal.

### Source code mapping

| Layer | Location |
|---|---|
| Repository | `/src/backend/infrastructure/persistence/repositories/UserRepository.ts` |
| Auth controller | `/src/backend/api/controllers/AuthController.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `userId` | UUID | Yes | FK to `users.id`. |
| `tokenHash` | TEXT | Yes | Store hash only, never raw token. |
| `expiresAt` | TIMESTAMP | Yes | Token expiration date. |
| `revokedAt` | TIMESTAMP | No | Set on logout or rotation. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `refresh_tokens_user_id_idx` | `userId` | Find active tokens by user. |
| `refresh_tokens_token_hash_idx` | `tokenHash` | Validate refresh token. |

### Rules

- Raw refresh tokens must never be stored.
- When a refresh token is rotated, the previous token must be revoked.
- Expired or revoked tokens cannot be used.

---

## 3. `uploaded_files`

### Purpose

Stores metadata for images and screenshots uploaded for verification.

The file itself is stored locally in the MVP under:

```text
/storage/uploads
```

The database stores only metadata and file path.

### Source code mapping

| Layer | Location |
|---|---|
| Upload controller | `/src/backend/api/controllers/UploadController.ts` |
| Storage service | `/src/backend/infrastructure/storage/LocalFileStorageService.ts` |
| Domain model | `/src/backend/domain/verification/UploadedFile.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `ownerUserId` | UUID | Yes | FK to `users.id`. |
| `originalFileName` | VARCHAR(255) | Yes | Original uploaded file name. |
| `mimeType` | VARCHAR(100) | Yes | Allowed: `image/jpeg`, `image/png`, `image/webp`. |
| `sizeBytes` | INTEGER | Yes | Must be <= 5 MB for MVP. |
| `storagePath` | TEXT | Yes | Local path to stored file. |
| `sha256Hash` | VARCHAR(64) | Yes | Used to detect duplicate files. |
| `createdAt` | TIMESTAMP | Yes | Upload timestamp. |
| `deletedAt` | TIMESTAMP | No | Optional soft delete. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `uploaded_files_owner_idx` | `ownerUserId` | List files by user. |
| `uploaded_files_hash_idx` | `sha256Hash` | Detect duplicate upload. |

### Rules

- Only `.jpg`, `.png`, and `.webp` are allowed.
- Maximum file size is 5 MB.
- The frontend must receive a `fileId`, not a raw file path.
- File paths must not expose server folder structure to frontend.
- Real deepfake detection is out of scope.

---

## 4. `verification_cases`

### Purpose

Stores the main verification record.

Each submitted text, URL, image, or screenshot creates one verification case.

### Source code mapping

| Layer | Location |
|---|---|
| Domain entity | `/src/backend/domain/verification/VerificationCase.ts` |
| Repository | `/src/backend/infrastructure/persistence/repositories/VerificationRepository.ts` |
| Service | `/src/backend/application/verification/CreateVerificationCaseService.ts` |
| Controller | `/src/backend/api/controllers/VerificationController.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `userId` | UUID | Yes | FK to `users.id`. |
| `inputType` | VerificationInputType | Yes | `TEXT`, `URL`, or `IMAGE`. |
| `rawInput` | TEXT | No | Stores text or URL input. Null for image-only cases. |
| `uploadedFileId` | UUID | No | FK to `uploaded_files.id`. Required when `inputType = IMAGE`. |
| `extractedClaim` | TEXT | No | Main claim extracted by AI or mock. |
| `status` | VerificationStatus | Yes | Current state or final classification. |
| `evidenceScore` | INTEGER | No | 0–100. Required after processing. |
| `riskScore` | INTEGER | No | 0–100. Required after processing. |
| `sourceAgreement` | SourceAgreement | No | `HIGH`, `MEDIUM`, or `LOW`. |
| `decisionReason` | TEXT | No | Reason returned by `AIDecisionGate`. |
| `errorCode` | VARCHAR(100) | No | Set if processing fails. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |
| `updatedAt` | TIMESTAMP | Yes | Updated timestamp. |
| `completedAt` | TIMESTAMP | No | Set when final status is reached. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `verification_cases_user_created_idx` | `userId`, `createdAt` | User history listing. |
| `verification_cases_status_idx` | `status` | Filter by classification. |
| `verification_cases_file_idx` | `uploadedFileId` | Link image upload to verification case. |

### Rules

- `TEXT` and `URL` cases must include `rawInput`.
- `IMAGE` cases must include `uploadedFileId`.
- `PASS` cannot be saved if `evidenceScore` is null.
- `PASS` cannot be saved if `evidenceScore < 75`.
- `PASS` cannot be saved if `riskScore > 35`.
- `PASS` cannot be saved if `sourceAgreement != HIGH`.
- `NO_PASS` must include `decisionReason`.
- `HUMAN_REVIEW` must include `decisionReason`.
- The backend must never store final status as `TRUE` or `FALSE`.

---

## 5. `evidence_results`

### Purpose

Stores evidence sources found for a verification case.

Evidence can come from Google Fact Check Tools API or mock responses.

### Source code mapping

| Layer | Location |
|---|---|
| Domain entity | `/src/backend/domain/evidence/EvidenceResult.ts` |
| Repository | `/src/backend/infrastructure/persistence/repositories/EvidenceRepository.ts` |
| Service | `/src/backend/application/evidence/FactCheckEvidenceService.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `verificationCaseId` | UUID | Yes | FK to `verification_cases.id`. |
| `sourceName` | VARCHAR(255) | Yes | Publisher or evidence provider. |
| `title` | TEXT | Yes | Evidence title. |
| `url` | TEXT | Yes | Source URL. |
| `rating` | VARCHAR(255) | No | Provider rating if available. |
| `claimReviewed` | TEXT | No | Claim text reviewed by evidence source. |
| `relevanceScore` | INTEGER | Yes | 0–100 relevance score. |
| `publishedAt` | TIMESTAMP | No | Source publication date. |
| `provider` | VARCHAR(100) | Yes | Example: `GOOGLE_FACT_CHECK`, `MOCK`. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `evidence_case_idx` | `verificationCaseId` | Load evidence for result page. |
| `evidence_url_idx` | `url` | Avoid duplicates per case. |
| `evidence_provider_idx` | `provider` | Debug provider behavior. |

### Rules

- Evidence URLs must be sanitized before storing.
- Duplicate evidence URLs for the same case must be ignored.
- Evidence must not directly decide final classification.
- Evidence contributes to `evidenceScore` and `sourceAgreement`.

---

## 6. `risk_signals`

### Purpose

Stores structured risk indicators detected during verification.

### Source code mapping

| Layer | Location |
|---|---|
| Domain entity | `/src/backend/domain/risk/RiskSignal.ts` |
| Repository | `/src/backend/infrastructure/persistence/repositories/RiskSignalRepository.ts` |
| Service | `/src/backend/application/risk/RiskAnalysisService.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `verificationCaseId` | UUID | Yes | FK to `verification_cases.id`. |
| `type` | RiskSignalType | Yes | Type of risk signal. |
| `severity` | RiskSeverity | Yes | `LOW`, `MEDIUM`, or `HIGH`. |
| `description` | TEXT | Yes | Human-readable explanation. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `risk_signals_case_idx` | `verificationCaseId` | Load risks for result page. |
| `risk_signals_type_idx` | `type` | Analyze common risk patterns. |

### Rules

- At least one risk signal must be stored when:
  - no evidence is found,
  - sources contradict each other,
  - provider is unavailable,
  - OCR extraction is uncertain,
  - `riskScore > 60`.
- Risk signals must be shown on the result page.
- Risk signals must not contain secrets or provider API details.

---

## 7. `audit_logs`

### Purpose

Stores append-only audit events.

This table is used for traceability, debugging, security, and course evaluation.

### Source code mapping

| Layer | Location |
|---|---|
| Domain entity | `/src/backend/domain/audit/AuditEvent.ts` |
| Repository | `/src/backend/infrastructure/persistence/repositories/AuditLogRepository.ts` |
| Controller | `/src/backend/api/controllers/HistoryController.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `userId` | UUID | No | FK to `users.id`. Null for system events. |
| `verificationCaseId` | UUID | No | FK to `verification_cases.id`. |
| `eventType` | AuditEventType | Yes | Event name. |
| `traceId` | VARCHAR(100) | Yes | Request trace ID. |
| `metadata` | JSONB | No | Sanitized event details. |
| `createdAt` | TIMESTAMP | Yes | Event timestamp. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `audit_case_idx` | `verificationCaseId` | Load audit events for one case. |
| `audit_user_idx` | `userId` | Load user-related events. |
| `audit_trace_idx` | `traceId` | Debug one request flow. |
| `audit_event_type_idx` | `eventType` | Filter by event type. |

### Rules

- Audit logs are append-only.
- Audit logs must never store API keys, refresh tokens, passwords, or raw secrets.
- Every verification case must create at least:
  - `VERIFICATION_CREATED`
  - `CLAIM_EXTRACTED` or failure event
  - `AI_DECISION_COMPLETED` or `VERIFICATION_FAILED`
- Admins can view all audit logs.
- Journalists can view audit logs only for their own cases.

---

## 8. `fact_check_cache`

### Purpose

Stores cached fact-check search results for repeated normalized claims.

This supports the `FactCheckEvidenceService` and reduces repeated provider calls.

### Source code mapping

| Layer | Location |
|---|---|
| Repository | `/src/backend/infrastructure/persistence/repositories/FactCheckCacheRepository.ts` |
| Service | `/src/backend/application/evidence/FactCheckEvidenceService.ts` |

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key. |
| `cacheKey` | VARCHAR(255) | Yes | Unique hash of normalized claim. |
| `normalizedClaim` | TEXT | Yes | Claim after normalization. |
| `provider` | VARCHAR(100) | Yes | Example: `GOOGLE_FACT_CHECK`, `MOCK`. |
| `responseData` | JSONB | Yes | Sanitized provider response or mapped DTO. |
| `expiresAt` | TIMESTAMP | Yes | Cache expiration. |
| `createdAt` | TIMESTAMP | Yes | Created timestamp. |
| `updatedAt` | TIMESTAMP | Yes | Updated timestamp. |

### Indexes

| Index | Fields | Reason |
|---|---|---|
| `fact_check_cache_key_unique` | `cacheKey` | Cache lookup. |
| `fact_check_cache_expires_idx` | `expiresAt` | Cleanup expired cache. |
| `fact_check_cache_provider_idx` | `provider` | Debug provider cache behavior. |

### Rules

- Cache TTL for MVP is 60 minutes.
- Expired cache entries must not be used.
- Cache key must be generated from normalized claim.
- Cache must not store API keys or raw secrets.
- Cache miss triggers provider or mock call.
- Cache failure must not crash the verification flow.

---

# Data Integrity Rules

## Required Relationships

| Relationship | Rule |
|---|---|
| `users` → `verification_cases` | A user can have many verification cases. |
| `users` → `uploaded_files` | A user can upload many files. |
| `verification_cases` → `evidence_results` | A case can have many evidence results. |
| `verification_cases` → `risk_signals` | A case can have many risk signals. |
| `verification_cases` → `audit_logs` | A case can have many audit events. |
| `verification_cases` → `uploaded_files` | A case may reference one uploaded file. |
| `users` → `refresh_tokens` | A user can have many refresh tokens. |

---

## Deletion Rules

| Entity | Rule |
|---|---|
| `users` | Prefer soft delete or disable account using `status = DISABLED`. |
| `refresh_tokens` | Delete or revoke when expired. |
| `verification_cases` | Do not delete during MVP; preserve history. |
| `evidence_results` | Cascade delete only if a verification case is deleted in development. |
| `risk_signals` | Cascade delete only if a verification case is deleted in development. |
| `audit_logs` | Never delete manually in application flow. |
| `uploaded_files` | Soft delete metadata and remove local file only through storage service. |
| `fact_check_cache` | Expired rows can be cleaned by scheduled job later. |

---

## Security Rules

- Passwords must be stored only as hashes.
- Refresh tokens must be stored only as hashes.
- API keys must not be stored in the database.
- Uploaded file paths must not expose absolute server paths to frontend.
- Audit metadata must be sanitized before insert.
- Provider responses stored in cache must not include credentials.
- Journalists can only access their own verification cases.
- Admins can access all verification cases.

---

## Seed Data Requirements

Seed data must support local demo scenarios.

Required demo users:

| Email | Role | Purpose |
|---|---|---|
| `journalist@iadetector.local` | `JOURNALIST` | Main demo user. |
| `admin@iadetector.local` | `ADMIN` | Admin audit/history demo. |

Required demo verification cases:

| Case | Input type | Expected status |
|---|---|---|
| Reliable evidence case | `TEXT` | `PASS` |
| Low evidence risky case | `URL` | `NO_PASS` |
| Screenshot partial evidence case | `IMAGE` | `HUMAN_REVIEW` |

Required seed files:

```text
database/seed/users.seed.ts
database/seed/verification-cases.seed.ts
database/seed/evidence-results.seed.ts
database/seed/risk-signals.seed.ts
database/seed/audit-logs.seed.ts
```

---

## Migration Rules

- All database changes must be created through Prisma migrations.
- Manual database changes are not allowed unless documented.
- Every migration must include a clear name.
- Migrations must be committed to the repository.
- Breaking schema changes must update:
  - backend DTOs,
  - Prisma schema,
  - DBML,
  - backend design document,
  - frontend API contract if affected.

---

## Acceptance Criteria

The database design is implemented correctly when:

- users can authenticate with stored password hashes,
- refresh tokens are stored as hashes,
- a verification case can store text, URL, or image-based input,
- image cases can reference uploaded file metadata,
- each verification case can store evidence results,
- each verification case can store risk signals,
- each verification case can store audit logs,
- fact-check results can be cached by normalized claim,
- user history can be queried efficiently,
- admin audit access can be supported,
- no table stores final labels as `TRUE` or `FALSE`,
- MVP seed data supports `PASS`, `NO_PASS`, and `HUMAN_REVIEW` demo flows.