# IA Detector — Software Design and Implementation Contract

IA Detector is a web application for journalists and editorial teams who need to review suspicious digital content before publication.

The system does **not** decide whether a claim is absolutely true or false. It produces a **Verification Analysis Report**: a structured report that contains the extracted claim, reviewed evidence, risk signals, evidence score, risk score, source agreement, and a recommended editorial action for human review.

This `README.md` is the single source of truth for the MVP design and implementation contract. It defines what must be built, which endpoints exist, which frontend pages consume them, how the backend produces the analysis report, which data is stored, how integrations behave, which design patterns are applied, how the system is secured and observed, and how the MVP is accepted.

---

## Table of Contents

0. [Developer Onboarding and Design Contract](#0-developer-onboarding-and-design-contract)
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
17. [AI-Assisted Development Workflow](#17-ai-assisted-development-workflow)
18. [Case #2 Traceability and Team Ownership](#18-case-2-traceability-and-team-ownership)
19. [Sales Pitch and Demo Plan](#19-sales-pitch-and-demo-plan)


---

## 0. Developer Onboarding and Design Contract

This section is written for a developer who has never worked on IA Detector before. It defines the mandatory development context, local execution contract, environment contract, validation expectations, and architectural rules that must guide implementation.

This README is a **design document and implementation contract**. It is not a progress report, a temporary status log, or a description of what happens to be present in one local machine. A developer must read it as the authoritative set of instructions for building the MVP correctly.

The document defines:

- what the system must do;
- which frontend pages, backend modules, endpoints, DTOs, states, and database records must exist;
- how the frontend, backend, database, storage, and integrations must communicate;
- which local tools are required to run and validate the system;
- which architectural decisions are mandatory;
- which behaviors are accepted or rejected by the MVP;
- which rules prevent developers from making undocumented assumptions.

Design authority rule:

```text
A developer must not implement a feature only from memory, from a chat conversation, or from an isolated code snippet. The README, Prisma schema, DBML model, UX assets, and agent findings must remain aligned, with this README acting as the main implementation contract.
```

Completeness rule:

```text
A feature is not considered design-ready unless this README defines its endpoint contract, input/output DTOs, business rules, persistence behavior, error behavior, security rules, observability expectations, and acceptance criteria.
```

### 0.1 How to Read This README

| Step | What to Read | Why |
|---:|---|---|
| 1 | Section 0 | Understand the design contract, local development environment, Docker, ports, variables, validation flow, and responsibility rules. |
| 2 | Sections 1–3 | Understand the product goal, MVP boundary, use cases, and verification pipeline. |
| 3 | Sections 4–6 | Understand frontend pages, backend modules, DTOs, endpoints, and API behavior. |
| 4 | Section 7 | Understand the database model that Prisma and DBML must support. |
| 5 | Sections 8–11 | Understand integrations, design patterns, security, and observability. |
| 6 | Sections 12–16 | Understand architecture, UX evidence, deployment, acceptance criteria, repository structure, and validation commands. |
| 7 | Section 17 | Understand how AI-assisted agents must be used as review and generation support. |
| 8 | Sections 18–19 | Understand project traceability, team ownership, sales pitch, and demo plan. |

Reading rule:

```text
When a developer receives a task, they must first locate the corresponding use case, endpoint contract, module contract, data model, security rule, and acceptance criterion before writing code.
```

### 0.2 Design Contract Scope

The README describes the **target MVP design**. It must be used by developers as a construction contract, not as a checklist of temporary implementation status.

The scope is organized by responsibility:

| Area | What the README Defines |
|---|---|
| Product | Goal, user roles, MVP boundary, excluded behavior, and editorial purpose. |
| UX | Pages, user flows, component responsibilities, messages, accessibility, and visual rules. |
| Backend | Modules, services, repositories, DTOs, guards, validation behavior, error behavior, and pipeline rules. |
| API | Endpoint paths, request bodies, response bodies, authorization, status codes, and error codes. |
| Data | Tables, enums, relationships, ownership rules, indexes, and persistence requirements. |
| Integrations | Provider boundaries, adapter behavior, mock mode, failure behavior, retries, and cache behavior. |
| Security | Authentication, authorization, secret handling, upload safety, error safety, and privacy rules. |
| Observability | Trace IDs, audit events, logs, provider status, cache status, and health checks. |
| Local execution | Required tools, ports, Docker database, environment variables, setup commands, and validation commands. |
| QA | Acceptance criteria, smoke tests, consistency checks, and review gates. |

Design-vs-code rule:

```text
If the codebase contradicts this README, the team must resolve the conflict deliberately. Either the code must be corrected to match the design contract, or the README, Prisma schema, DBML, UX assets, and acceptance criteria must be updated together to reflect an approved design change.
```

Design quality gate:

```text
A section is robust enough only when it gives a developer a closed decision, a concrete responsibility, expected inputs and outputs, failure behavior, and an acceptance condition. Vague intentions such as "handle later", "as needed", or "depending on implementation" must be replaced by explicit contracts before development starts.
```

### 0.3 Local Development Environment Contract

IA Detector must be runnable in a reproducible local development environment. The local environment uses separate processes for the frontend, backend, and database.

```text
Browser
  │
  │  http://localhost:5173
  ▼
Frontend development server
  │
  │  VITE_API_BASE_URL=http://localhost:3000/api
  ▼
NestJS backend API
  │
  │  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ia_detector?schema=public
  ▼
PostgreSQL Docker container
```

| Component | Required Technology | Local Address | Responsibility |
|---|---|---|---|
| Frontend development server | Vite + React | `http://localhost:5173` | Serves the web application during development. |
| Backend API server | NestJS | `http://localhost:3000/api` | Exposes authentication, upload, verification, audit, and health endpoints. |
| Database server | PostgreSQL in Docker | `localhost:5432` | Stores users, refresh tokens, uploaded files, verification cases, evidence, risk signals, cache entries, and audit logs. |

CORS rule:

```text
The backend must use FRONTEND_URL to decide which frontend origin is allowed to call the API during local development.
```

Frontend API rule:

```text
The frontend must use VITE_API_BASE_URL to decide where backend requests must be sent. For local development, it must point to http://localhost:3000/api.
```

Database rule:

```text
PostgreSQL must be available before running Prisma commands or starting backend features that touch persistence.
```

### 0.4 Required Local Tools

| Tool | Required Version / Notes | Why It Is Needed |
|---|---|---|
| Node.js | `22.x LTS` | Runs NestJS, TypeScript tooling, Prisma CLI, and frontend tooling. |
| npm | Installed with Node.js | Installs dependencies and runs project scripts. |
| Docker Desktop | Engine must be running before database commands are executed. | Runs the local PostgreSQL database. |
| PostgreSQL Docker image | `postgres:15` | Provides a local database compatible with the MVP persistence contract. |
| Git | Any modern version | Version control, clean ZIP generation, diff checks, and grep checks. |
| PowerShell | Windows PowerShell or PowerShell 7 | Command examples in this README use PowerShell syntax. |

Docker requirement:

```text
The local MVP database must run through Docker unless the developer configures an equivalent PostgreSQL server that satisfies the same DATABASE_URL contract.
```

### 0.5 First-Time Local Setup Contract

A developer starting from a clean clone must run the following sequence from the repository root.

Install dependencies:

```powershell
npm.cmd install
```

Create the local PostgreSQL database container:

```powershell
docker run --name ia-detector-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ia_detector `
  -p 5432:5432 `
  -d postgres:15
```

Create `.env` from `.env.example` using safe local values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_detector?schema=public"
BACKEND_PORT=3000
FRONTEND_URL="http://localhost:5173"
JWT_ACCESS_SECRET="replace-with-local-development-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-local-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
VITE_API_BASE_URL="http://localhost:3000/api"
```

Generate Prisma Client:

```powershell
npm.cmd run db:generate
```

Apply the Prisma schema to the local database:

```powershell
npm.cmd run db:push
```

Start the backend:

```powershell
npm.cmd run dev:backend
```

Start the frontend development server:

```powershell
npm.cmd run dev:frontend
```

Expected backend base URL:

```text
http://localhost:3000/api
```

Expected frontend base URL:

```text
http://localhost:5173
```

### 0.6 Docker Database Operations and Diagnostics

Start an existing local database container:

```powershell
docker start ia-detector-postgres
```

Stop the database container:

```powershell
docker stop ia-detector-postgres
```

Check whether the database container is running:

```powershell
docker ps
```

Inspect PostgreSQL container logs:

```powershell
docker logs ia-detector-postgres
```

Open a PostgreSQL shell inside the container:

```powershell
docker exec -it ia-detector-postgres psql -U postgres -d ia_detector
```

Reset the local database container only when local data can be deleted:

```powershell
docker stop ia-detector-postgres
docker rm ia-detector-postgres

docker run --name ia-detector-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ia_detector `
  -p 5432:5432 `
  -d postgres:15

npm.cmd run db:push
```

Reset warning:

```text
Removing the Docker container deletes the local database stored inside that container. Do not reset the container when review, demo, or debugging data must be preserved.
```

### 0.7 Environment Variable Contract

Local variables must be documented in `.env.example`. Real `.env` files must never be committed.

| Variable | Used By | Required For | Description |
|---|---|---|---|
| `DATABASE_URL` | Backend / Prisma | Database persistence | PostgreSQL connection string. |
| `BACKEND_PORT` | Backend | API server | Port where NestJS listens locally. |
| `FRONTEND_URL` | Backend | CORS | Allowed frontend origin. |
| `JWT_ACCESS_SECRET` | Backend | Access token signing | Secret used to sign and verify access tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Backend | Access token expiration | Expiration time for access tokens. |
| `JWT_REFRESH_SECRET` | Backend | Refresh token signing | Secret used to sign and verify refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | Backend | Refresh token expiration | Expiration time for refresh tokens. |
| `VITE_API_BASE_URL` | Frontend | API requests | Backend API base URL used by the frontend. |
| `SUPABASE_URL` | Backend | Deployment/storage integration | Supabase project URL when managed services are used. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Storage integration | Server-side Supabase key. Must never be exposed to frontend code. |
| `SUPABASE_STORAGE_BUCKET` | Backend | Image upload | Storage bucket for uploaded screenshots/images. |
| `FACT_CHECK_MODE` | Backend | Evidence provider | `mock` or `live`. Mock mode must be deterministic. |
| `GOOGLE_FACT_CHECK_API_KEY` | Backend | Live fact-check provider | Provider key for live evidence search. |
| `AI_MODE` | Backend | Claim extraction/OCR | `mock` or `live`. Mock mode must be deterministic. |
| `OPENAI_API_KEY` | Backend | Live AI connector | Optional provider key for AI-assisted behavior. |
| `FACT_CHECK_CACHE_TTL_MINUTES` | Backend | Evidence cache | Cache freshness duration. |
| `MAX_IMAGE_SIZE_MB` | Backend / Frontend | Upload validation | Maximum accepted uploaded image size. |

Secret rule:

```text
Secrets must be read from environment variables. They must not be hardcoded, committed, logged, returned in API responses, or exposed to frontend bundles.
```

Example-file rule:

```text
.env.example must contain every variable required by this contract using safe placeholder values. .env must contain real local values and must remain ignored by Git.
```

### 0.8 Project Scripts Contract

| Script | Command | Purpose |
|---|---|---|
| `dev:backend` | `ts-node-dev --respawn --transpile-only --project tsconfig.backend.json src/backend/main.ts` | Starts the NestJS backend in watch mode. |
| `dev:frontend` | `vite` | Starts the Vite frontend development server. |
| `build:frontend` | `vite build` | Builds the frontend production bundle. |
| `preview:frontend` | `vite preview` | Serves the built frontend locally for preview. |
| `typecheck:frontend` | `tsc --project tsconfig.frontend.json --noEmit` | Runs TypeScript validation for the frontend. |
| `test:frontend` | `vitest run` | Runs frontend unit/component tests. |
| `db:generate` | `prisma generate` | Generates Prisma Client from `prisma/schema.prisma`. |
| `db:push` | `prisma db push` | Pushes the Prisma schema to the configured PostgreSQL database. |
| `prisma:format` | `prisma format` | Formats Prisma schema. |
| `prisma:validate` | `prisma validate` | Validates Prisma schema and Prisma config. |
| `validate` | `prisma format && prisma validate` | Runs Prisma format and validation together. |

Script rule:

```text
If a script is added, removed, or renamed in package.json, this README must be updated in the same change so a new developer can run the project without guessing.
```

### 0.9 MVP Validation Flow

The MVP must provide a reproducible validation flow. The commands below define the expected review path for a developer or reviewer using PowerShell.

Health:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/health"
```

Register:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/register" `
  -ContentType "application/json" `
  -Body '{"name":"Demo Journalist","email":"demo@iadetector.local","password":"Password123!"}'
```

Login:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"demo@iadetector.local","password":"Password123!"}'
```

Current user:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Create text verification:

```powershell
$report = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/verifications" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" } `
  -ContentType "application/json" `
  -Body '{"inputType":"TEXT","text":"Comunicado oficial confirma una nueva medida sanitaria nacional respaldada por varias fuentes relevantes."}'

$report
```

List history:

```powershell
$history = Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/verifications" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }

$history
```

Open detail:

```powershell
$caseId = $history[0].caseId

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/verifications/$caseId" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Image and URL validation rule:

```text
The final MVP validation suite must include equivalent commands for URL verification and image verification. The README must always contain enough commands for a reviewer to execute every MVP use case without asking the original team.
```

### 0.10 Common Local Errors and Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Cannot resolve environment variable: DATABASE_URL` | Prisma config cannot read `.env`. | Ensure `.env` exists and `prisma.config.ts` imports `dotenv/config`. |
| `Cannot find module '.prisma/client/default'` | Prisma Client was not generated. | Run `npm.cmd run db:generate`. |
| `PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions` | Prisma 7 requires a driver adapter. | Ensure `PrismaService` constructs `PrismaClient` with `@prisma/adapter-pg`. |
| `ECONNREFUSED` from Prisma | PostgreSQL is not running on `localhost:5432`. | Open Docker Desktop and run `docker start ia-detector-postgres`. |
| Docker says container name already exists | The container already exists. | Run `docker start ia-detector-postgres` instead of `docker run`. |
| `409` when registering demo user | Demo email already exists. | Use another email or reset the local database. |
| `401` on protected endpoint | Missing, invalid, revoked, or expired token. | Login again and pass `Authorization: Bearer <token>`. |
| Port `3000` is already in use | Another backend process is running. | Stop the existing process or change `BACKEND_PORT`. |
| Browser frontend cannot call backend | CORS origin mismatch. | Ensure `FRONTEND_URL` matches the frontend local URL. |
| Frontend requests wrong backend URL | `VITE_API_BASE_URL` is missing or wrong. | Set `VITE_API_BASE_URL=http://localhost:3000/api`. |

### 0.11 Development Responsibility Rules

| Layer | Allowed Responsibility | Not Allowed |
|---|---|---|
| Controller | HTTP route, request body, path params, guards, DTO response. | Business rules, Prisma queries, password hashing, scoring, provider-specific logic. |
| Guard | Authentication and authorization checks. | Creating users, creating cases, calculating reports, accessing provider APIs. |
| Service | Business workflow, orchestration, validation of use-case rules, deterministic scoring, recommendation behavior. | Direct SQL/Prisma access, HTTP provider-specific JSON leakage, raw secret handling. |
| Repository | Prisma persistence and database-specific queries. | Business decisions, request validation, recommendation rules, provider calls. |
| DTO | API input and output shape. | Database queries, business logic, provider calls. |
| PrismaService | Database client setup, connection lifecycle, health checks. | Feature-specific persistence methods or business rules. |
| Integration client | External provider communication. | Returning raw provider JSON directly to controllers or frontend. |
| Adapter | Converts provider-specific responses into internal DTOs. | Calling controllers, mutating database records, deciding recommendations. |

Layering rule:

```text
Controllers call services. Services call repositories or ports. Repositories use Prisma. Integrations are accessed through ports/adapters. No layer may bypass its responsibility to make implementation faster.
```

### 0.12 Feature Extension Rule

When adding or modifying a feature, a developer must update the design contract before or together with the source change.

| Feature Type | Required Design Updates |
|---|---|
| New endpoint | Use case, API contract, DTOs, error behavior, security rule, acceptance criteria, validation command. |
| New database field/table/enum | Data model contract, Prisma schema, DBML, repository contract, validation expectations. |
| New frontend page | Page contract, route, API calls, loading/error behavior, accessibility rules, message catalog. |
| New integration | Integration contract, provider status behavior, timeout/retry rules, cache behavior, security notes. |
| New auth behavior | Security contract, token/cookie behavior, error codes, protected-route behavior, acceptance criteria. |
| New upload behavior | Upload DTOs, storage rules, MIME/size limits, ownership, security controls, failure behavior. |
| New agent usage | Agent workflow section and `docs/agent-findings.md` when a finding influences design or implementation. |

Change rule:

```text
A pull request is incomplete if it changes behavior without updating the README sections that define that behavior.
```

### 0.13 Forbidden Implementation Assumptions

Developers must not assume or implement the following:

| Forbidden Assumption | Correct Rule |
|---|---|
| The system decides whether something is absolutely true or false. | The system generates a verification analysis report and editorial recommendation. |
| `PASS`, `NO_PASS`, or `HUMAN_REVIEW` are valid product states. | Use `READY_FOR_EDITORIAL_REVIEW`, `DO_NOT_PUBLISH_YET`, and `NEEDS_MANUAL_REVIEW`. |
| Empty evidence means the claim is false. | Empty evidence is a risk condition, not an absolute truth decision. |
| Mock evidence is real fact-checking. | Mock mode is deterministic demo behavior and must be labeled as such in implementation logic and docs. |
| Frontend validation is enough for security. | Backend must validate and authorize every protected operation. |
| A user can access any case by `caseId`. | Users can access only their own resources unless role-based admin access explicitly allows otherwise. |
| Raw provider responses can be returned to the frontend. | Provider data must be normalized through adapters before reaching API DTOs. |
| `.env` can be committed for convenience. | `.env` must never be committed; `.env.example` must document safe placeholders. |
| Prisma can be imported directly into controllers. | Prisma access must stay inside repository/infrastructure classes. |

### 0.14 Review Readiness Checklist

Before a design or implementation submission, the following must be true:

```text
[ ] README defines the feature behavior clearly enough for a junior developer.
[ ] Frontend route contracts match API contracts.
[ ] Backend module contracts match use cases.
[ ] DTOs are documented with request/response examples.
[ ] Prisma schema and DBML match the data model contract.
[ ] Environment variables are documented in .env.example.
[ ] Docker/PostgreSQL setup can be reproduced from a clean clone.
[ ] Validation commands are documented and executable.
[ ] Security rules cover authentication, authorization, secrets, uploads, and errors.
[ ] No forbidden product labels are used in user-facing states.
[ ] Agent usage and findings are documented when they affect the design.
```

Review rule:

```text
Documentation is incomplete if a junior developer cannot understand what to build, where each responsibility belongs, how the system runs locally, how data flows through the product, how errors are handled, and how the MVP is accepted.
```

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
| Full newsroom collaboration | Comments, assignments, approvals, and multi-user workflows are outside MVP scope. |
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


### 1.7 Non-Negotiable Product Decisions

| Decision | Reason | Developer Instruction |
|---|---|---|
| The product does not return absolute truth labels. | Editorial verification requires human judgment and evidence context. | Never expose `TRUE`, `FALSE`, `PASS`, `NO_PASS`, or `HUMAN_REVIEW` as product states. |
| The product returns a structured report. | A journalist needs to inspect evidence, risk, scores, source agreement, and audit trail. | Every verification response must use `VerificationAnalysisReportDTO`. |
| Mock mode must be deterministic. | The MVP must be demoable without external credentials or unstable provider behavior. | Mock connectors must return predictable outputs based on documented scenarios. |
| Evidence is not a verdict. | Supporting, partial, unknown, or contradictory evidence must be interpreted through rules. | Recommendation logic must use evidence, risk, agreement, and provider/cache status together. |
| Auditability is mandatory. | Editorial decisions need traceability. | Important workflow steps must produce audit events with trace IDs. |
| Ownership checks are mandatory. | Users must not access another user's files, cases, or audit logs. | Repository queries and guards must enforce user ownership or admin authorization. |


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

| Concern              | Decision                       | Version                                                                              |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Runtime              | Node.js                        | `22.x LTS`                                                                           |
| Framework            | React                          | `19.x`                                                                               |
| Build tool           | Vite                           | `8.x`                                                                                |
| Language             | TypeScript                     | `5.x`                                                                                |
| Styling              | Tailwind CSS                   | `4.x`                                                                                |
| UI components        | shadcn/ui                      | Package version must be defined in `package.json` by the implementing developer. |
| Routing              | React Router                   | `7.x`                                                                                |
| API client           | Axios                          | `1.x`                                                                                |
| Server state         | TanStack Query                 | `5.x`                                                                                |
| Local UI state       | Zustand                        | `5.x`                                                                                |
| Forms                | React Hook Form                | `7.x`                                                                                |
| Validation           | Zod                            | `4.x`                                                                                |
| Unit/component tests | Vitest + React Testing Library | Vitest `4.x`, RTL `16.x`                                                             |
| Hosting target       | Vercel                         | Managed platform, no application package version.                                    |

Implementation rule:

```text
If a dependency version changes, this table and `package.json` must be updated in the same change.
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
#### 4.3.1 Frontend Implementation Reference Map

The frontend contract is implemented under `src/frontend`. These references allow developers to jump from this README to the exact files that implement each UI responsibility.

| Responsibility | Source path | Notes |
|---|---|---|
| Route registration and protected routes | [`src/frontend/app/routes.tsx`](src/frontend/app/routes.tsx) | Defines `/login`, `/register`, `/app`, `/app/verification/:caseId`, `/app/history`, and `/app/history/:caseId`. |
| Login page | [`src/frontend/features/auth/pages/LoginPage.tsx`](src/frontend/features/auth/pages/LoginPage.tsx) | Handles login form validation, login action, error display, and navigation to `/app`. |
| Register page | [`src/frontend/features/auth/pages/RegisterPage.tsx`](src/frontend/features/auth/pages/RegisterPage.tsx) | Handles account creation form validation, register action, and return navigation to login. |
| Main verification workspace | [`src/frontend/features/verification/pages/VerificationHubPage.tsx`](src/frontend/features/verification/pages/VerificationHubPage.tsx) | Handles text, URL, and image input modes; image upload; verification submission; and recent cases. |
| Verification result page | [`src/frontend/features/verification/pages/VerificationResultPage.tsx`](src/frontend/features/verification/pages/VerificationResultPage.tsx) | Loads one verification report and delegates report rendering to `VerificationReportView`. |
| History page | [`src/frontend/features/history/pages/VerificationHistoryPage.tsx`](src/frontend/features/history/pages/VerificationHistoryPage.tsx) | Loads the current user's previous verification cases and navigates to case detail. |
| History case detail page | [`src/frontend/features/history/pages/VerificationCaseDetailPage.tsx`](src/frontend/features/history/pages/VerificationCaseDetailPage.tsx) | Loads a saved case from history and reuses `VerificationReportView`. |
| Shared report renderer | [`src/frontend/shared/components/report/VerificationReportView.tsx`](src/frontend/shared/components/report/VerificationReportView.tsx) | Renders extracted claim, partial report warning, recommendation, scores, evidence, risk signals, and audit trail. |
| Frontend API client | [`src/frontend/shared/api/verificationApi.ts`](src/frontend/shared/api/verificationApi.ts) | Encapsulates frontend calls for uploads, verification creation, history, and detail. |
| HTTP client and API error normalization | [`src/frontend/shared/api/httpClient.ts`](src/frontend/shared/api/httpClient.ts) | Defines the shared Axios client and `toApiError` behavior. |
| Frontend DTOs/types | [`src/frontend/shared/types/verification.ts`](src/frontend/shared/types/verification.ts) | Defines frontend report, evidence, risk, history, and request types. |
| User-facing recommendation labels | [`src/frontend/shared/components/report/labels.ts`](src/frontend/shared/components/report/labels.ts) | Maps internal recommendation enums to user-facing editorial labels. |

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

### 4.13 Frontend Naming and Component Conventions

| Item                   | Convention                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Page components        | PascalCase with `Page` suffix. Example: `VerificationHubPage`, `VerificationResultPage`.   |
| Reusable UI components | PascalCase. Example: `RecommendationBanner`, `EvidenceList`, `RiskSignalList`.             |
| Hooks                  | camelCase with `use` prefix. Example: `useAuthSession`, `useVerificationHistory`.          |
| API client files       | camelCase or feature-based names under `shared/api`. Example: `verificationApi.ts`.        |
| DTO and type files     | PascalCase or grouped feature names under `shared/types`. Example: `VerificationTypes.ts`. |
| Zustand stores         | camelCase with `Store` suffix. Example: `authStore.ts`, `uiStore.ts`.                      |
| Test files             | Same component or module name with `.test.tsx` or `.spec.tsx`.                             |
| CSS utility usage      | Prefer Tailwind utility classes and shared UI components over custom one-off CSS.          |

Implementation rule:

```text
Frontend files must use names that make the feature and responsibility clear. Components should not combine page orchestration, API calls, formatting, and low-level UI rendering in a single file.
```

### 4.14 Frontend Visual Style and Branding Guidelines

The MVP visual identity must communicate clarity, caution, and editorial trust. It should look like a professional verification workspace, not like an entertainment classifier.

| Element             | Guideline                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary color       | Use a trustworthy blue or blue-slate tone for primary actions, navigation, and active states.                                                             |
| Neutral colors      | Use white, slate, gray, and soft borders for report readability.                                                                                          |
| Warning color       | Use amber or orange for manual review and provider degradation states.                                                                                    |
| High-risk color     | Use red only for strong warning states such as `DO_NOT_PUBLISH_YET`.                                                                                      |
| Success/ready color | Use green only for low-risk positive readiness states such as `READY_FOR_EDITORIAL_REVIEW`.                                                               |
| Typography          | Use a modern sans-serif font. Headings should be clear and compact. Body text must prioritize readability.                                                |
| Spacing             | Use consistent spacing scale. Report sections should have enough whitespace to separate evidence, risks, recommendation, and audit trail.                 |
| Icons               | Use icons only to support meaning, not as the only indicator of status.                                                                                   |
| Logo                | If a final logo exists, it must be placed in the authenticated layout and login/register pages. If no final logo exists, use the text mark `IA Detector`. |
| Accessibility       | Color must not be the only way to communicate risk. Each status must also have text labels.                                                               |
| Data density        | Reports may contain many evidence and audit items, so cards and tables must remain scannable.                                                             |

Recommendation display rule:

```text
The UI must display user-facing labels such as "Ready for editorial review", "Do not publish yet", and "Needs manual review". It must not show internal enum values as the main product language.
```

### 4.15 Frontend Performance Strategy

The frontend must remain responsive during report generation, history loading, and result rendering.

| Concern                  | Strategy                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Lazy loading             | Route-level pages should be lazy loaded during frontend implementation.                                  |
| Code splitting           | Keep feature modules separated by route and domain: auth, verification, history, audit.                  |
| API caching              | Use TanStack Query for server data such as current user, history, case detail, and audit trail.          |
| Avoid duplicate requests | Use query keys based on endpoint and parameters. Disable duplicate submit while verification is running. |
| Image handling           | Validate file type and size before upload. Avoid rendering large raw images in report views.             |
| Memoization              | Use memoization only for expensive derived report summaries or large lists.                              |
| Virtualization           | Not required for MVP unless history or audit trail lists become large.                                   |
| Loading states           | Use skeletons or progress indicators for report generation and case loading.                             |
| Error recovery           | Provide retry actions for failed history or detail loading when appropriate.                             |
| Bundle control           | Avoid adding large UI or charting libraries unless the component is required by the MVP.                 |

Implementation rule:

```text
Performance optimizations must not hide verification context. Evidence, risk signals, recommendation reason, and trace IDs must remain accessible.
```

---

## 5. Backend Module Contracts

### 5.1 Backend Technology Contract

| Concern                   | Decision                                                                       | Version                                           |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Runtime                   | Node.js                                                                        | `22.x LTS`                                        |
| Framework                 | NestJS                                                                         | `^11.0.0`                                         |
| Language                  | TypeScript                                                                     | `^5.0.0`                                          |
| ORM                       | Prisma                                                                         | `^7.8.0`                                          |
| Prisma PostgreSQL adapter | `@prisma/adapter-pg`                                                           | `^7.8.0`                                          |
| Database                  | Local PostgreSQL for MVP; managed PostgreSQL compatible with Supabase for deployment | PostgreSQL `15+`                                  |
| PostgreSQL driver         | `pg`                                                                           | `^8.21.0`                                         |
| Authentication            | JWT access token + httpOnly refresh token                                      | `@nestjs/jwt ^11.0.2`                             |
| Password hashing          | Argon2id using `argon2` package                                                | `^0.44.0`                                         |
| Environment variables     | `dotenv`                                                                       | `^17.4.2`                                         |
| API documentation         | OpenAPI / Swagger                                                              | Nest Swagger-compatible                           |
| Testing                   | TypeScript validation, Prisma validation, frontend Vitest tests, and manual API smoke tests | Vitest `4.x` for frontend tests                   |
| Backend hosting target    | Render                                                                         | Managed platform, no application package version. |

Implementation rule:

```text
If a dependency version changes, this table and `package.json` must be updated in the same change.
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


### 5.2.1 Feature-to-Module Map

This table tells developers where each major backend responsibility belongs. It prevents a junior developer from guessing where to place code.

| Feature / Responsibility | Controller Boundary | Application Service(s) | Repository / Infrastructure | Main DTOs |
|---|---|---|---|---|
| Health check | `HealthController` | `HealthService` | `PrismaService.checkConnection()` | Health response DTO shape defined by controller/service. |
| Registration | `AuthController` | `RegisterService`, `PasswordHasher` | `UserRepository` | `RegisterRequestDTO`, `UserDTO` |
| Login | `AuthController` | `LoginService`, `PasswordHasher` | `UserRepository`, `RefreshTokenRepository` for session rotation | `LoginRequestDTO`, `AuthResponseDTO` |
| Current user | `AuthController` + `JwtAuthGuard` | Auth session lookup service when separated | `UserRepository` | `AuthenticatedRequest`, `UserDTO` |
| Image upload | Upload controller | `UploadImageService` | `UploadedFileRepository`, storage service | `UploadedFileDTO` |
| Verification creation | `VerificationController` | `CreateVerificationCaseService` and verification pipeline services | `VerificationRepository`, `EvidenceRepository`, `RiskSignalRepository`, `AuditLogRepository`, cache repository | `CreateVerificationRequestDTO`, `VerificationAnalysisReportDTO` |
| Verification history | `VerificationController` | `ListVerificationHistoryService` | `VerificationRepository` | `VerificationHistoryItemDTO` |
| Verification detail | `VerificationController` | `GetVerificationCaseService` | `VerificationRepository` | `VerificationAnalysisReportDTO` |
| Audit trail | Audit controller or report detail panel | `GetAuditTrailService` | `AuditLogRepository` | `AuditTrailEventDTO` |
| External evidence | No controller access | `FactCheckEvidenceService` | Provider port, adapter, cache repository | `EvidenceSearchResult`, `EvidenceCandidate`, `EvidenceDTO` |

Placement rule:

```text
If a developer cannot identify the correct row in this table for a change, they must update the design contract before implementing the change.
```

### 5.3 Module Contract — `CreateVerificationCaseService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/verification/CreateVerificationCaseService.ts` |
| Responsibility | Coordinates the complete verification analysis pipeline. |
| Inputs | `CreateVerificationRequestDTO`, `currentUserId`, `traceId` |
| Output | `VerificationAnalysisReportDTO` |
| Collaborators | `InputHandlerStrategyFactory`, `ClaimExtractionService`, `ClaimNormalizationService`, `FactCheckEvidenceService`, `RiskAnalysisService`, `EvidenceScoreService`, `RiskScoreService`, `SourceAgreementService`, `EditorialRecommendationService`, repositories |
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

### 5.6 Module Contract — `ClaimNormalizationService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/claims/ClaimNormalizationService.ts` |
| Responsibility | Normalizes the extracted claim into a stable query string for cache lookup and evidence search. |
| Input | `ExtractedClaimResult.extractedClaim` |
| Output | `normalizedClaim` |
| Collaborators | None required for MVP. |
| Must Not | Decide truth/falsity. Call external providers. Persist data directly. Change the meaning of the extracted claim. |
| Failure Behavior | If the normalized claim is empty, case is stored as `FAILED`, audit event `VERIFICATION_FAILED` is written, and endpoint returns `422`. |

### 5.7 Module Contract — `FactCheckEvidenceService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/evidence/FactCheckEvidenceService.ts` |
| Responsibility | Finds evidence related to the normalized claim. |
| Input | `normalizedClaim` |
| Output | `EvidenceSearchResult` |
| Collaborators | `FactCheckCacheRepository`, `FactCheckProviderPort`, `EvidenceRepository` |
| Must Not | Expose provider API key. Return raw provider JSON. Treat empty evidence as false. Depend directly on concrete provider clients. |
| Failure Behavior | Provider failure returns `providerStatus=UNAVAILABLE` and either `cacheStatus=MISS` or `cacheStatus=STALE_HIT`, writes `EVIDENCE_SEARCH_FAILED`, and continues report generation. `RiskAnalysisService` is responsible for creating risk signal `PROVIDER_UNAVAILABLE`. |

### 5.8 Module Contract — `RiskAnalysisService`

| Item | Contract |
|---|---|
| Path | `src/backend/application/risk/RiskAnalysisService.ts` |
| Responsibility | Produces risk signals based on claim, evidence, input metadata, and provider status. |
| Input | Claim, evidence candidates, input metadata, provider status, cache status |
| Output | `RiskSignalDTO[]` |
| Must Detect | `NO_RELEVANT_EVIDENCE`, `CONTRADICTORY_EVIDENCE`, `LOW_SOURCE_AGREEMENT`, `PROVIDER_UNAVAILABLE`, `OCR_UNCERTAINTY`, `UNKNOWN_SOURCE`, `EMOTIONAL_LANGUAGE`, `RECENT_BREAKING_CLAIM`, `SOURCE_CONTENT_UNAVAILABLE` |
| Must Not | Produce recommendation directly. Decide truth/falsity. |

### 5.9 Module Contract — Scoring Services

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

### 5.10 Module Contract — `AIAmbassador`

| Item | Contract |
|---|---|
| Path | `src/backend/application/ai/AIAmbassador.ts` |
| Responsibility | Single backend boundary for claim extraction, OCR text extraction, and AI-assisted risk hints. |
| Inputs | Text content or uploaded file metadata. |
| Outputs | Normalized internal results only. |
| Collaborators | `MockAIConnector`, `MockOCRConnector`, optional future provider connector, `AIResponseAdapter`, `RetryManager` |
| Must Not | Leak provider-specific response format outside `application/ai`. |
| Failure Behavior | Applies timeout, retry, adapter, and fallback behavior from integration contract. |

### 5.11 Module Contract — `GlobalExceptionFilter`

| Item | Contract |
|---|---|
| Path | `src/backend/shared/errors/GlobalExceptionFilter.ts` |
| Responsibility | Converts thrown errors into `ErrorResponseDTO`. |
| Input | Typed application exception or unexpected exception. |
| Output | `ErrorResponseDTO` with `traceId`, `statusCode`, `errorCode`, and safe message. |
| Must Not | Return stack traces, secrets, raw provider errors, or database internals. |

### 5.12 Repository Contracts

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

### 5.13 Backend Runtime and Data Operations Contract

This section defines operational backend and data-layer decisions required for local MVP execution and later deployment.

| Concern                | MVP Decision                                                                                              | Implementation Rule                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Database migrations    | Prisma migrations are the source of database schema evolution once implementation starts.                 | Migrations must be generated from `prisma/schema.prisma` and reviewed before execution.                                             |
| Schema validation      | `prisma format` and `prisma validate` are required before commits that modify the data model.             | The schema must remain aligned with the README and DBML.                                                                            |
| Seed data              | Seed data may be used for local demo accounts, mock evidence, and repeatable demo cases.                  | Seed data must not contain real personal data or private participant information.                                                   |
| Rollback strategy | Local MVP rollback is handled by reverting commits and reapplying migrations from a clean local database. | Production-style rollback scripts are not required for MVP, but migration changes must be small and reviewable. |
| Connection pooling     | Local MVP uses the default Prisma/PostgreSQL connection behavior.                                         | If deployed to Supabase or Render, connection limits must be reviewed and pooling configured according to the provider environment. |
| Long-running processes | Verification analysis must run synchronously for MVP unless response time becomes unacceptable.           | If processing grows, the pipeline can later move to a queue-based worker model.                                                     |
| Queues                 | No queue is required for the first local MVP.                                                             | Queue design is outside MVP scope unless provider latency blocks the demo flow.                                                          |
| Threading | Node.js event loop is sufficient for MVP. | CPU-heavy AI, OCR, or image processing must not be added to the main request thread without reassessment. |
| Caching                | Fact-check evidence cache is stored in `fact_check_cache`.                                                | Fresh cache may be used as `HIT`; expired cache may only be used as `STALE_HIT` after provider failure.                             |
| Backups                | Local MVP does not require automated backups.                                                             | For deployed environments, database backups must be enabled through the managed provider.                                           |
| Secrets                | Secrets must be read from environment variables through centralized configuration.                        | Secrets must not be hardcoded, logged, committed, or returned in API responses.                                                     |

Implementation rule:

```text
Operational shortcuts are allowed for local MVP only when they do not contradict security, auditability, data integrity, or README-defined contracts.
```

### 5.14 Local MVP Data Initialization Contract

The MVP must be easy to run locally for development, review, and demo. Local execution uses Docker for PostgreSQL and Prisma for schema synchronization.

| Artifact | Purpose | Required for MVP |
|---|---|---|
| `.env.example` | Documents required environment variables without real secrets. | Yes |
| `.env` | Local developer-specific environment values. | Required locally but must not be committed. |
| `prisma/schema.prisma` | Defines the database model used by Prisma. | Yes |
| `database/dbml/ia-detector.dbml` | Documents the relational model for review. | Yes |
| `prisma.config.ts` | Loads Prisma schema location and `DATABASE_URL`. | Yes |
| Docker PostgreSQL container | Runs local PostgreSQL database. | Yes for the standard local setup. |
| Prisma Client | Generated database client used by backend repositories. | Yes |
| Mock providers | Allow demo without real AI/OCR/fact-checking credentials. | Yes |
| Local run scripts | Start backend and synchronize database schema. | Yes |

Standard local database container:

```powershell
docker run --name ia-detector-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ia_detector `
  -p 5432:5432 `
  -d postgres:15
```

Required local `.env` shape:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_detector?schema=public"
BACKEND_PORT=3000
FRONTEND_URL="http://localhost:5173"
JWT_ACCESS_SECRET="replace-with-local-development-secret"
JWT_ACCESS_EXPIRES_IN="15m"
```

Backend setup flow from a clean clone:

```powershell
npm.cmd install
docker start ia-detector-postgres
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run dev:backend
```

If the Docker container does not exist yet, use the `docker run` command above instead of `docker start`.

Required validation flow:

```powershell
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run validate
```

Required backend smoke test flow:

```powershell
# 1. Health
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/health"

# 2. Login
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"demo@iadetector.local","password":"Password123!"}'

# 3. Create verification
$report = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/verifications" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" } `
  -ContentType "application/json" `
  -Body '{"inputType":"TEXT","text":"Comunicado oficial confirma una nueva medida sanitaria nacional respaldada por varias fuentes relevantes."}'

