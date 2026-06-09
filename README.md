# IA Detector — Software Design Document

IA Detector is an editorial verification assistant for journalists and editorial teams.

The system helps reduce the time required to review suspicious digital content before publication. It does not decide whether information is absolutely true or false. Instead, it generates an evidence-based analysis report with extracted claims, evidence, source agreement, risk signals, scores, and a recommended editorial action.

This `README.md` is the main design document for the project. It contains the product scope, UX evidence, architecture, frontend design, backend design, data design, integrations, security, deployment, quality controls, and implementation structure.

---

## 1. Problem Statement

**Reduce the time to confirm truthfully information.**

---

## 2. Product Definition

Journalists often receive urgent information through social media, websites, screenshots, images, messages, or forwarded claims. Before publishing, they need to review whether the information has reliable evidence, whether sources agree, and whether there are risk signals that require caution.

IA Detector reduces verification time by organizing the review process into one workflow:

1. The journalist submits suspicious content.
2. The system extracts the main claim.
3. The system searches for supporting or contradictory evidence.
4. The system identifies risk signals.
5. The system calculates evidence and risk indicators.
6. The system generates an editorial analysis report.
7. The system stores the case in verification history.

The system supports human editorial judgment. It does not replace the journalist or editor.

---

## 3. MVP Scope

### 3.1 Included in the MVP

| Feature                     | Description                                           | Developer Notes                                                             |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Authentication              | Users log in before using the tool.                   | Required because verification history belongs to a user.                    |
| Text analysis               | User submits suspicious text.                         | Backend extracts the claim directly from text.                              |
| URL analysis                | User submits a suspicious URL.                        | Backend stores the URL and extracts or simulates claim content for the MVP. |
| Image / screenshot analysis | User uploads an image or screenshot.                  | MVP uses OCR mock behavior, not full image forensics.                       |
| Claim extraction            | System extracts the main claim.                       | Implemented through `ClaimExtractionService`.                               |
| Evidence search             | System searches for related fact-check evidence.      | Uses Google Fact Check Tools API or deterministic mock data.                |
| Risk analysis               | System detects warning signals.                       | Implemented through `RiskAnalysisService`.                                  |
| Evidence score              | System calculates the strength of available evidence. | Numeric value from 0 to 100.                                                |
| Risk score                  | System calculates risk level.                         | Numeric value from 0 to 100.                                                |
| Source agreement            | System summarizes whether reviewed sources agree.     | Values: `HIGH`, `MEDIUM`, `LOW`.                                            |
| Editorial recommendation    | System recommends the next editorial action.          | Recommendation is not a truth verdict.                                      |
| Verification history        | User can view previous cases.                         | Required for continuity of editorial review.                                |
| Case detail                 | User can reopen a previous case.                      | Shows evidence, risk signals, scores, and recommendation.                   |
| Audit log                   | System stores key workflow events.                    | Used for traceability and debugging.                                        |
| Local deterministic demo    | MVP can run with mock AI/OCR/evidence.                | Avoids dependency on external credentials during demo.                      |

### 3.2 Excluded from the MVP

| Excluded Item                   | Reason                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Real video analysis             | Requires video processing and media forensics outside MVP scope.             |
| Real deepfake detection         | Requires specialized models and validation outside MVP scope.                |
| Automatic publishing            | The system supports verification, not publication.                           |
| Full newsroom collaboration     | Comments, approvals, assignments, and multi-user workflows are future scope. |
| Browser extension               | MVP is a web application.                                                    |
| Mobile app                      | MVP targets desktop web usage.                                               |
| Real-time collaborative editing | Not required for first implementation.                                       |

---

## 4. Users and Roles

| Role           | Description                                                       | Permissions                                                                        |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Journalist     | Main user who reviews suspicious content before publication.      | Create verification cases, upload images, view own history, open own case details. |
| Editor / Admin | Supervisory role for future editorial review and quality control. | View cases, review audit logs, and supervise verification quality.                 |

The MVP focuses on the journalist role. The editor/admin role is included in the backend and data model so it can be enabled without redesigning the system.

---

## 5. Main Workflow

```text
Journalist logs in
        ↓
Journalist opens verification dashboard
        ↓
Journalist submits text, URL, image, or screenshot
        ↓
Backend creates verification case
        ↓
Backend extracts the main claim
        ↓
Backend searches evidence
        ↓
Backend detects risk signals
        ↓
Backend calculates evidence score, risk score, and source agreement
        ↓
Backend generates editorial analysis report
        ↓
Frontend displays recommendation, evidence, scores, and risk signals
        ↓
Case is stored in verification history
```

