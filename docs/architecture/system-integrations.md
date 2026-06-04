# System Integrations — IA Detector

## Purpose

This document defines the external system integrations required for IA Detector.

Each integration must be documented as a technical card that allows the development team to implement the integration without additional clarification.

The MVP must support the verification flow using real integrations when credentials are available, but it must also support local execution through mocks or stubs when external services are not available.

---

# Integration 1 — Google Fact Check Tools API

## Name

**Google Fact Check Tools API**

---

## Provider

**Google LLC**

---

## Integration Purpose

IA Detector uses Google Fact Check Tools API to search for previous fact-checking results related to a suspicious claim.

This integration is used as an evidence source. It does not decide the final classification by itself.

The final IA Detector classification is calculated internally as:

- `PASS`
- `NO_PASS`
- `HUMAN_REVIEW`

The Google Fact Check result is only one input used to calculate `evidenceScore`, `riskScore`, and `sourceAgreement`.

---

## Protocol

| Field | Value |
|---|---|
| Network protocol | HTTPS over TCP/IP |
| API style | REST API |
| Data format | JSON |
| Request type | Query-based HTTP request |
| Main operation | Search previous fact-checking results for a claim |
| Backend access only | Yes |
| Frontend direct access | Not allowed |

---

## Integration Boundary

The frontend must never call Google Fact Check Tools API directly.

The frontend sends suspicious content to the IA Detector backend. The backend extracts or receives the main claim and then calls Google Fact Check Tools API using a normalized query.

Google Fact Check Tools API receives only:

- normalized claim text,
- language if available,
- maximum number of results.

Google Fact Check Tools API must not receive:

- raw uploaded files,
- full screenshots,
- full private documents,
- frontend tokens,
- user passwords,
- internal audit data.

---

## Security Constraints

| Security concern | Required design decision |
|---|---|
| API key exposure | API key must never be exposed in the frontend. |
| API key storage | API key must be stored outside source code. |
| Request origin | Only backend services may call the provider. |
| User validation | Backend must validate the authenticated session before creating a verification case. |
| Authorization | Only users with role `journalist` or `admin` may start verification. |
| Transport security | All provider calls must use HTTPS. |
| Logging | Logs must not include API keys or raw secrets. |
| Sensitive data | Only the normalized claim query should be sent to the provider. |

---

## Configuration Parameters

```env
FACT_CHECK_PROVIDER=google
FACT_CHECK_MODE=real
FACT_CHECK_API_KEY=
FACT_CHECK_BASE_URL=https://factchecktools.googleapis.com
FACT_CHECK_SEARCH_PATH=/v1alpha1/claims:search
FACT_CHECK_TIMEOUT_SECONDS=8
FACT_CHECK_MAX_RETRIES=2
FACT_CHECK_MAX_RESULTS=5
FACT_CHECK_CACHE_TTL_MINUTES=60
FACT_CHECK_MAX_QUERY_LENGTH=500
```

For local MVP execution without real credentials:

```env
FACT_CHECK_MODE=mock
FACT_CHECK_PROVIDER=mock
```

---

## Configuration and Secret Storage

| Environment | Storage strategy |
|---|---|
| Local development | `.env.local`, excluded from Git. |
| CI/CD | GitHub Actions Secrets. |
| Production future version | Secret manager from selected cloud provider. |
| MVP local demo | Mock values are allowed when `FACT_CHECK_MODE=mock`. |

Developer restriction:

- No API key, token, or secret can be committed to the repository.
- `.env.local` must be included in `.gitignore`.
- The application must fail fast if `FACT_CHECK_MODE=real` and `FACT_CHECK_API_KEY` is missing.

---

## Throughput and Capacity Assumptions

Exact provider limits depend on the Google Cloud project configuration. IA Detector must not assume unlimited throughput.

For the MVP, the expected workload is low and oriented to local demo and controlled testing.

| Metric | MVP value |
|---|---|
| Concurrent users | 1–10 |
| Verification requests per user | 5–20 per day |
| Average request payload | 1–5 KB |
| Average response payload | 5–50 KB |
| Timeout | 8 seconds |
| Max retries | 2 |
| Max results per request | 5 |
| Cache TTL | 60 minutes |
| Max query length | 500 characters |

---

## Workload Scenario

A journalist receives suspicious content from a digital source and submits it to IA Detector.

The backend:

1. Creates a verification case.
2. Extracts or receives the main claim.
3. Normalizes the claim.
4. Checks local cache.
5. Calls Google Fact Check Tools API only if there is no valid cached response.
6. Stores evidence results in the verification case.
7. Continues the internal IA Detector classification flow.