# 4. History
$history = Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/verifications" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }

# 5. Detail
$caseId = $history[0].caseId

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/verifications/$caseId" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Rules:

| Rule | Requirement |
|---|---|
| No real secrets | `.env.example` must contain placeholders only. |
| No committed `.env` | `.env` must remain local and must not be committed. |
| No committed dependencies | `node_modules/` must not be committed. |
| Repeatable demo | Mock behavior should make the same type of input produce predictable report scenarios. |
| Docker clarity | The README must state whether the local database is Docker-based or provider-based. |
| README alignment | When scripts, ports, environment variables, or local services change, this section must be updated. |
| Safe local execution | Data reset commands must clearly explain when local data will be deleted. |


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


### 6.1.1 Endpoint Coverage Rule

The API contract defines the endpoints required by the MVP design. Each endpoint must have a documented method, path, authentication rule, request DTO, response DTO, error behavior, persistence effect, and acceptance criterion.

| Endpoint | Required Behavior | Primary Contract Section |
|---|---|---|
| `GET /api/health` | Confirms backend availability and database connectivity without requiring authentication. | 6.3 |
| `POST /api/auth/register` | Creates a `JOURNALIST` user after validating input and hashing the password. | 6.4 |
| `POST /api/auth/login` | Validates credentials and creates an authenticated session. | 6.5 |
| `POST /api/auth/refresh` | Rotates refresh tokens and returns a new access token. | 6.6 |
| `POST /api/auth/logout` | Revokes the current refresh token and ends the session. | 6.7 |
| `GET /api/auth/me` | Returns the authenticated user from the access token. | 6.8 |
| `POST /api/uploads/image` | Uploads an image or screenshot and returns `UploadedFileDTO`. | 6.9 |
| `POST /api/verifications` | Creates a verification case for `TEXT`, `URL`, or `IMAGE`. | 6.10 |
| `GET /api/verifications` | Returns paginated verification history for the current user. | 6.11 |
| `GET /api/verifications/:caseId` | Returns complete report detail when the user has access. | 6.12 |
| `GET /api/audit/:caseId` | Returns audit events for a case when the user has access. | 6.13 |