---

## 6. Editorial Analysis Report

IA Detector produces a **Verification Analysis Report**.

It does not produce a final truth label.

### 6.1 Report Fields

| Field                  | Type   | Description                                      |
| ---------------------- | ------ | ------------------------------------------------ |
| `caseId`               | UUID   | Unique verification case identifier.             |
| `inputType`            | enum   | `TEXT`, `URL`, or `IMAGE`.                       |
| `originalInputPreview` | string | Safe preview of submitted content.               |
| `extractedClaim`       | string | Main claim extracted from the submitted content. |
| `evidenceScore`        | number | Strength of evidence from 0 to 100.              |
| `riskScore`            | number | Risk level from 0 to 100.                        |
| `sourceAgreement`      | enum   | `HIGH`, `MEDIUM`, or `LOW`.                      |
| `recommendedAction`    | enum   | Next editorial action suggested by the system.   |
| `evidence`             | array  | Evidence sources reviewed by the system.         |
| `riskSignals`          | array  | Warning signals found during analysis.           |
| `auditTrail`           | array  | Traceable events generated during processing.    |

### 6.2 Recommended Editorial Actions

| Recommended Action           | Meaning                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `READY_FOR_EDITORIAL_REVIEW` | Evidence is strong enough for a human editor to continue review. This does not mean automatic publication.          |
| `DO_NOT_PUBLISH_YET`         | Evidence is weak, contradictory, missing, or too risky. The case should not advance until more review is completed. |
| `NEEDS_MANUAL_REVIEW`        | The case is ambiguous, sensitive, or partially supported. A human must review it carefully before any decision.     |

### 6.3 Recommendation Rules

| Recommended Action           | Rule                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `READY_FOR_EDITORIAL_REVIEW` | `evidenceScore >= 75`, `riskScore <= 35`, `sourceAgreement = HIGH`, and at least 2 relevant sources exist. |
| `DO_NOT_PUBLISH_YET`         | `evidenceScore < 50`, or `riskScore > 60`, or `sourceAgreement = LOW`, or no relevant evidence exists.     |
| `NEEDS_MANUAL_REVIEW`        | Evidence is partial, source agreement is medium, risk is moderate, or sources contradict each other.       |

---

## 7. UX Prototype and Testing Evidence

### 7.1 Prototype and Test Links