---

## Peak Workload Scenario

During breaking news, multiple journalists may submit similar claims at the same time.

Without integration controls, this could cause:

- repeated provider requests for the same claim,
- slow UI responses,
- quota exhaustion,
- unnecessary latency,
- inconsistent results across similar cases.

Design response:

- normalize the claim before cache lookup,
- use cache-aside with a 60-minute TTL,
- limit provider results to 5,
- apply timeout after 8 seconds,
- retry only temporary failures,
- continue with partial evidence when the provider fails.

---

## Design Strategy for Throughput and Latency

| Risk | Impact | Design strategy |
|---|---|---|
| Same claim submitted multiple times | Wastes provider quota | Cache normalized query result. |
| Provider response is slow | User waits too long | Apply 8-second timeout. |
| Provider temporarily fails | Verification loses evidence source | Retry up to 2 times, then continue with partial evidence. |
| Provider quota is exceeded | External evidence unavailable | Mark provider as unavailable and route case based on available evidence. |
| No fact-check result found | User may think content is true | Show `NO_PRIOR_FACT_CHECK_FOUND`, not `PASS`. |
| Response format changes | Adapter may fail | Validate response before mapping to internal DTOs. |

---

## Internal Classes and Locations

| Class / Component | Location in `/src` | Responsibility |
|---|---|---|
| `GoogleFactCheckClient` | `/src/backend/infrastructure/integrations/factcheck/GoogleFactCheckClient.ts` | Executes HTTP requests to Google Fact Check Tools API. |
| `GoogleFactCheckAdapter` | `/src/backend/infrastructure/integrations/factcheck/GoogleFactCheckAdapter.ts` | Converts provider response into internal DTOs. |
| `FactCheckEvidenceService` | `/src/backend/application/evidence/FactCheckEvidenceService.ts` | Orchestrates cache lookup, provider call, and DTO mapping. |
| `FactCheckCacheRepository` | `/src/backend/infrastructure/persistence/repositories/FactCheckCacheRepository.ts` | Reads and writes cached fact-check results. |
| `FactCheckResultDTO` | `/src/backend/domain/factcheck/FactCheckResultDTO.ts` | Internal representation of one fact-check evidence result. |
| `FactCheckSearchRequestDTO` | `/src/backend/domain/factcheck/FactCheckSearchRequestDTO.ts` | Internal request used to query fact-check evidence. |
| `ExternalProviderException` | `/src/backend/shared/errors/ExternalProviderException.ts` | Controlled exception for provider failures. |
| `IntegrationLogger` | `/src/backend/infrastructure/observability/IntegrationLogger.ts` | Logs provider latency, errors, and trace IDs. |

---

## Class Diagram

```text
+------------------------------------------------------+
|              FactCheckEvidenceService                |
|------------------------------------------------------|
| + searchEvidence(claim)                              |
| + normalizeClaim(rawClaim)                           |
| + calculateCacheKey(normalizedClaim)                 |
+------------------------------------------------------+
             |                         |
             |                         |
             v                         v
+-----------------------------+   +-----------------------------+
|  FactCheckCacheRepository   |   |    GoogleFactCheckClient    |
|-----------------------------|   |-----------------------------|
| + get(cacheKey)             |   | + searchClaims(request)     |
| + set(cacheKey, result, ttl)|   | + buildRequest(query)       |
| + invalidate(cacheKey)      |   | + applyTimeout()            |
+-----------------------------+   +-----------------------------+
                                           |
                                           v
                              +-----------------------------+
                              |  Google Fact Check Tools API|
                              +-----------------------------+
                                           |
                                           v
+------------------------------------------------------+
|              GoogleFactCheckAdapter                  |
|------------------------------------------------------|
| + toFactCheckResultDTO(response)                     |
| + validateProviderResponse(response)                 |
+------------------------------------------------------+
                                           |
                                           v
+------------------------------------------------------+
|                  FactCheckResultDTO                  |
|------------------------------------------------------|
| publisherName                                        |
| claimReviewed                                        |
| rating                                               |
| url                                                  |
| publishedAt                                          |
| relevanceScore                                      |
+------------------------------------------------------+
```

---

## Main Flow