Endpoint rule:

```text
An endpoint is not design-complete unless the README defines its request, response, authorization requirement, validation rules, error responses, persistence behavior, and acceptance criteria.
```

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

The database model must be defined in [Prisma schema](prisma/schema.prisma) and documented in [DBML model](database/dbml/ia-detector.dbml).

Unless a constraint is explicitly described as database-level, the MVP may enforce it at application level through DTO validation, service rules, and repository guards. The README still defines the required behavior regardless of where the enforcement is implemented.

### 7.1 Enum Contract

| Enum | Values | Purpose |
|---|---|---|
| `UserRole` | `JOURNALIST`, `ADMIN` | Controls authorization behavior. |
| `UserStatus` | `ACTIVE`, `DISABLED` | Tracks whether a user can authenticate and use protected routes. |
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
| Main Columns | `id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`, `deleted_at` |
| Constraints | `email` unique. `password_hash` required. `status` defaults to `ACTIVE`. Disabled users cannot log in. |
| Relationships | One user has many refresh tokens, uploaded files, verification cases, and audit logs. |
| Indexes | `email` unique for login. `role` optional for admin queries. `status` optional for authentication filtering. |

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
| Main Columns | `id`, `user_id`, `input_type`, `raw_input`, `uploaded_file_id`, `original_input_preview`, `extracted_claim`, `status`, `evidence_score`, `risk_score`, `source_agreement`, `recommended_action`, `recommendation_reason`, `created_at`, `updated_at`, `completed_at`, `failed_at` |
| Constraints | `uploaded_file_id` required only when `input_type=IMAGE`. Scores must be 0–100. `recommended_action` exists only after report generation. |
| Relationships | One case belongs to one user. One case has many evidence results, risk signals, and audit logs. |
| Lifecycle | Case is inserted as `PROCESSING`. It becomes `COMPLETED` when the report is generated or `FAILED` when an unrecoverable error occurs. |
| Indexes | `(user_id, created_at)` for history. `status` for technical filtering. `recommended_action` for editorial filtering. `uploaded_file_id` for image case lookup. |