| Artifact        | Link                                                                                                                              | Purpose                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Figma Prototype | [IA Detector Figma Prototype](https://www.figma.com/design/rZvKoMlj3IDMIymKdWbDBb/IA-Detector?node-id=11-37&t=DAxirgS7FYhOJTWN-1) | Interactive prototype for the MVP workflow.            |
| Maze Test       | [IA Detector Maze Test](https://t.maze.co/545947273)                                                                              | UX test used to validate navigation and comprehension. |

These links are listed once in this document to avoid duplicated references across the repository.

### 7.2 Prototype Screens

Prototype evidence is stored under:

```text
docs/assets/prototype/
```

| Screen                 | File                                     | Purpose                                   |
| ---------------------- | ---------------------------------------- | ----------------------------------------- |
| Login                  | `docs/assets/prototype/login.png`        | User enters the tool.                     |
| Register               | `docs/assets/prototype/register.png`     | User creates account.                     |
| Verification dashboard | `docs/assets/prototype/dashboard.png`    | User submits content for analysis.        |
| Analysis result modal  | `docs/assets/prototype/result-modal.png` | User reviews the analysis summary.        |
| Verification history   | `docs/assets/prototype/history.png`      | User reviews previous verification cases. |

### 7.3 Prototype Corrections Applied

| Previous Issue                                                | Correction Applied                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| The prototype mentioned video analysis.                       | Video references were removed because video is outside MVP scope.             |
| The prototype suggested absolute truth verification.          | Language was adjusted to emphasize evidence-based editorial recommendation.   |
| The login screen sounded oriented to general content sharing. | The heading was changed to “Verifica contenido dudoso antes de publicarlo.”   |
| History examples included video content.                      | History examples were changed to images, links, screenshots, and text.        |
| Result language used truth-style labels.                      | Result language was aligned with evidence score and editorial recommendation. |

### 7.4 UX Testing Evidence

UX testing evidence is stored under:

```text
docs/assets/ux-testing/
```

| Evidence                 | File                                              | Purpose                                       |
| ------------------------ | ------------------------------------------------- | --------------------------------------------- |
| Maze results summary     | `docs/assets/ux-testing/maze-results-summary.png` | Shows general results from the Maze test.     |
| Task completion evidence | `docs/assets/ux-testing/maze-task-completion.png` | Shows which tasks users completed or failed.  |
| Participant comments     | `docs/assets/ux-testing/maze-comments.png`        | Shows qualitative feedback from participants. |

UX validation must be based on real participant results. If Maze results are not available yet, this section should only include the prototype and test links, not invented metrics.

---

## 8. C4 Architecture

The system architecture is documented using C4-style diagrams.

### 8.1 C4 Level 1 — System Context

```mermaid
flowchart LR
    journalist["Person: Journalist<br/>Reviews suspicious content before publication"]
    editor["Person: Editor/Admin<br/>Reviews cases and audit logs"]

    iaDetector["Software System: IA Detector<br/>Creates evidence-based editorial analysis reports"]

    googleFactCheck["External System: Google Fact Check Tools API<br/>Provides fact-checking evidence"]
    aiProvider["External System: AI/OCR Provider or Mock<br/>Extracts claims, OCR text, and risk signals"]

    journalist -->|"Submits content and reviews reports"| iaDetector
    editor -->|"Reviews cases and audit logs"| iaDetector
    iaDetector -->|"Searches evidence"| googleFactCheck
    iaDetector -->|"Extracts claims, OCR text, and risk signals"| aiProvider
```

### 8.2 C4 Level 2 — Container Diagram

```mermaid
flowchart LR
    journalist["Person: Journalist"]
    editor["Person: Editor/Admin"]

    subgraph system["IA Detector"]
        frontend["Container: Frontend Web App<br/>React + TypeScript + Vite + Tailwind<br/>Runs on Vercel"]
        backend["Container: Backend API<br/>NestJS + TypeScript<br/>Runs on Render"]
        database["Container: PostgreSQL Database<br/>Supabase PostgreSQL"]
        storage["Container: Object Storage<br/>Supabase Storage"]
    end

    googleFactCheck["External System: Google Fact Check Tools API"]
    aiProvider["External System: AI/OCR Provider or Mock"]

    journalist -->|"Uses"| frontend
    editor -->|"Uses"| frontend
    frontend -->|"REST API over HTTPS"| backend
    backend -->|"Reads/Writes through Prisma"| database
    backend -->|"Stores uploaded images/screenshots"| storage
    backend -->|"Queries evidence"| googleFactCheck
    backend -->|"Requests AI/OCR analysis"| aiProvider
```

### 8.3 C4 Level 3 — Backend Components

```mermaid
flowchart TB
    verificationController["VerificationController<br/>Receives verification requests"]
    uploadController["UploadController<br/>Receives image uploads"]
    historyController["HistoryController<br/>Returns previous cases"]
    authController["AuthController<br/>Handles authentication"]

    createCaseService["CreateVerificationCaseService<br/>Coordinates verification workflow"]
    claimService["ClaimExtractionService<br/>Extracts main claim"]
    evidenceService["FactCheckEvidenceService<br/>Searches and normalizes evidence"]
    riskService["RiskAnalysisService<br/>Detects risk signals"]
    scoringServices["Scoring Services<br/>Evidence score, risk score, source agreement"]
    recommendationService["EditorialRecommendationService<br/>Generates recommended editorial action"]
    aiAmbassador["AIAmbassador<br/>Boundary for AI/OCR providers"]
    repositories["Repositories<br/>Persistence layer"]

    database["PostgreSQL Database"]
    googleFactCheck["Google Fact Check Tools API"]
    aiProvider["AI/OCR Provider or Mock"]

    verificationController --> createCaseService
    uploadController --> repositories
    historyController --> repositories
    authController --> repositories

    createCaseService --> claimService
    createCaseService --> evidenceService
    createCaseService --> riskService
    createCaseService --> scoringServices
    createCaseService --> recommendationService
    createCaseService --> repositories

    claimService --> aiAmbassador
    riskService --> aiAmbassador
    aiAmbassador --> aiProvider

    evidenceService --> googleFactCheck
    evidenceService --> repositories

    repositories --> database
```

---

## 9. Frontend Design

### 9.1 Frontend Technology Decisions

| Concern           | Decision                                  |
| ----------------- | ----------------------------------------- |
| Hosting           | Vercel                                    |
| Framework         | React                                     |
| Build tool        | Vite                                      |
| Language          | TypeScript                                |
| Styling           | Tailwind CSS                              |
| UI components     | shadcn/ui                                 |
| Routing           | React Router                              |
| API communication | Axios                                     |
| Server state      | TanStack Query                            |
| Local UI state    | Zustand                                   |
| Forms             | React Hook Form                           |
| Validation        | Zod                                       |
| Testing           | Vitest, React Testing Library, Playwright |

### 9.2 Frontend Source Structure

```text
src/frontend/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
│
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── components/
│   │   │   └── AuthForm.tsx
│   │   ├── services/
│   │   │   └── authApi.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── verification/
│   │   ├── pages/
│   │   │   ├── VerificationHubPage.tsx
│   │   │   └── VerificationResultPage.tsx
│   │   ├── components/
│   │   │   ├── VerificationInputPanel.tsx
│   │   │   ├── ImageUploadDropzone.tsx
│   │   │   ├── AnalysisSummaryCard.tsx
│   │   │   ├── EvidenceList.tsx
│   │   │   ├── RiskSignalList.tsx
│   │   │   └── ScoreSummary.tsx
│   │   ├── services/
│   │   │   └── verificationApi.ts
│   │   └── types/
│   │       └── verification.types.ts
│   │
│   └── history/
│       ├── pages/
│       │   ├── VerificationHistoryPage.tsx
│       │   └── VerificationCaseDetailPage.tsx
│       ├── components/
│       │   └── HistoryTable.tsx
│       ├── services/
│       │   └── historyApi.ts
│       └── types/
│           └── history.types.ts
│
└── shared/
    ├── api/
    │   ├── httpClient.ts
    │   └── apiErrorHandler.ts
    ├── components/
    │   ├── AppLayout.tsx
    │   ├── ProtectedRoute.tsx
    │   └── LoadingState.tsx
    ├── config/
    │   └── env.ts
    └── types/
        └── api.types.ts
```

### 9.3 Frontend Routes

| Route                       | Component                    | Purpose                                  |
| --------------------------- | ---------------------------- | ---------------------------------------- |
| `/login`                    | `LoginPage`                  | User login.                              |
| `/register`                 | `RegisterPage`               | User registration.                       |
| `/app`                      | `VerificationHubPage`        | Main dashboard for content verification. |
| `/app/verification/:caseId` | `VerificationResultPage`     | Full verification report.                |
| `/app/history`              | `VerificationHistoryPage`    | Previous verification cases.             |
| `/app/history/:caseId`      | `VerificationCaseDetailPage` | Detail view of a previous case.          |

### 9.4 Frontend API Usage

| User Action                             | API Call                         |
| --------------------------------------- | -------------------------------- |
| Login                                   | `POST /api/auth/login`           |
| Register                                | `POST /api/auth/register`        |
| Logout                                  | `POST /api/auth/logout`          |
| Upload image                            | `POST /api/uploads/image`        |
| Submit text, URL, or image for analysis | `POST /api/verifications`        |
| View verification history               | `GET /api/verifications`         |
| Open case detail                        | `GET /api/verifications/:caseId` |
| View audit trail                        | `GET /api/audit/:caseId`         |

### 9.5 Frontend States

| State        | Meaning                                      |
| ------------ | -------------------------------------------- |
| `IDLE`       | No request has started.                      |
| `SUBMITTING` | The frontend is sending the request.         |
| `PROCESSING` | The backend is creating the analysis report. |
| `COMPLETED`  | The report is ready.                         |
| `ERROR`      | The request failed.                          |

---

## 10. Backend Design

### 10.1 Backend Technology Decisions

| Concern           | Decision                                  |
| ----------------- | ----------------------------------------- |
| Hosting           | Render                                    |
| Runtime           | Node.js 22 LTS                            |
| Framework         | NestJS                                    |
| Language          | TypeScript                                |
| API style         | REST over HTTPS                           |
| ORM               | Prisma                                    |
| Database          | Supabase PostgreSQL                       |
| File storage      | Supabase Storage                          |
| Auth              | JWT access token + httpOnly refresh token |
| API documentation | OpenAPI / Swagger                         |
| Testing           | Jest + Supertest                          |

### 10.2 Backend Source Structure

```text
src/backend/
├── api/
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── UploadController.ts
│   │   ├── VerificationController.ts
│   │   ├── HistoryController.ts
│   │   └── AuditController.ts
│   ├── guards/
│   │   ├── JwtAuthGuard.ts
│   │   └── RoleGuard.ts
│   └── middlewares/
│       ├── TraceIdMiddleware.ts
│       └── ErrorHandlerMiddleware.ts
│
├── application/
│   ├── auth/
│   │   ├── LoginService.ts
│   │   ├── RegisterService.ts
│   │   ├── RefreshTokenService.ts
│   │   └── LogoutService.ts
│   ├── verification/
│   │   ├── CreateVerificationCaseService.ts
│   │   ├── GetVerificationCaseService.ts
│   │   ├── ListVerificationHistoryService.ts
│   │   └── EditorialRecommendationService.ts
│   ├── claims/
│   │   └── ClaimExtractionService.ts
│   ├── evidence/
│   │   └── FactCheckEvidenceService.ts
│   ├── risk/
│   │   └── RiskAnalysisService.ts
│   ├── scoring/
│   │   ├── EvidenceScoreService.ts
│   │   ├── RiskScoreService.ts
│   │   └── SourceAgreementService.ts
│   └── ai/
│       ├── AIAmbassador.ts
│       ├── AIResponseAdapter.ts
│       └── RetryManager.ts
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
│   │   ├── PrismaClient.ts
│   │   └── repositories/
│   │       ├── UserRepository.ts
│   │       ├── VerificationRepository.ts
│   │       ├── EvidenceRepository.ts
│   │       ├── RiskSignalRepository.ts
│   │       ├── UploadedFileRepository.ts
│   │       ├── AuditLogRepository.ts
│   │       └── FactCheckCacheRepository.ts
│   ├── integrations/
│   │   ├── factcheck/
│   │   │   ├── GoogleFactCheckClient.ts
│   │   │   ├── GoogleFactCheckAdapter.ts
│   │   │   └── MockFactCheckClient.ts
│   │   └── ai/
│   │       ├── MockAIConnector.ts
│   │       └── MockOCRConnector.ts
│   └── storage/
│       └── SupabaseStorageService.ts
│
└── shared/
    ├── config/
    │   └── AppConfig.ts
    ├── errors/
    │   ├── AppException.ts
    │   ├── ValidationException.ts
    │   └── ExternalProviderException.ts
    └── validation/
        ├── createVerificationSchema.ts
        └── uploadImageSchema.ts
```

### 10.3 Backend Endpoints

#### Authentication

| Method | Endpoint             | Purpose               |
| ------ | -------------------- | --------------------- |
| `POST` | `/api/auth/register` | Register user.        |
| `POST` | `/api/auth/login`    | Login user.           |
| `POST` | `/api/auth/refresh`  | Refresh access token. |
| `POST` | `/api/auth/logout`   | Revoke refresh token. |
| `GET`  | `/api/auth/me`       | Return current user.  |

#### Verification

| Method | Endpoint                           | Purpose                              |
| ------ | ---------------------------------- | ------------------------------------ |
| `POST` | `/api/verifications`               | Create verification analysis report. |
| `GET`  | `/api/verifications`               | List user verification history.      |
| `GET`  | `/api/verifications/:caseId`       | Get full case detail.                |
| `POST` | `/api/verifications/:caseId/rerun` | Run analysis again.                  |

#### Uploads

| Method | Endpoint             | Purpose                     |
| ------ | -------------------- | --------------------------- |
| `POST` | `/api/uploads/image` | Upload image or screenshot. |

#### Audit

| Method | Endpoint             | Purpose                      |
| ------ | -------------------- | ---------------------------- |
| `GET`  | `/api/audit/:caseId` | Get audit events for a case. |

---

## 11. API Contracts

### 11.1 CreateVerificationRequestDTO

```ts
type InputType = "TEXT" | "URL" | "IMAGE";

interface CreateVerificationRequestDTO {
  inputType: InputType;
  text?: string;
  url?: string;
  uploadedFileId?: string;
}
```

Validation rules:

| Field            | Rule                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `inputType`      | Required. Must be `TEXT`, `URL`, or `IMAGE`.                              |
| `text`           | Required when `inputType = TEXT`. Minimum 20 characters.                  |
| `url`            | Required when `inputType = URL`. Must be a valid URL.                     |
| `uploadedFileId` | Required when `inputType = IMAGE`. Must belong to the authenticated user. |

### 11.2 VerificationAnalysisReportDTO

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
  evidence: EvidenceDTO[];
  riskSignals: RiskSignalDTO[];
  createdAt: string;
  completedAt: string;
}
```

### 11.3 EvidenceDTO

```ts
interface EvidenceDTO {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publisher?: string;
  publishedAt?: string;
  summary: string;
  relevanceScore: number;
  agreement: "SUPPORTS" | "CONTRADICTS" | "PARTIAL" | "UNKNOWN";
}
```

### 11.4 RiskSignalDTO

```ts
interface RiskSignalDTO {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}
```

### 11.5 ErrorResponseDTO

```ts
interface ErrorResponseDTO {
  traceId: string;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

## 12. Verification Workflow

```text
CreateVerificationCaseService.execute(request, currentUser)
        ↓
Validate input based on inputType
        ↓
Create verification case with status PROCESSING
        ↓
If inputType = IMAGE, load uploaded file and run OCR mock/provider
        ↓
Extract main claim
        ↓
Search fact-checking evidence
        ↓
Normalize evidence
        ↓
Detect risk signals
        ↓
Calculate evidenceScore
        ↓
Calculate riskScore
        ↓
Calculate sourceAgreement
        ↓
Generate recommendedAction
        ↓
Store evidence, risk signals, scores, recommendation, and audit events
        ↓
Return VerificationAnalysisReportDTO
```

---

## 13. Data Design

### 13.1 Database Decisions

| Concern        | Decision                         |
| -------------- | -------------------------------- |
| Database       | PostgreSQL                       |
| Cloud provider | Supabase PostgreSQL              |
| ORM            | Prisma                           |
| Schema file    | `prisma/schema.prisma`           |
| DBML file      | `database/dbml/ia-detector.dbml` |

### 13.2 Main Tables

| Table                | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `users`              | Stores journalist and admin accounts.                      |
| `refresh_tokens`     | Stores hashed refresh tokens.                              |
| `uploaded_files`     | Stores metadata for uploaded images and screenshots.       |
| `verification_cases` | Stores verification requests and final analysis summaries. |
| `evidence_results`   | Stores evidence from providers or mocks.                   |
| `risk_signals`       | Stores warning signals detected for each case.             |
| `audit_logs`         | Stores traceable workflow events.                          |
| `fact_check_cache`   | Stores cached provider responses.                          |

### 13.3 Relationships

```text
users 1 ── * verification_cases
users 1 ── * refresh_tokens
users 1 ── * uploaded_files

verification_cases 1 ── * evidence_results
verification_cases 1 ── * risk_signals
verification_cases 1 ── * audit_logs
verification_cases * ── 0..1 uploaded_files
```

### 13.4 Required Indexes

| Table                | Index                   | Purpose                                                  |
| -------------------- | ----------------------- | -------------------------------------------------------- |
| `verification_cases` | `(user_id, created_at)` | Load user history efficiently.                           |
| `verification_cases` | `(status)`              | Filter processing/completed/failed cases.                |
| `evidence_results`   | `(case_id)`             | Load evidence for a case.                                |
| `risk_signals`       | `(case_id)`             | Load risk signals for a case.                            |
| `audit_logs`         | `(case_id, created_at)` | Load audit events in order.                              |
| `fact_check_cache`   | `(cache_key)` unique    | Avoid repeated provider calls for same normalized claim. |
| `fact_check_cache`   | `(expires_at)`          | Clean expired cache entries.                             |

---

## 14. External Integrations

### 14.1 Google Fact Check Tools API

| Item             | Decision                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| Purpose          | Search previous fact-checking evidence related to the extracted claim. |
| Backend boundary | `FactCheckEvidenceService`                                             |
| Client           | `GoogleFactCheckClient`                                                |
| Adapter          | `GoogleFactCheckAdapter`                                               |
| Mock client      | `MockFactCheckClient`                                                  |
| Cache repository | `FactCheckCacheRepository`                                             |

Rules:

* The API key is never exposed to the frontend.
* Provider responses are normalized before storage.
* Empty evidence does not mean the claim is false.
* Provider failure returns partial report information when possible.
* Local demo mode uses deterministic mock evidence.

### 14.2 AI / OCR Provider or Mock

| Item             | Decision                                    |
| ---------------- | ------------------------------------------- |
| Purpose          | Extract claims, OCR text, and risk signals. |
| Backend boundary | `AIAmbassador`                              |
| Mock AI          | `MockAIConnector`                           |
| Mock OCR         | `MockOCRConnector`                          |
| Retry component  | `RetryManager`                              |
| Response adapter | `AIResponseAdapter`                         |

Rules:

* The MVP can run without a real AI provider.
* Mock behavior must be deterministic for repeatable demos.
* Provider-specific responses must be adapted before entering application services.
* OCR in the MVP extracts text from screenshots/images through mock/local behavior only.

---

## 15. Design Patterns

### 15.1 Ambassador Pattern

| Item          | Detail                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Problem       | The backend should not depend directly on a specific AI/OCR provider.                   |
| Solution      | Use `AIAmbassador` as the single boundary for claim extraction, OCR, and risk analysis. |
| Location      | `src/backend/application/ai/AIAmbassador.ts`                                            |
| Collaborators | `MockAIConnector`, `MockOCRConnector`, `AIResponseAdapter`, `RetryManager`              |
| Benefit       | The provider can be changed without rewriting verification services.                    |

### 15.2 Adapter Pattern

| Item     | Detail                                                                                     |
| -------- | ------------------------------------------------------------------------------------------ |
| Problem  | Google Fact Check API responses do not match the internal evidence model.                  |
| Solution | Use `GoogleFactCheckAdapter` to convert provider responses into internal evidence objects. |
| Location | `src/backend/infrastructure/integrations/factcheck/GoogleFactCheckAdapter.ts`              |
| Benefit  | Application services work with stable internal evidence models.                            |

### 15.3 Strategy Pattern

| Item       | Detail                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| Problem    | Text, URL, and image inputs need different preprocessing.                     |
| Solution   | Use separate input handlers for each input type.                              |
| Location   | `src/backend/application/verification/input-handlers/`                        |
| Strategies | `TextInputHandler`, `UrlInputHandler`, `ImageInputHandler`                    |
| Benefit    | New input types can be added without changing the main verification workflow. |

### 15.4 Repository Pattern

| Item     | Detail                                                                                   |
| -------- | ---------------------------------------------------------------------------------------- |
| Problem  | Application services should not contain Prisma-specific code.                            |
| Solution | Use repositories for users, cases, evidence, risk signals, files, cache, and audit logs. |
| Location | `src/backend/infrastructure/persistence/repositories/`                                   |
| Benefit  | Persistence remains isolated from application workflow logic.                            |

---

## 16. Security Design

| Area            | Decision                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| Authentication  | JWT access token with httpOnly refresh token.                             |
| Passwords       | Passwords are hashed before storage.                                      |
| Refresh tokens  | Refresh tokens are stored hashed and can be revoked.                      |
| Authorization   | Journalists can only access their own cases. Admins can access all cases. |
| File uploads    | Only JPEG, PNG, and WEBP images are allowed.                              |
| File size       | Maximum image size is 5 MB.                                               |
| Secrets         | API keys and JWT secrets are stored in environment variables.             |
| API keys        | External provider keys are used only by the backend.                      |
| Audit logs      | Verification events are stored for traceability.                          |
| Error responses | Errors return `traceId` without leaking secrets or stack traces.          |

---

## 17. Deployment Design

### 17.1 Environment Strategy

| Environment | Frontend               | Backend                   | Database                            | Purpose                            |
| ----------- | ---------------------- | ------------------------- | ----------------------------------- | ---------------------------------- |
| Local       | Vite dev server        | NestJS local server       | Local PostgreSQL or Supabase dev DB | Developer implementation and demo. |
| Testing     | Vercel preview         | Render preview service    | Supabase testing database           | Automated tests and QA review.     |
| Staging     | Vercel staging project | Render staging service    | Supabase staging database           | Pre-production validation.         |
| Production  | Vercel production      | Render production service | Supabase production database        | Live environment.                  |

### 17.2 Cloud Services

| Concern                    | Service                                     |
| -------------------------- | ------------------------------------------- |
| Frontend hosting           | Vercel                                      |
| Backend hosting            | Render                                      |
| Database                   | Supabase PostgreSQL                         |
| Object storage             | Supabase Storage                            |
| External evidence provider | Google Fact Check Tools API                 |
| Version control            | GitHub                                      |
| CI/CD                      | GitHub Actions + Vercel/Render deploy hooks |

### 17.3 Environment Variables

```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@localhost:5432/ia_detector

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=ia-detector-uploads

FACT_CHECK_MODE=mock
GOOGLE_FACT_CHECK_API_KEY=
FACT_CHECK_TIMEOUT_SECONDS=8
FACT_CHECK_MAX_RETRIES=2
FACT_CHECK_CACHE_TTL_MINUTES=60

AI_MODE=mock
AI_TIMEOUT_SECONDS=8
AI_MAX_RETRIES=2

MAX_IMAGE_SIZE_MB=5
```

### 17.4 CI/CD Pipeline

```text
Pull request opened
        ↓
Install dependencies
        ↓
Run lint
        ↓
Run type check
        ↓
Run unit tests
        ↓
Run backend integration tests
        ↓
Run frontend component tests
        ↓
Build frontend
        ↓
Build backend
        ↓
Deploy preview environment
        ↓
Manual review
        ↓
Merge to main
        ↓
Deploy staging / production
```

---

## 18. Quality Control

### 18.1 Quality Gates

| Gate              | Required Check                                                      |
| ----------------- | ------------------------------------------------------------------- |
| Code style        | Lint passes.                                                        |
| Type safety       | TypeScript check passes.                                            |
| Backend logic     | Unit tests pass for scoring and recommendation rules.               |
| API behavior      | Integration tests pass for auth, verification, upload, and history. |
| Frontend behavior | Component tests pass for forms, result display, and history table.  |
| E2E flow          | User can log in, submit content, view report, and open history.     |
| Security          | Protected routes reject unauthenticated access.                     |
| UX                | Maze test results are reviewed and corrections are documented.      |
| Architecture      | C4 diagrams match the implemented containers and components.        |

### 18.2 Required Backend Tests

| Test                                     | Expected Result                       |
| ---------------------------------------- | ------------------------------------- |
| High evidence and low risk               | Returns `READY_FOR_EDITORIAL_REVIEW`. |
| Low evidence                             | Returns `DO_NOT_PUBLISH_YET`.         |
| High risk                                | Returns `DO_NOT_PUBLISH_YET`.         |
| Medium evidence or contradictory sources | Returns `NEEDS_MANUAL_REVIEW`.        |
| Empty text input                         | Returns validation error.             |
| Invalid URL                              | Returns validation error.             |
| Invalid image type                       | Returns validation error.             |
| Unauthorized history access              | Returns `403`.                        |

### 18.3 Required Frontend Tests

| Test                                           | Expected Result                   |
| ---------------------------------------------- | --------------------------------- |
| Login form validates required fields.          | Error is shown.                   |
| Verification input panel validates input type. | Invalid request is blocked.       |
| Image upload rejects unsupported files.        | Error is shown.                   |
| Analysis summary displays evidence score.      | Score is visible.                 |
| Analysis summary displays risk score.          | Score is visible.                 |
| Evidence list renders source details.          | Source title and URL are visible. |
| History table displays previous cases.         | Cases are listed.                 |

---

## 19. Repository Structure for This Design

```text
caso2-ia-detector/
├── README.md
│
├── docs/
│   └── assets/
│       ├── prototype/
│       │   ├── login.png
│       │   ├── register.png
│       │   ├── dashboard.png
│       │   ├── result-modal.png
│       │   └── history.png
│       │
│       └── ux-testing/
│           ├── maze-results-summary.png
│           ├── maze-task-completion.png
│           └── maze-comments.png
│
├── database/
│   └── dbml/
│       └── ia-detector.dbml
│
└── prisma/
    └── schema.prisma
```

This repository structure keeps the software design in one main document and stores only technical artifacts or UX evidence as supporting files.

---

## 20. Target Implementation Structure

```text
src/
├── frontend/
│   ├── app/
│   ├── features/
│   │   ├── auth/
│   │   ├── verification/
│   │   └── history/
│   └── shared/
│
└── backend/
    ├── api/
    ├── application/
    ├── domain/
    ├── infrastructure/
    └── shared/
```

This structure is the target source code organization for implementation. The design sections above describe what each folder and component is responsible for before coding begins.

---

## 21. Implementation Contract

The implementation must follow these rules:

1. The system produces an analysis report, not a truth/falsity verdict.
2. The frontend must not display absolute labels such as `TRUE` or `FALSE`.
3. The frontend must show evidence, risk, and recommendation together.
4. Text, URL, and image verification must use the same backend workflow after preprocessing.
5. Image verification in the MVP must use OCR mock/local behavior.
6. External provider failures must not crash the application.
7. Verification history must be stored for authenticated users.
8. Audit logs must be stored for each verification case.
9. Cloud deployment must separate frontend, backend, database, and storage.
10. C4 diagrams must match the implemented architecture.