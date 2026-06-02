# Frontend Design Document – IA Detector

> **Purpose**  
> This document defines the frontend design for *IA Detector*, a web application that helps journalists reduce the time required to verify suspicious digital content. It documents the planned frontend stack, UX decisions, component structure, security considerations, state management, API consumption and design patterns that will guide the MVP implementation.

---

## 1. System Overview (based on Problem Statement & MVP)

*Problem Statement* – Reduce the time to confirm truthfully information.

*Core user* – Journalists, fact-checkers, communication professionals.

*MVP functional scope*

**Core Features**
- Submit suspicious text.
- Submit suspicious URL.
- Submit suspicious image or screenshot.
- Extract main claim.
- Extract text from image using OCR mock or local stub for MVP.
- Search evidence or previous fact-check results.
- Calculate evidence score and risk score.
- Classify case as PASS, NO_PASS, or HUMAN_REVIEW.
- Show evidence, risk signals and case status.

**Supporting Features**
- Basic verification history.
- Basic audit log.
- Error messages when AI or evidence sources fail.

**Out of Scope**
- Real video analysis.
- Real deepfake detection.
- Automatic publishing.
- Full newsroom collaboration.
- Browser extension.
- Mobile app.
- Advanced image forensic analysis.

**Main user journey**  
1. Journalist receives suspicious content (text, URL, or image).  
2. Opens IA Detector web app and authenticates.  
3. Selects input type (text, URL, or image) and submits.  
4. System extracts claim, searches evidence, computes scores, and returns classification.  
5. Journalist reviews evidence, risk signals, and the system classification.
6. The case is saved in history with an audit log entry.

---

## 2. Technology Stack (Frontend)

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Core Framework | React | 19.x | Component‑based, large ecosystem, excellent for dynamic forms and real‑time feedback |
| Language | TypeScript | 5.x | Mandatory for type safety, reduces runtime errors, improves maintainability |
| Build Tool | Vite | 5.x | Extremely fast HMR, optimized production builds, modern alternative to CRA |
| UI Library | shadcn/ui | Latest | Unstyled, accessible components (buttons, dialogs, tabs) – fully customisable with Tailwind |
| Styling | Tailwind CSS | 3.x | Utility‑first, responsive, consistent design system, low CSS footprint |
| State Management | Zustand | 4.x | Lightweight, scalable, less boilerplate than Redux – perfect for authentication and report state |
| Server‑State | TanStack Query | 5.x | Handles caching, background refetching, and request deduplication for evidence searches |
| HTTP Client | Axios | 1.x | Interceptors for JWT tokens, unified error handling, request/response transformation |
| Routing | React Router | 6.x | Standard for React apps, supports protected routes and lazy loading |
| Form Handling | React Hook Form | 7.x | Performant, reduces re‑renders, integrates with Zod validation |
| Validation | Zod | 3.x | Type‑safe schema validation for forms and API responses |
| Authentication | JWT with httpOnly refresh token | – | MVP authentication will use email and password. OAuth2 Google is out of scope for the MVP. |
| Image Preview & Processing | react-dropzone | 14.x | Drag‑and‑drop file upload, client‑side preview before submission |
| Internationalisation (future) | i18next + react-i18next | 23.x | Ready for multi‑language support |

---

## 3. Authentication & Authorization

### 3.1 Authentication Mechanism

*Pattern* – *Token‑based (JWT)* with *Refresh Token rotation*.  
- User logs in with email + password.
- OAuth2 Google is not included in the MVP and may be added in a future version.
- Backend returns an **Access Token** (15 min lifetime) and a **Refresh Token** (7 days, stored in httpOnly cookie). 
- Frontend stores Access Token in memory (not localStorage) and Refresh Token in an `httpOnly` cookie (automatically sent by browser).  
- Axios interceptor automatically refreshes the Access Token when a 401 response is received (without user noticing).

*Login flow*  
1. User submits credentials → `/api/auth/login`.  
2. Backend validates → returns `accessToken` and sets `refreshToken` cookie.  
3. Frontend stores `accessToken` in Zustand store and memory.  
4. All subsequent API requests include `Authorization: Bearer <accessToken>`.  

### 3.2 Authorization Mechanism

*RBAC (Role‑Based Access Control)* – two roles for MVP:  

| Role | Permissions |
|------|-------------|
| `journalist` | Create new verifications, view own history, view audit log entries for own cases |
| `admin` | All journalist permissions + view all users' histories, full audit log, system configuration |

*Implementation in React* – a custom hook `usePermissions()` that checks the user’s role from the JWT payload and conditionally renders UI elements (e.g., admin panel link).

---

## 4. UX / UI Analysis

### 4.1 Desired Usability Attributes

| Attribute | How IA Detector achieves it |
|-----------|-----------------------------|
| *Learnability* | Simple 3‑step wizard: 1) Select input type, 2) Paste/upload, 3) See results. |
| *Feedback* | Real‑time progress during claim extraction and evidence search. Skeleton loaders. |
| *Error tolerance* | Clear error messages (“AI service unavailable – try again later”). Form validation prevents empty submits. |
| *Efficiency* | Keyboard shortcuts (Ctrl+V for paste), saved recent inputs, auto‑focus on textarea. |
| *Accessibility* | WCAG 2.1 AA compliance: ARIA labels, keyboard navigation, sufficient contrast. |
| *Performance* | Lazy loading of results component, image compression before upload (max 5MB). |