### 7.6 Table — `evidence_results`

| Item | Contract |
|---|---|
| Purpose | Stores normalized evidence found for one verification case. |
| Used By | `POST /api/verifications`, `GET /api/verifications/:caseId`. |
| Main Columns | `id`, `case_id`, `title`, `source_name`, `source_url`, `publisher`, `published_at`, `summary`, `relevance_score`, `agreement`, `provider`, `created_at` |
| Constraints | `source_url` required. `relevance_score` must be 0–100. `agreement` defaults to `UNKNOWN`. |
| Relationships | Many evidence rows belong to one verification case. |
| Indexes | `case_id` for report loading. `(case_id, source_url)` unique to avoid duplicate evidence rows for the same case and source. `source_url` for source lookup. `provider` for provider diagnostics. `agreement` optional for scoring analysis. |

### 7.7 Table — `risk_signals`

| Item | Contract |
|---|---|
| Purpose | Stores warning signals detected during verification. |
| Used By | `POST /api/verifications`, `GET /api/verifications/:caseId`. |
| Main Columns | `id`, `case_id`, `type`, `severity`, `description`, `created_at` |
| Constraints | `type` must match `RiskSignalType`. `severity` must be `LOW`, `MEDIUM`, or `HIGH`. A verification case should not store duplicate risk signal types. |
| Relationships | Many risk signals belong to one verification case. |
| Indexes | `case_id` for report loading. `(case_id, type)` unique to avoid duplicate risk signal types per case. `type` for business-rule diagnostics. `severity` optional for filtering high-risk cases. |