1. `CreateVerificationCaseService` requests evidence for a claim.
2. `FactCheckEvidenceService.searchEvidence(claim)` receives the claim.
3. `FactCheckEvidenceService` normalizes the claim text.
4. `FactCheckEvidenceService` builds a cache key.
5. `FactCheckCacheRepository.get(cacheKey)` checks for cached evidence.
6. If cache exists, cached evidence is returned.
7. If cache does not exist, `GoogleFactCheckClient.searchClaims(request)` calls the provider.
8. `GoogleFactCheckAdapter` validates and maps the provider response.
9. `FactCheckCacheRepository.set(cacheKey, result, ttl)` stores the mapped result.
10. `FactCheckEvidenceService` returns `FactCheckResultDTO[]` to the verification workflow.

---

## Request DTO

```ts
type FactCheckSearchRequestDTO = {
  claimText: string;
  languageCode?: "en" | "es";
  maxResults: number;
  traceId: string;
  verificationCaseId: string;
};
```

---

## Response DTO

```ts
type FactCheckResultDTO = {
  publisherName: string;
  claimReviewed: string;
  rating: string;
  url: string;
  publishedAt?: string;
  relevanceScore: number;
};
```

---

## Provider Failure DTO

```ts
type FactCheckProviderFailureDTO = {
  provider: "GOOGLE_FACT_CHECK";
  errorCode:
    | "TIMEOUT"
    | "QUOTA_EXCEEDED"
    | "NETWORK_ERROR"
    | "INVALID_RESPONSE"
    | "AUTHENTICATION_ERROR";
  message: string;
  retryable: boolean;
};
```

---

## Error Handling

| Error case | System behavior |
|---|---|
| Provider timeout | Retry up to 2 times. If it still fails, continue with partial evidence. |
| Quota exceeded | Stop provider calls and mark evidence source as unavailable. |
| Invalid API key | Log configuration error and block real provider mode. |
| Network failure | Retry if temporary. If not resolved, continue without provider evidence. |
| Invalid response format | Adapter rejects response and returns controlled provider failure. |
| No results found | Return empty evidence list with `NO_PRIOR_FACT_CHECK_FOUND`. |
| Cache read failure | Continue with provider call and log cache warning. |
| Cache write failure | Return provider result but log cache write warning. |

---

## Impact on IA Detector Classification

The integration result contributes to IA Detector internal scoring.

| Integration result | Effect on classification |
|---|---|
| Strong matching evidence from reliable sources | Increases `evidenceScore`. |
| No previous fact-check found | Does not automatically mean `PASS`. |
| Contradictory ratings found | Increases chance of `HUMAN_REVIEW`. |
| Provider unavailable | Classification continues with partial evidence. |
| Low source agreement | Increases risk and may lead to `NO_PASS` or `HUMAN_REVIEW`. |

The integration must never return final classification directly.

Only the IA Detector internal decision flow can classify a case as:

- `PASS`
- `NO_PASS`
- `HUMAN_REVIEW`

---

## Developer Restrictions

- Do not call Google Fact Check Tools API from frontend code.
- Do not call Google Fact Check Tools API directly from controllers.
- Controllers must call application services only.
- All provider calls must go through `FactCheckEvidenceService`.
- All HTTP calls must go through `GoogleFactCheckClient`.
- All provider responses must be mapped through `GoogleFactCheckAdapter`.
- Do not persist raw provider response unless explicitly required for debugging and sanitized.
- Do not treat empty provider results as verified information.
- Do not expose API keys in logs, frontend bundles, screenshots, or test files.
- Every provider call must include `traceId` and `verificationCaseId`.
- Every provider failure must be converted into a controlled error or partial evidence state.

---

## Mock Mode for MVP

The MVP must support mock mode so the project can run locally without external credentials.

When `FACT_CHECK_MODE=mock`:

- `GoogleFactCheckClient` must not call the real provider.
- The system must return deterministic mock responses.
- Mock responses must include at least:
  - one `PASS` scenario,
  - one `NO_PASS` scenario,
  - one `HUMAN_REVIEW` scenario.

Mock files must be stored in:

```text
/src/backend/infrastructure/integrations/factcheck/mocks/
```

Required mock files:

```text
pass-result.mock.json
no-pass-result.mock.json
human-review-result.mock.json
```

---

## Acceptance Criteria

This integration is correctly designed when:

- the frontend never communicates directly with Google Fact Check Tools API,
- API keys are stored outside source code,
- provider calls are centralized in `GoogleFactCheckClient`,
- provider responses are normalized by `GoogleFactCheckAdapter`,
- cache is checked before making external calls,
- timeouts and retries are defined,
- provider failures do not crash the verification flow,
- no provider result is treated as absolute truth,
- empty provider results do not produce automatic `PASS`,
- the MVP can run locally with mock fact-check responses,
- the integration supports `PASS`, `NO_PASS`, and `HUMAN_REVIEW` scenarios.