### 4.2 User Journey & Wireframes (low‑fidelity description)

*Tool used for wireframing* – **Figma**

Figma will be used to create the low-fidelity and interactive prototype for the main IA Detector workflow:
1. Select input type.
2. Submit suspicious content.
3. View processing progress.
4. Interpret PASS, NO_PASS or HUMAN_REVIEW.
5. Review evidence and risk signals.

*Screen 1 – Dashboard (Verification Hub)*  
- Header: Logo, user avatar (with logout), “New verification” button.  
- Main area: Three big cards (Text, URL, Image) with icons.  
- Below: List of recent verifications (last 5) showing content snippet, date, classification colour tag (PASS green, NO_PASS red, HUMAN_REVIEW orange).  

*Screen 2 – Text/URL Submission Form*  
- Large textarea or URL input field.  
- “Extract claim & verify” button.  
- After submission → loading animation + step indicator:  
  *“Extracting claim → Searching evidence → Computing scores → Classification”*  

*Screen 3 – Image Upload*  
- Full-width drag-and-drop zone inside the input panel.
- Manual file selection option.
- Preview before analysis.
- Remove image option.
- Supported MVP formats: `.jpg`, `.png`, `.webp`.
- Maximum MVP file size: 5 MB.
- After upload, the system extracts text using OCR mock or local stub.

*Screen 4 – Results Page*  
- Top: Classification badge (PASS/NO_PASS/HUMAN_REVIEW) with confidence indicator (progress bar).  
- Claim extracted (editable? – yes, journalist can refine before re‑running).  
- Evidence panel: list of sources (title, URL, relevance score, snippet).  
- Risk signals: bullet list (e.g., “Unsourced numbers”, “Emotional language”, “Image metadata missing”).  
- Two buttons: “Save & close” (to history) and “New verification”.  

*Screen 5 – History Page*  
- Table with columns: Date, Input type, Content preview, Classification, Actions (View, Re‑run).  
- Filter by classification, date range.  

*Screen 6 – Audit Log (admin only)*  
- Table showing user, action, timestamp, case ID, IP address (partial).  

### 4.3 Usability Testing Plan

The UX test will be conducted with at least 4 design students who are not members of the IA Detector team.

*Tool* – **Maze**

Maze will be used to test the Figma prototype and collect task completion, time on task, hesitation points, comments and usability issues.

*Test tasks*  
1. Submit a suspicious text and identify whether the result is PASS, NO_PASS or HUMAN_REVIEW.  
2. Submit a suspicious URL and open at least one evidence source.  
3. Upload a screenshot or image and identify why the system marks it as HUMAN_REVIEW.  
4. Find a previous verification case in the history screen.

*Metrics* – Task completion rate, time on task, error rate, System Usability Scale (SUS) score.  

*Iterations* – After testing 4 design students, the team will refine the evidence panel layout, classification badge visibility, and upload area based on detected usability issues.

### 4.4 UX Testing Results Template

| Participant | Task | Completed | Time | Issue Detected | Severity | Comment | Correction Applied |
|---|---|---|---|---|---|---|---|
| P1 | Submit suspicious text | Pending | Pending | Pending | Pending | Pending | Pending |
| P2 | Submit suspicious URL | Pending | Pending | Pending | Pending | Pending | Pending |
| P3 | Upload image/screenshot | Pending | Pending | Pending | Pending | Pending | Pending |
| P4 | Find history case | Pending | Pending | Pending | Pending | Pending | Pending |

---

## 5. Component Design Strategy

### 5.1 Atomic Design Structure

```text
src/
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── features/
│   ├── auth/
│   ├── verification/
│   ├── results/
│   └── history/
├── hooks/
├── services/
├── store/
├── types/
└── utils/
```

### 5.2 Reusability & Centralised Styling

- *Tailwind CSS* configuration (`tailwind.config.js`) defines brand colours (green for PASS, red for NO_PASS, orange for HUMAN_REVIEW), spacing, and typography.  
- *shadcn/ui* components are copied and customised once – used everywhere.  
- *CSS variables* for dark/light mode (toggle ready).  

### 5.3 Internationalisation (i18n)

Even though MVP is English‑only, all user‑facing strings are stored in JSON files (e.g., `en/common.json`). This avoids hardcoding and makes future language versions trivial.

### 5.4 Responsiveness

- *Mobile‑first* with Tailwind breakpoints (`sm:`, `md:`, `lg:`).  
- On small screens, the verification wizard becomes a vertical stack; the results page shows evidence in an accordion.

---

## 6. Security