### 7.8 Table — `audit_logs`

| Item | Contract |
|---|---|
| Purpose | Stores traceable workflow events. |
| Used By | Auth, upload, verification, and audit endpoints. |
| Main Columns | `id`, `case_id`, `user_id`, `event_type`, `message`, `trace_id`, `metadata`, `created_at` |
| Constraints | `trace_id` required for backend workflow events. Audit logs must not store secrets. |
| Relationships | Audit log may belong to a case and/or user. |
| Indexes | `(case_id, created_at)` for audit trail. `user_id` for user activity. `trace_id` for debugging. `event_type` for event diagnostics. |

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
| Participants | `FactCheckProviderPort`, `GoogleFactCheckClient`, `GoogleFactCheckAdapter`, `MockFactCheckClient`, `FactCheckEvidenceService` |
| Collaborations | `FactCheckEvidenceService` depends on `FactCheckProviderPort`. Infrastructure implementations call the provider or mock, then adapters normalize provider-specific output into `EvidenceCandidate[]`. The service persists only normalized evidence. |
| Implementation Rules | Controllers and application services must not return or persist raw provider JSON as report data. Application services must not import concrete provider clients directly. |
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

### 10.8 OWASP-Oriented Security Checklist

The MVP must follow practical OWASP-oriented security rules for authentication, authorization, input validation, upload handling, error handling, and dependency control.

| Area                 | Requirement                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication       | Passwords must be hashed with Argon2id. Access tokens must be short-lived. Refresh tokens must be stored as httpOnly cookies.                           |
| Authorization        | Every protected resource must validate ownership or `ADMIN` role before returning data.                                                                 |
| Input validation     | All request bodies, route params, query params, and upload metadata must be validated before reaching application services.                             |
| Output encoding      | User-provided content must be rendered safely in the frontend and must not be injected as raw HTML.                                                     |
| File upload security | Uploaded files must be restricted by MIME type, size, authenticated ownership, and storage path isolation.                                              |
| Error handling       | Errors must return safe messages and `traceId`. Stack traces, secrets, provider keys, database internals, and raw provider errors must not be returned. |
| Secrets management   | Secrets must come from environment variables and must not be committed, logged, or exposed to frontend code.                                            |
| Dependency security  | Dependencies must be kept minimal and reviewed before adding new packages.                                                                              |
| Rate limiting        | Authentication and verification endpoints should apply rate limiting before production deployment.                                                      |
| Auditability         | Security-relevant actions must write audit events when appropriate.                                                                                     |

Implementation rule:

```text
Security controls must be implemented in backend guards, validation layers, repositories, upload services, and centralized error handling. They must not depend only on frontend checks.
```

### 10.9 Privacy and Data Minimization Rules

IA Detector handles user accounts, submitted claims, uploaded image metadata, generated evidence, risk signals, and audit trails. The MVP must store only what is required to support verification, history, authorization, and traceability.

| Data Type         | Privacy Rule                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User account data | Store only name, email, role, password hash, and timestamps required for authentication and authorization.                                               |
| Passwords         | Never store plaintext passwords. Never log passwords.                                                                                                    |
| Refresh tokens    | Store only hashed refresh tokens. Never store raw refresh token values in the database.                                                                  |
| Submitted text    | Store only the original preview required for history and report context, not unnecessary full private content unless implementation explicitly needs it. |
| Uploaded files    | Store file metadata and storage path. Access must be restricted to the owner or `ADMIN`.                                                                 |
| Evidence results  | Store normalized evidence fields only. Do not store raw provider payloads as report data.                                                                |
| Audit logs        | Store event type, message, trace ID, user/case references, and timestamp. Do not store secrets or sensitive raw payloads.                                |
| UX testing data   | Do not store real participant personal data in seed data or product tables.                                                                              |
| Logs              | Logs must avoid passwords, tokens, provider credentials, raw uploaded file contents, and unnecessary submitted content.                                  |

Data minimization rule:

```text
When there is a choice between storing raw submitted content and storing a safe preview, the MVP should prefer the safe preview unless full content is required by an implemented use case.
```

### 10.10 Masking and Safe Display Rules

The frontend and backend must avoid exposing sensitive values in user-facing screens, logs, errors, and debugging output.

| Value                 | Display Rule                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Password              | Never displayed, logged, or returned.                                                                                                     |
| Access token          | Never displayed, stored in persistent browser storage, logged, or returned after initial auth response except through expected auth flow. |
| Refresh token         | Never accessible to frontend JavaScript. Stored only as httpOnly cookie.                                                                  |
| Provider API keys     | Never displayed, returned, logged, or bundled into frontend code.                                                                         |
| Database URL          | Never displayed, returned, or logged.                                                                                                     |
| Trace ID              | May be displayed to users for support and debugging.                                                                                      |
| Email                 | May be displayed to the authenticated user. Admin-wide display requires role-based access.                                                |
| Uploaded file path    | Must not be exposed as a public unrestricted URL unless the storage layer enforces safe access.                                           |
| Raw provider response | Must not be displayed in product UI. Only normalized evidence DTOs may be displayed.                                                      |

Implementation rule:

```text
Debug information may exist in local development logs only when it does not expose secrets, tokens, passwords, raw provider payloads, or private submitted content.
```

### 10.11 Session Storage and Token Handling Rules

| Concern                   | Rule                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token storage      | Access token is stored in memory only.                                                                                                          |
| Forbidden browser storage | Access token must not be stored in `localStorage`, `sessionStorage`, IndexedDB, persistent Zustand stores, or cookies accessible to JavaScript. |
| Refresh token storage     | Refresh token must be stored by the backend as an httpOnly cookie.                                                                              |
| Session refresh           | Frontend refreshes the access token through `POST /api/auth/refresh`.                                                                           |
| Logout                    | Logout revokes the refresh token, clears the refresh cookie, and clears in-memory access token state.                                           |
| Page reload               | Page reload loses in-memory access token and must rely on refresh flow.                                                                         |
| Expired access token      | API client should attempt refresh once, then redirect to `/login` if refresh fails.                                                             |
| Revoked refresh token     | Backend returns `401` and frontend clears auth state.                                                                                           |

Implementation rule:

```text
Authentication state must be easy to clear and must not survive logout through persistent browser storage.
```

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

The backend should expose or record the following operational metrics as part of the MVP observability contract:

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
| Frontend Web App | React 19, TypeScript 5, Vite 8 | Provides user interface for authentication, verification, history, and reports. |
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

UX evidence is controlled: only final prototype exports and real Maze results are committed. No UX metrics are documented without participant results. The results are used as evidence for usability validation and as future refinement input.

| Artifact                 | Link                                                                                                                    | Purpose                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Figma Prototype          | [Open Figma prototype](https://www.figma.com/proto/mvwLNkVDtvMAkDZA6vkggb/IA-Detector?node-id=0-1&t=76UhFVuQWoHqdmfs-1) | Interactive prototype for the MVP flow.                                     |
| Maze Test                | [Open Maze test](https://t.maze.co/510125135)                                                                           | Usability test for navigation and comprehension.                            |
| Prototype Assets Folder  | [Open prototype assets](docs/assets/prototype/)                                                                         | Final exported screens are stored here.                       |
| UX Testing Assets Folder | [Open UX testing assets](docs/assets/ux-testing/)                                                                       | Maze result evidence is stored here. |

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

Final screenshots are stored in [prototype assets](docs/assets/prototype/).

### 13.4 UX Testing Evidence Rule

UX metrics must not be manually invented.

Maze results are added only after real participants complete the test. When available, exported evidence must be stored in [UX testing assets](docs/assets/ux-testing/).

### 13.5 UX Test Context

| Item | Value |
|---|---|
| Tool | Maze |
| Prototype source | Figma prototype |
| Participants | 5 |
| Participant profile | Design students external to the project team |
| Main objective | Validate usability, navigation, comprehension of the report, and clarity of the verification workflow |
| Evidence collected | Task metrics, response summaries, heatmaps, satisfaction ratings, and open comments |
| Documentation scope | Metrics, observations, heatmaps, satisfaction ratings, and participant comments. |

### 13.6 Participant Background

The first question measured familiarity with verification or fact-checking tools.

![Participant familiarity](docs/assets/ux-testing/Test_P1.jpg)

| Answer | Result |
|---|---:|
| Little familiar | 60% (3 participants) |
| Very familiar | 20% (1 participant) |
| Unfamiliar | 20% (1 participant) |
| Quite familiar | 0% (0 participants) |

**Interpretation:** most participants were not expert users of fact-checking tools. This supports the need for clear terminology and a guided report structure.

### 13.7 UX Task Summary

| Task ID | Task Goal | Starting Screen | Success Criteria | Evidence |
|---|---|---|---|---|
| `UX-TASK-01` | Access the application through login/register flow. | Login screen | Participant reaches the main verification workspace. | [Metrics](docs/assets/ux-testing/Test_P2.1.png), [responses](docs/assets/ux-testing/Test_P2.2.png), [heatmap 1](docs/assets/ux-testing/Test_P2_Heatmap1.png), [heatmap 2](docs/assets/ux-testing/Test_P2_Heatmap2.jpg) |
| `UX-TASK-02` | Submit suspicious content for analysis. | Main verification screen | Participant selects or uses the content input, starts analysis, reaches processing/result flow. | [Metrics](docs/assets/ux-testing/Test_P3.1.png), [responses](docs/assets/ux-testing/Test_P3.2.png), [heatmap 1](docs/assets/ux-testing/Test_P3_heatmap1.jpg), [heatmap 2](docs/assets/ux-testing/Test_P3_heatmap2.jpg), [heatmap 3](docs/assets/ux-testing/Test_P3_heatmap3.jpg) |
| `UX-TASK-03` | Understand processing and report meaning. | Processing/result screens | Participant recognizes that the system generates an analysis report and can interpret the editorial recommendation. | [Processing answer](docs/assets/ux-testing/Test_P3.3.jpg), [recommendation answer](docs/assets/ux-testing/Test_P3.4.jpg) |
| `UX-TASK-04` | Find previous verification cases. | Main screen or history screen | Participant opens history and accesses a previous report. | [Task evidence](docs/assets/ux-testing/Test_P4.1.png), [responses](docs/assets/ux-testing/Test_P4.2.png), [heatmap 1](docs/assets/ux-testing/Test_P4_heatmap1.jpg), [heatmap 2](docs/assets/ux-testing/Test_P4_heatmap2.jpg) |
| `UX-TASK-05` | Confirm understanding of the report nature and overall clarity. | Final survey | Participant distinguishes editorial recommendation from absolute truth and rates clarity/orientation. | [report nature](docs/assets/ux-testing/Test_P5.1.jpg), [clarity](docs/assets/ux-testing/Test_P5.2.jpg), [orientation](docs/assets/ux-testing/Test_P5.3.jpg), [comments](docs/assets/ux-testing/Test_P5.4.png) |

### 13.8 Task 1 — Register / Access the Application

![Task 1 metrics](docs/assets/ux-testing/Test_P2.1.png)

![Task 1 responses](docs/assets/ux-testing/Test_P2.2.png)

| Metric | Result |
|---|---:|
| Success rate | 100% |
| Drop-off | 0% |
| Average duration | 28.3 seconds |
| Misclick rate | 77.8% |
| Responses | 5 |

**Heatmaps**

![Task 1 heatmap login](docs/assets/ux-testing/Test_P2_Heatmap1.png)

![Task 1 heatmap register](docs/assets/ux-testing/Test_P2_Heatmap2.jpg)

**Result:** all participants completed the access task successfully. Heatmaps show interactions around the login fields, register link, and registration form fields. The task had no drop-off and all 5 responses were recorded.

### 13.9 Task 2 — Analyze Suspicious Content

![Task 2 metrics](docs/assets/ux-testing/Test_P3.1.png)

![Task 2 responses](docs/assets/ux-testing/Test_P3.2.png)

| Metric | Result |
|---|---:|
| Success rate | 100% |
| Drop-off | 0% |
| Average duration | 32.1 seconds |
| Misclick rate | 72.5% |
| Responses | 5 |

**Heatmaps**

![Task 2 heatmap selector](docs/assets/ux-testing/Test_P3_heatmap1.jpg)

![Task 2 heatmap input and analyze button](docs/assets/ux-testing/Test_P3_heatmap2.jpg)

![Task 2 heatmap processing result button](docs/assets/ux-testing/Test_P3_heatmap3.jpg)

**Result:** all participants completed the analysis flow. Heatmaps show activity around the content type selector, input/upload area, analysis button, and result action. The task had 100% success and no drop-off.

### 13.10 Comprehension Questions — Processing and Report Meaning

![Processing comprehension](docs/assets/ux-testing/Test_P3.3.jpg)

| Question | Correct interpretation | Result |
|---|---|---:|
| What is happening on the processing screen? | The system is generating an analysis report. | 100% |

**Result:** all participants understood that the system was generating a report, not publishing or deleting content.

![Editorial recommendation comprehension](docs/assets/ux-testing/Test_P3.4.jpg)

| Question | Correct interpretation | Result |
|---|---|---:|
| What does the recommendation mean? | The content may continue or not depending on editorial review. | 80% |

**Result:** 4 of 5 participants correctly interpreted the editorial recommendation. One participant selected `No está claro`.

### 13.11 Task 3 — Review Previous Searches in History

![Task 3 instruction and duration](docs/assets/ux-testing/Test_P4.1.png)

![Task 3 responses](docs/assets/ux-testing/Test_P4.2.png)

| Metric | Result |
|---|---:|
| Average duration | 45 seconds |
| Responses | 5 |

**Heatmaps**

![Task 3 heatmap history navigation](docs/assets/ux-testing/Test_P4_heatmap1.jpg)

![Task 3 heatmap open result](docs/assets/ux-testing/Test_P4_heatmap2.jpg)

**Result:** users identified the history entry point and opened a previous analysis. This task had the longest average duration among the reported task flows.

### 13.12 Final Comprehension and Satisfaction Questions

![Report nature comprehension](docs/assets/ux-testing/Test_P5.1.jpg)

| Answer | Result |
|---|---:|
| Recomendación editorial | 100% |
| Verdad absoluta | 0% |
| No se entiende | 0% |

**Result:** all participants identified the output as an editorial recommendation instead of an absolute truth decision.

![General clarity rating](docs/assets/ux-testing/Test_P5.2.jpg)

| Rating | Result |
|---|---:|
| 3 | 40% |
| 4 | 20% |
| 5 | 40% |

**Average clarity:** 4.0 / 5

![Orientation rating](docs/assets/ux-testing/Test_P5.3.jpg)

| Rating | Result |
|---|---:|
| 6 | 20% |
| 7 | 20% |
| 8 | 20% |
| 9 | 20% |
| 10 | 20% |

**Average orientation:** 8.0 / 10

![Open comments](docs/assets/ux-testing/Test_P5.4.png)

**Open comments received:**

- "todo bien gente, muy bonito su proyecto. Me parece muy intuitivo"
- "Ninguna, en general es intuitivo"
- "Un poco vago el resultado, pero en general bien"
- "Mucho texto en pantalla de subida de archivos"
- "Creo que el flujo me enredó un toque"

### 13.13 UX Results Summary

| Result ID | Evidence | Result observed |
|---|---|---|
| `UX-R01` | Task 1 metrics and heatmaps | Access flow reached 100% success with 0% drop-off and an average duration of 28.3 seconds. |
| `UX-R02` | Task 2 metrics and heatmaps | Suspicious content analysis flow reached 100% success with 0% drop-off and an average duration of 32.1 seconds. |
| `UX-R03` | Processing comprehension question | 100% of participants understood that the system generates an analysis report during processing. |
| `UX-R04` | Editorial recommendation question | 80% of participants correctly interpreted the editorial recommendation; 20% selected `No está claro`. |
| `UX-R05` | History task evidence | Participants opened previous analysis results from history. The average duration was 45 seconds. |
| `UX-R06` | Final report nature question | 100% of participants understood that IA Detector provides an editorial recommendation rather than an absolute truth verdict. |
| `UX-R07` | Final ratings | Average general clarity was 4.0 / 5 and average orientation was 8.0 / 10. |
| `UX-R08` | Open comments | Participants described the project as intuitive overall, while also mentioning text density, report vagueness, and some flow confusion. |

### 13.14 UX Testing Conclusion

The UX test results support the prototype's ability to communicate the main IA Detector workflow. The access and analysis tasks reached 100% completion, the processing screen was correctly understood by all participants, and all participants recognized the report as an editorial recommendation rather than an absolute truth verdict. The final survey produced an average clarity rating of 4.0 / 5 and an average orientation rating of 8.0 / 10.

---

## 14. Deployment Contract

### 14.1 Repository Validation Contract

The repository must contain the design contract, Prisma schema, DBML model, and validation scripts.

Required validation command:

```powershell
npm.cmd run validate
```

This command runs:

```text
prisma format && prisma validate
```

#### 14.1.1 Local MVP Execution on Windows

The repository includes a Windows helper script for local MVP execution:

```powershell
./run-app-windows.bat
```

The script is intended for local demo use. It performs the following sequence:

1. Moves the terminal to the project folder.
2. Checks that `npm` is available.
3. Installs dependencies with `npm install` when `node_modules/` does not exist.
4. Starts the local Prisma development database helper command.
5. Runs Prisma generation and schema push commands.
6. Opens one terminal for the backend with `npm run dev:backend`.
7. Opens one terminal for the frontend with `npm run dev:frontend`.
8. Prints the local URLs for frontend, backend API, and health check.

Manual equivalent commands:

```powershell
npm install
npm run db:generate
npm run db:push
npm run dev:backend
npm run dev:frontend
```

Expected local URLs:

```text
Frontend: http://localhost:5173
Backend API: http://localhost:3000/api
Health: http://localhost:3000/api/health
```

Developer note: if the `.bat` script fails without enough detail, run the manual commands one by one so the failing step can be identified.

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

Environment variables are split by responsibility: local development, authentication, storage, external providers, frontend API configuration, and deployment. A developer must configure every variable required by the feature being run and must document safe placeholders in `.env.example`.

#### Local Backend Variables

| Variable | Used By | Required In | Example / Format | Purpose |
|---|---|---|---|---|
| `DATABASE_URL` | Prisma / Backend | Local, staging, production | `postgresql://postgres:postgres@localhost:5432/ia_detector?schema=public` | PostgreSQL connection string. |
| `BACKEND_PORT` | Backend | Local | `3000` | Port used by NestJS backend. |
| `FRONTEND_URL` | Backend | Local, staging, production | `http://localhost:5173` | Allowed frontend origin for CORS. |
| `JWT_ACCESS_SECRET` | Backend | Local, staging, production | `replace-with-secure-secret` | Signs JWT access tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Backend | Local, staging, production | `15m` | Access token expiration duration. |

#### Frontend API Variable

| Variable | Used By | Required In | Example / Format | Purpose |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend | Local, staging, production | `http://localhost:3000/api` | API base URL used by the Vite/React frontend. |

#### Deployment and Extended MVP Variables

| Variable | Used By | Required When | Purpose |
|---|---|---|---|
| `BACKEND_URL` | Frontend / deployment config | Deployed frontend | Public backend API base URL. |
| `JWT_REFRESH_SECRET` | Backend | Refresh token flow | Signs refresh tokens. |
| `SUPABASE_URL` | Backend | Supabase integration is enabled | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase Storage or Supabase backend operations are enabled | Backend-only Supabase service key. |
| `SUPABASE_STORAGE_BUCKET` | Backend | Image upload | Upload bucket name. |
| `FACT_CHECK_MODE` | Backend | Evidence provider mode | `mock` or `live`. |
| `GOOGLE_FACT_CHECK_API_KEY` | Backend | Live fact-check provider is enabled | Google Fact Check API key. |
| `FACT_CHECK_TIMEOUT_SECONDS` | Backend | Live fact-check provider is enabled | Provider timeout. |
| `FACT_CHECK_MAX_RETRIES` | Backend | Live fact-check provider is enabled | Provider retry count. |
| `FACT_CHECK_CACHE_TTL_MINUTES` | Backend | Fact-check cache | Cache duration. |
| `AI_MODE` | Backend | AI/OCR provider mode | `mock` or `live`. |
| `AI_TIMEOUT_SECONDS` | Backend | AI/OCR provider is enabled | AI/OCR timeout. |
| `AI_MAX_RETRIES` | Backend | AI/OCR provider is enabled | AI/OCR retry count. |
| `MAX_IMAGE_SIZE_MB` | Backend | Image upload | Upload validation limit. |

Security rules:

```text
.env is local only and must not be committed.
.env.example may be committed only with placeholders.
Production secrets must never use the local-development values.
```


### 14.5 CI/CD Pipeline Contract

The CI/CD pipeline must run the following stages:

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

### 14.7 CI/CD Quality Gates

The project must use quality gates to prevent undocumented, unsafe, or architecturally inconsistent changes from entering the main branch.

| Gate                   | Applies When                                                                                                                   | Required Validation                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| README contract gate   | Any change affects architecture, API, DTOs, data model, frontend routes, backend services, security, deployment, or MVP scope. | README must be updated in the same commit.                                                        |
| Database design gate   | `prisma/schema.prisma` or DBML changes.                                                                                        | Prisma schema validates and DBML remains aligned with the data model contract.                    |
| API contract gate      | Endpoint, DTO, or error behavior changes.                                                                                      | HTTP API contract section must match implementation.                                              |
| Frontend contract gate | Route, page, state, API consumption, or UI behavior changes.                                                                   | Frontend page contract must match implementation.                                                 |
| Security gate          | Auth, uploads, ownership, secrets, provider integration, or error handling changes.                                            | Security contract and OWASP-oriented checklist must remain satisfied.                             |
| Agent review gate      | AI-assisted code generation or major refactor is used.                                                                         | Relevant finding must be documented in `docs/agent-findings.md` when an agent produces a finding. |
| MVP execution gate     | Local MVP code exists.                                                                                                         | Frontend, backend, and data layer must run locally using documented commands.                     |
| Demo gate              | Before final sales pitch.                                                                                                      | At least one complete verification flow must work locally in mock mode.                           |

### 14.8 Validation Command Set

The following commands define the expected validation workflow for the MVP design contract.

Required validation commands:

```powershell
npm install
npm run validate
npm run typecheck:frontend
npx tsc --project tsconfig.backend.json --noEmit
npm run build:frontend
npm run test:frontend
git diff --check
```

Required repository consistency checks:

```powershell
git grep -n "PASS\|NO_PASS\|HUMAN_REVIEW" -- ':!README.md' ':!.github/agents/*'
git grep -n "AI_DECISION_COMPLETED" -- ':!README.md' ':!.github/agents/*'
git grep -n "Pending\|pending\|goal-map\|Goal Map\|mvp-scope.md\|problem-statement.md\|frontend-design.md\|ux-testing-results.md" -- ':!README.md' ':!.github/agents/*'
git grep -n "Stores metadata for images or screenshots. Stores metadata" -- ':!README.md' ':!.github/agents/*'
$encodingArtifactPattern = "$([char]0x00D4)|$([char]0x00C3)"
Select-String -Path README.md,docs/agent-findings.md -Pattern $encodingArtifactPattern
```

Rule:

```text
Extended validation commands are mandatory for release readiness. Each command must exist in `package.json`, run successfully, and match the scope documented in this README.
```

### 14.9 CI/CD Execution Order and Blocking Rule

The target CI/CD pipeline must execute validations in this order:

| Stage               | Purpose                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Install             | Install project dependencies.                                                                 |
| Static validation   | Validate Prisma formatting, TypeScript, frontend build readiness, tests, and repository consistency checks. |
| Database validation | Validate Prisma schema and DBML alignment.                                                    |
| Unit tests          | Run deterministic unit tests for frontend and backend modules.                                |
| Integration tests   | Run API, repository, and contract tests defined by the MVP contracts.                         |
| Build               | Build frontend and backend artifacts.                                                         |
| Security review     | Check secrets, token handling, unsafe storage, upload restrictions, and safe error responses. |
| Deployment          | Deploy only after all required gates pass.                                                    |

Pipeline rule:

```text
A CI/CD pipeline failure must block deployment until the failing gate is corrected or explicitly documented as not applicable to the MVP design scope.
```

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

### 16.1 Repository Structure Contract

The repository must be organized so that a junior developer can identify the responsibility of each area before modifying code.

```text
caso2-ia-detector/
├── .github/
│   └── agents/
│       └── *.md
│
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.backend.json
├── prisma.config.ts
│
├── docs/
│   ├── agent-findings.md
│   └── assets/
│       ├── prototype/
│       └── ux-testing/
│
├── database/
│   └── dbml/
│       └── ia-detector.dbml
│
├── prisma/
│   └── schema.prisma
│
└── src/
    ├── backend/
    │   ├── main.ts
    │   ├── app.module.ts
    │   │
    │   ├── api/
    │   │   ├── controllers/
    │   │   │   ├── AuthController.ts
    │   │   │   ├── HealthController.ts
    │   │   │   ├── UploadController.ts
    │   │   │   └── VerificationController.ts
    │   │   │
    │   │   ├── dto/
    │   │   │   ├── auth/
    │   │   │   │   ├── AuthenticatedRequest.ts
    │   │   │   │   ├── AuthResponseDTO.ts
    │   │   │   │   ├── LoginRequestDTO.ts
    │   │   │   │   ├── RegisterRequestDTO.ts
    │   │   │   │   └── UserDTO.ts
    │   │   │   │
    │   │   │   └── verification/
    │   │   │       ├── CreateVerificationRequestDTO.ts
    │   │   │       ├── VerificationAnalysisReportDTO.ts
    │   │   │       └── VerificationHistoryItemDTO.ts
    │   │   │
    │   │   └── guards/
    │   │       └── JwtAuthGuard.ts
    │   │
    │   ├── application/
    │   │   ├── auth/
    │   │   │   ├── AuthModule.ts
    │   │   │   ├── LoginService.ts
    │   │   │   ├── PasswordHasher.ts
    │   │   │   └── RegisterService.ts
    │   │   │
    │   │   ├── health/
    │   │   │   └── HealthService.ts
    │   │   │
    │   │   └── verification/
    │   │       ├── CreateVerificationCaseService.ts
    │   │       ├── GetVerificationCaseService.ts
    │   │       ├── ListVerificationHistoryService.ts
    │   │       └── VerificationModule.ts
    │   │
    │   └── infrastructure/
    │       └── persistence/
    │           ├── prisma/
    │           │   ├── PrismaModule.ts
    │           │   └── PrismaService.ts
    │           │
    │           └── repositories/
    │               ├── UserRepository.ts
    │               └── VerificationRepository.ts
    └── frontend/
        ├── app/
        │   ├── App.tsx
        │   ├── main.tsx
        │   ├── routes.tsx
        │   ├── styles.css
        │   └── providers/
        │       ├── AuthProvider.tsx
        │       └── QueryProvider.tsx
        │
        ├── features/
        │   ├── auth/
        │   │   └── pages/
        │   │       ├── LoginPage.tsx
        │   │       └── RegisterPage.tsx
        │   │
        │   ├── history/
        │   │   └── pages/
        │   │       ├── VerificationCaseDetailPage.tsx
        │   │       └── VerificationHistoryPage.tsx
        │   │
        │   └── verification/
        │       └── pages/
        │           ├── VerificationHubPage.tsx
        │           └── VerificationResultPage.tsx
        │
        └── shared/
            ├── api/
            │   ├── authApi.ts
            │   ├── httpClient.ts
            │   └── verificationApi.ts
            │
            ├── components/
            │   ├── layout/
            │   │   └── AppLayout.tsx
            │   │
            │   ├── report/
            │   │   ├── AuditTrailPanel.tsx
            │   │   ├── EvidenceList.tsx
            │   │   ├── labels.ts
            │   │   ├── RecommendationBanner.tsx
            │   │   ├── RiskSignalList.tsx
            │   │   ├── ScoreSummary.tsx
            │   │   └── VerificationReportView.tsx
            │   │
            │   └── ui/
            │       ├── alert.tsx
            │       ├── badge.tsx
            │       ├── button.tsx
            │       ├── card.tsx
            │       ├── input.tsx
            │       ├── label.tsx
            │       ├── skeleton.tsx
            │       └── textarea.tsx
            │
            ├── errors/
            │   └── apiError.ts
            │
            ├── lib/
            │   └── utils.ts
            │
            └── types/
                └── verification.ts
```

Responsibility summary:

| Area | Responsibility |
|---|---|
| `src/backend/api/controllers` | HTTP routes and request/response boundary. |
| `src/backend/api/dto` | API input and output shapes. |
| `src/backend/api/guards` | Authentication and authorization checks. |
| `src/backend/application` | Business use cases and orchestration. |
| `src/backend/infrastructure/persistence/prisma` | Prisma Client setup and database connection. |
| `src/backend/infrastructure/persistence/repositories` | Database access through Prisma. |
| `prisma/schema.prisma` | Source of truth for Prisma data model. |
| `database/dbml/ia-detector.dbml` | Review-friendly relational model documentation. |
| `prisma.config.ts` | Prisma 7 configuration and environment loading. |
| `package.json` | Scripts and dependency declarations. |

Implementation rule:

```text
Do not place business logic directly in controllers or PrismaService. Controllers call services; services call repositories; repositories use Prisma.
```


### 16.2 Supporting Artifacts

| Artifact | Link |
|---|---|
| Prisma schema | [Open Prisma schema](prisma/schema.prisma) |
| DBML model | [Open DBML model](database/dbml/ia-detector.dbml) |
| Agent definitions | [Open agents folder](.github/agents/) |
| Agent findings log | [Open agent findings log](docs/agent-findings.md) |
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

### 16.4 Local Environment Variables and Docker Database

The backend reads local environment variables from `.env`.

Required local `.env` example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_detector?schema=public"
BACKEND_PORT=3000
FRONTEND_URL="http://localhost:5173"
JWT_ACCESS_SECRET="replace-with-local-development-secret"
JWT_ACCESS_EXPIRES_IN="15m"
```

Prisma reads `DATABASE_URL` through `prisma.config.ts`, which must import `dotenv/config`.

Expected Prisma config behavior:

```text
1. Load .env.
2. Read DATABASE_URL.
3. Use prisma/schema.prisma as the schema file.
4. Use prisma/migrations as the migrations folder when migrations are added.
```

Local PostgreSQL is expected to run through Docker:

```powershell
docker start ia-detector-postgres
```

If the container does not exist:

```powershell
docker run --name ia-detector-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ia_detector `
  -p 5432:5432 `
  -d postgres:15
```


### 16.5 Validation Commands

Install dependencies:

```powershell
npm.cmd install
```

Generate Prisma Client:

```powershell
npm.cmd run db:generate
```

Push schema to the local PostgreSQL database:

```powershell
npm.cmd run db:push
```

Validate Prisma schema:

```powershell
npm.cmd run validate
```

Start backend:

```powershell
npm.cmd run dev:backend
```

Expected backend startup result:

```text
IA Detector backend running on http://localhost:3000/api
```

Expected health check result:

```json
{
  "status": "ok",
  "service": "ia-detector-backend",
  "database": "ok"
}
```

Validation rule:

```text
A source change is not ready for review until Prisma generation, database synchronization or migration, schema validation, backend startup, and the relevant smoke tests pass locally.
```


### 16.6 Grep Checks

These checks exclude `README.md` and `.github/agents/` because both intentionally mention forbidden labels and deprecated terms to define what must not appear in product code, product UI, API responses, database states, or user-facing implementation artifacts.

Run:

```powershell
git grep -n "PASS\|NO_PASS\|HUMAN_REVIEW" -- ':!README.md' ':!.github/agents/*'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "AI_DECISION_COMPLETED" -- ':!README.md' ':!.github/agents/*'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "Pending\|pending\|goal-map\|Goal Map\|mvp-scope.md\|problem-statement.md\|frontend-design.md\|ux-testing-results.md" -- ':!README.md' ':!.github/agents/*'
```

Expected result:

```text
No output.
```

Run:

```powershell
git grep -n "Stores metadata for images or screenshots. Stores metadata" -- ':!README.md' ':!.github/agents/*'
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

---

## 17. AI-Assisted Development Workflow

This section defines how the team uses AI-assisted development artifacts to keep the MVP aligned with the architecture, README contract, database model, frontend contracts, backend contracts, and quality rules.

### 17.1 Purpose

The project uses specialized agents, reusable skills, and contextual commands to support implementation without losing architectural consistency.

The goal is not to generate code blindly. The goal is to generate code, review it, validate it, and keep it aligned with this README.

### 17.2 Agent Inventory

| Area                | Agent                           | Responsibility                                                                                                                    |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Architecture        | `architecture-guardian`         | Validates that implemented code follows the documented architecture, layer boundaries, C4 model, and non-functional requirements. |
| SOLID               | `design-solid-advisor`          | Reviews SOLID principles and required design patterns.                                                                            |
| KISS                | `kiss-principle-agent`          | Detects unnecessary complexity while respecting required patterns.                                                                |
| DRY                 | `dry-principle-agent`           | Detects duplication and suggests safe abstractions.                                                                               |
| Frontend            | `frontend-component-generator`  | Generates frontend pages and reusable components according to page contracts.                                                     |
| Frontend            | `responsive-design-agent`       | Reviews tablet-width and responsive behavior.                                                                                     |
| Frontend            | `state-management-agent`        | Reviews client state, server state, authentication state, and token storage rules.                                                |
| Backend API         | `controller-generator-agent`    | Generates API controllers according to endpoint contracts.                                                                        |
| Backend Application | `service-generator-agent`       | Generates application services according to business rules.                                                                       |
| Backend Persistence | `repository-generator-agent`    | Generates repositories that isolate Prisma access.                                                                                |
| Backend DTOs        | `dto-generator-agent`           | Generates request and response DTOs according to API contracts.                                                                   |
| Integrations        | `integration-client-generator`  | Generates provider clients, adapters, ambassadors, and mocks.                                                                     |
| Database            | `code-generator-database`       | Generates or updates Prisma and DBML artifacts.                                                                                   |
| Database            | `database-design-validator`     | Validates README, Prisma, and DBML alignment.                                                                                     |
| Security            | `code-quality-security`         | Reviews security, secrets, auth, ownership, upload validation, and safe errors.                                                   |
| Business Rules      | `business-rules-contract-agent` | Validates scoring, risk, recommendation, provider, cache, and DTO rules.                                                          |
| Testing             | `testing-engineer`              | Generates and reviews unit, integration, API, frontend, and smoke tests.                                                          |

### 17.3 Reusable Skills

Reusable skills define repeatable procedures that can be followed by humans or AI tools during implementation.

| Skill                     | Purpose                                                                             | Main Agents                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Generate Frontend Screen  | Create a page or screen from the frontend page contract.                            | `frontend-component-generator`, `responsive-design-agent`, `state-management-agent`                                              |
| Generate Backend Endpoint | Create controller, DTO, service, repository, and tests for one endpoint.            | `controller-generator-agent`, `dto-generator-agent`, `service-generator-agent`, `repository-generator-agent`, `testing-engineer` |
| Validate Architecture     | Review layer boundaries, imports, folders, and C4 alignment.                        | `architecture-guardian`, `design-solid-advisor`                                                                                  |
| Review Database Design    | Compare README, Prisma, DBML, relations, enums, and indexes.                        | `database-design-validator`, `code-generator-database`                                                                           |
| Review Business Rules     | Validate scoring, risk signals, recommendations, provider status, and cache status. | `business-rules-contract-agent`, `testing-engineer`                                                                              |
| Review Security           | Review tokens, cookies, ownership, uploads, secrets, errors, and logging.           | `code-quality-security`, `state-management-agent`                                                                                |
| Run Quality Checks        | Execute validation commands before commit or review.                                | `testing-engineer`, `database-design-validator`, `architecture-guardian`                                                         |

### 17.4 Contextual Commands

Contextual commands orchestrate agents and validation steps. They may be executed manually through VSCode, Copilot Chat, or an equivalent AI assistant workflow.

| Command                   | Inputs                                | Agents Invoked                                                                                               | Required Validation                                                                                     |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Generate Frontend Screen  | Route, page contract, DTOs            | `frontend-component-generator`, `responsive-design-agent`, `state-management-agent`                          | Component renders normalized DTOs and follows UX language rules.                                        |
| Generate Backend Endpoint | Endpoint contract, DTOs, service name | `controller-generator-agent`, `dto-generator-agent`, `service-generator-agent`, `repository-generator-agent` | Controller does not import Prisma and returns `ErrorResponseDTO` on errors.                             |
| Review SOLID Principles   | Target folder or feature              | `design-solid-advisor`                                                                                       | No controller business logic, no direct Prisma in application services, and no provider client leakage. |
| Validate Architecture     | Full repository                       | `architecture-guardian`                                                                                      | Folder structure, imports, patterns, and boundaries match the README.                                   |
| Review Database Design    | README, Prisma, DBML                  | `database-design-validator`                                                                                  | Prisma and DBML match the data model contract.                                                          |
| Run Unit Tests            | Target service or feature             | `testing-engineer`                                                                                           | Rules are covered with deterministic tests.                                                             |
| Run Security Review       | Full repository or target area        | `code-quality-security`                                                                                      | No hardcoded secrets, unsafe token storage, raw provider errors, or missing ownership checks.           |

### 17.5 Required Agent Finding Log

When agents are used for implementation or review, findings must be documented in:

```text
docs/agent-findings.md
```

Each finding should include:

| Field                | Meaning                                        |
| -------------------- | ---------------------------------------------- |
| Date                 | Date when the agent review happened.           |
| Agent                | Agent that produced the finding.               |
| Finding              | Problem, gap, risk, or inconsistency detected. |
| Suggested Correction | What the agent recommended.                    |
| Applied Correction   | What the team actually changed.                |
| Evidence             | Commit hash, diff, file path, or screenshot.   |

### 17.6 AI-Assisted Development Rule

AI-generated code is not accepted automatically.

Before code is merged, it must satisfy:

1. It follows this README.
2. It follows the folder structure.
3. It uses the correct DTOs.
4. It respects layer boundaries.
5. It does not expose secrets or raw provider data.
6. It does not introduce absolute truth labels.
7. It passes validation checks.
8. It is reviewed by at least one relevant agent or team member.

---

## 18. Case #2 Traceability and Team Ownership

This section maps the Case #2 deliverables to repository artifacts and team ownership. It prevents deliverables from being treated as implicit or undocumented.

### 18.1 Deliverable Traceability Matrix

| Case #2 Area                  | Repository Artifact                                                        | Owner Area              | Status Rule                                                         |
| ----------------------------- | -------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Prototyping and UX refinement | Figma link, Maze link, `docs/assets/prototype/`, `docs/assets/ux-testing/` | UX / Prototype          | Evidence is added only when real participant results exist.         |
| Frontend design               | Sections 4, 10, 12, 13, 15, 16                                             | Frontend / Architecture | Design is maintained in README and later linked to `/src/frontend`. |
| Backend and data design       | Sections 3, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16                              | Backend / Data          | README, Prisma, DBML, and agents must stay aligned.                 |
| MVP implementation            | `/src/backend`, `/src/frontend`, local run instructions, mock integrations | MVP implementation      | MVP code must follow the README contract.                           |
| Agents                        | `.github/agents/`, `docs/agent-findings.md`                                | Architecture / Quality  | Agent usage must be documented when applied.                        |
| Skills and commands           | Section 17                                                                 | Architecture / Quality  | Skills and commands guide implementation workflow.                  |
| Sales pitch and demo          | Section 19 and live MVP                                                    | Full team               | Demo must use local MVP execution, not slides.                      |

### 18.2 Team Responsibility Contract

| Area                                | Responsibility                                                                                   | Expected Evidence                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Technical contract and architecture | Maintain README, architecture, data model, validation rules, agents, Prisma, and DBML.           | README sections, Prisma schema, DBML, agents, validation commands. |
| UX prototype                        | Maintain Figma flow, prototype screenshots, and final UX decisions.                              | Figma link, exported screens, prototype evidence.                  |
| UX testing                          | Configure Maze, define tasks, run participant testing, export results, and document corrections. | Maze results, participant evidence, findings, corrections.         |
| Frontend MVP                        | Implement screens, routing, state management, API client, and report UI.                         | `/src/frontend` code and local execution instructions.             |
| Backend MVP                         | Implement API, services, repositories, mocks, auth, validation, and persistence.                 | `/src/backend` code and local execution instructions.              |
| Data layer                          | Maintain Prisma, DBML, migrations, seed data, and database validation.                           | `prisma/`, `database/dbml/`, validation output.                    |
| Demo and pitch                      | Prepare the 10-minute live commercial demo using the local MVP.                                  | Demo flow, speaking script, local run confirmation.                |

### 18.3 Evidence Integrity Rule

The repository must not invent or simulate academic evidence.

| Evidence Type         | Rule                                                |
| --------------------- | --------------------------------------------------- |
| UX metrics            | Added only after real UX sessions are completed.    |
| Participant comments  | Added only when collected from actual participants. |
| Prototype corrections | Added only after the prototype is actually updated. |
| MVP screenshots       | Added only after the MVP screen exists.             |
| Test results          | Added only after tests are executed.                |
| Agent findings        | Added only after an agent review is performed.      |

### 18.4 README Alignment Rule

Whenever implementation changes, the same commit must update this README when the change affects:

1. Public API behavior.
2. DTOs.
3. Database schema.
4. Frontend routes or page behavior.
5. Backend services or layer boundaries.
6. Security rules.
7. Environment variables.
8. Mock/live integration behavior.
9. Validation commands.
10. MVP scope.

---

## 19. Sales Pitch and Demo Plan

The final demo is a live product presentation. It must be conversational, commercial, and supported by the MVP running locally.

### 19.1 Demo Format

| Segment            |  Duration | Purpose                                                             |
| ------------------ | --------: | ------------------------------------------------------------------- |
| Problem Story      | 2 minutes | Explain why journalists need faster verification before publishing. |
| Live MVP Demo      | 4 minutes | Show the core verification workflow running locally.                |
| Value and Benefits | 2 minutes | Explain operational benefits, risk reduction, and product value.    |
| Questions          | 2 minutes | Answer one or two audience questions.                               |

### 19.2 Demo Flow

The live demo should follow this order:

1. Open the local frontend.
2. Log in as a journalist.
3. Submit suspicious text.
4. Show the generated verification report.
5. Explain evidence score, risk score, source agreement, and recommended editorial action.
6. Submit a URL or image example if time allows.
7. Open verification history.
8. Open the saved case detail.
9. Show the audit trail.
10. Explain why the system supports editorial judgment instead of replacing it.

### 19.3 Demo Success Criteria

| Criterion          | Requirement                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| Local execution    | Frontend, backend, and data layer run locally.                          |
| Core flow          | At least one verification case can be created end-to-end.               |
| Mock mode          | Demo works without real AI/OCR or fact-checking credentials.            |
| Report clarity     | The audience can understand evidence, risk, and recommendation.         |
| Human judgment     | The demo clearly states that the system does not decide absolute truth. |
| No slides required | The MVP is the main presentation aid.                                   |

### 19.4 Commercial Message

IA Detector helps editorial teams reduce the time needed for initial verification while keeping final judgment in human hands.

The commercial value is:

1. Faster first-pass verification.
2. More consistent review workflow.
3. Better evidence organization.
4. Lower risk of publishing unsupported or manipulated content.
5. Clear audit trail for accountability.
6. Local demo mode that works even without paid AI or fact-checking credentials.

### 19.5 Expected Questions

| Question                                          | Suggested Answer                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Does the system decide whether something is true? | No. It produces a verification analysis report and recommends an editorial action for human review.                                |
| What happens if external providers fail?          | The system shows provider degradation, uses stale cache only when available, and recommends manual review when needed.             |
| Can it work without paid AI services?             | Yes. The MVP supports deterministic mock mode for local demo and testing.                                                          |
| How is user data protected?                       | Access is authenticated, ownership is enforced, tokens are handled securely, and raw provider data is not exposed to the frontend. |
| Why is this useful for journalists?               | It reduces repeated manual searching and organizes evidence, risks, and audit trail in one workflow.                               |