| Concern | Implementation |
|---------|----------------|
| *Authentication* | JWT with httpOnly refresh token (prevents XSS theft). Access token stored in memory. Logout clears both. |
| *Authorization* | RBAC enforced on both frontend (conditional rendering) and backend (API returns 403 if role insufficient). |
| *Input validation* | Frontend Zod schema for text (max 5000 chars), URL (valid format), image (type jpg/png, size <5MB). |
| *API communication* | HTTPS only. Axios interceptors add `Bearer` token automatically. |
| *XSS prevention* | React escapes by default. For `dangerouslySetInnerHTML` – never used. |
| *Audit log* | Each verification action sends a log to backend (user ID, timestamp, case ID, action). |
| *Dependency security* | `npm audit` in CI/CD pipeline. Regular updates with Dependabot. |

---

## 7. Layered Design

```text
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer                                          │
│ React components (pages, features, atoms, molecules)        │
│ Renders UI, dispatches user events only                     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ State & Logic Layer (Hooks + Stores)                        │
│ Zustand stores (auth, verification, UI state)               │
│ Custom hooks: useVerification (orchestrates API calls)      │
│ TanStack Query hooks for evidence fetching & caching        │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Services / API Layer                                        │
│ verificationService.submitText(text) → Axios POST /verify   │
│ authService.login(creds) → Axios POST /auth/login           │
│ Interceptors: attach token, handle 401 refresh              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Utility Layer                                               │
│ formatDate, validateUrl, compressImage, debounce            │
│ No framework dependencies – pure functions                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Design Patterns Applied

| Pattern | Component / Class | Location in `/src` | Why it is used in IA Detector |
|---|---|---|---|
| Observer | `verificationStore` | `/src/frontend/store/verificationStore.ts` | Updates the UI when verification status changes from `PROCESSING` to `PASS`, `NO_PASS` or `HUMAN_REVIEW`. |
| Factory | `createApiClient()` | `/src/frontend/services/api/createApiClient.ts` | Creates configured Axios clients for authentication, verification and history endpoints. |
| Chain of Responsibility | `verificationInputValidators` | `/src/frontend/features/verification/validation/verificationInputValidators.ts` | Validates input step by step: empty value, max length, URL format, file type and file size. |
| Adapter | `verificationResultAdapter` | `/src/frontend/features/results/adapters/verificationResultAdapter.ts` | Converts backend response fields into frontend models used by result components. |
| Strategy | `TextVerificationStrategy`, `UrlVerificationStrategy`, `ImageVerificationStrategy` | `/src/frontend/features/verification/strategies/` | Allows the same UI flow to process text, URL or image input without duplicating logic. |
| Singleton | `authStore`, `verificationStore` | `/src/frontend/store/` | Keeps a single shared state for authentication and active verification case. |

### 8.1 Strategy Pattern Detail

The verification screen must not contain large `if/else` blocks for text, URL and image processing.  
Each input type uses a strategy with the same interface:

```ts
interface VerificationStrategy {
  validate(input: unknown): ValidationResult;
  buildRequest(input: unknown): VerificationRequestDTO;
  submit(request: VerificationRequestDTO): Promise<VerificationResultDTO>;
}
```

Planned implementations:

- `TextVerificationStrategy`
- `UrlVerificationStrategy`
- `ImageVerificationStrategy`

---

## 9. Frontend Verification States

| State | Meaning |
|---|---|
| `IDLE` | No verification has started. |
| `PROCESSING` | The system is extracting claim, searching evidence and calculating scores. |
| `PASS` | The case can move forward to editorial review. |
| `NO_PASS` | The case should not move forward with the available evidence. |
| `HUMAN_REVIEW` | The case is ambiguous and requires human review. |
| `ERROR` | The verification process failed or an external service is unavailable. |

---

## 10. API Contracts Used by Frontend

### Verification Request DTO

```ts
type VerificationRequestDTO = {
  inputType: "TEXT" | "URL" | "IMAGE";
  content?: string;
  fileId?: string;
};
```

### Evidence DTO

```ts
type EvidenceDTO = {
  title: string;
  url: string;
  sourceName: string;
  relevanceScore: number;
  publishedAt?: string;
};
```

### Verification Result DTO

```ts
type VerificationResultDTO = {
  caseId: string;
  status: "PASS" | "NO_PASS" | "HUMAN_REVIEW";
  evidenceScore: number;
  riskScore: number;
  sourceAgreement: "HIGH" | "MEDIUM" | "LOW";
  claim: string;
  evidence: EvidenceDTO[];
  riskSignals: string[];
};
```

---

## 11. Frontend Testing Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Test validators, adapters, stores and utility functions. |
| Component tests | React Testing Library | Test forms, badges, evidence cards and result panels. |
| UI / E2E tests | Playwright | Test the main verification flow from input submission to result display. |

Minimum expected coverage for MVP: 70% on frontend logic files.

---

## 12. Frontend Observability Events

| Event | When it is triggered |
|---|---|
| `verification_started` | User submits text, URL or image. |
| `verification_completed` | Backend returns PASS, NO_PASS or HUMAN_REVIEW. |
| `verification_failed` | AI service, OCR or evidence search fails. |
| `evidence_source_opened` | User opens an evidence link. |
| `history_case_opened` | User opens a previous verification case. |