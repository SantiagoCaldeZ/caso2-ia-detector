# Agentic Design Pattern — Human-in-the-Loop with AI Decision Gate

## Nombre del workflow
Clasificación automática de contenido sospechoso con revisión humana en casos ambiguos.

## Reto a resolver
IA Detector analiza contenido dudoso antes de que un periodista lo publique. El problema es que no basta con que la IA solo genere una recomendación subjetiva: el sistema debe ayudar a reducir el tiempo de verificación y decidir si un caso puede avanzar o no dentro del flujo editorial.

Sin este patrón, el sistema tendría dos problemas posibles:

**Opción A — Solo humano:**  
Todo caso pasa siempre a revisión humana. Esto no reduce suficientemente el tiempo de verificación.

**Opción B — Solo IA:**  
La IA decide sin control humano. Esto es riesgoso porque puede equivocarse, trabajar con evidencia incompleta o no entender el contexto.

## Solución
Se utiliza **Human-in-the-Loop with AI Decision Gate**.

El agente de IA analiza el contenido y calcula un resultado con base en evidencia, riesgo y consistencia de fuentes. Según ese resultado, decide si el caso:

- `PASS`: puede avanzar a revisión editorial.
- `NO_PASS`: no debe avanzar porque no hay evidencia suficiente o existen señales fuertes de riesgo.
- `HUMAN_REVIEW`: requiere revisión humana porque el caso es ambiguo.

La IA no publica contenido ni declara verdad absoluta. Solo decide si el caso pasa o no pasa dentro del flujo de verificación.

## Reglas de decisión del agente

| Resultado | Condición |
|---|---|
| `PASS` | `evidenceScore >= 75`, `riskScore <= 35` y al menos 2 fuentes confiables coinciden. |
| `HUMAN_REVIEW` | `evidenceScore` entre 50 y 74, o `riskScore` entre 36 y 60, o hay fuentes parcialmente contradictorias. |
| `NO_PASS` | `evidenceScore < 50`, o `riskScore > 60`, o no hay fuentes confiables suficientes. |

## Componentes

| Componente | Ubicación en `/src` | Responsabilidad | Input | Output |
|---|---|---|---|---|
| `CreateVerificationCaseService` | `/src/backend/application/verification/CreateVerificationCaseService.ts` | Orquesta el flujo completo de verificación. | `CreateVerificationRequestDTO` | `VerificationResultDTO` |
| `ClaimExtractionService` | `/src/backend/application/claims/ClaimExtractionService.ts` | Extrae la afirmación principal usando `AIAmbassador`. | Texto normalizado | `ClaimCandidate` |
| `FactCheckEvidenceService` | `/src/backend/application/evidence/FactCheckEvidenceService.ts` | Busca evidencia y verificaciones previas. | `ClaimCandidate` | `EvidenceResult[]` |
| `RiskAnalysisService` | `/src/backend/application/risk/RiskAnalysisService.ts` | Calcula señales de riesgo. | Texto y evidencia | `RiskSignal[]` |
| `EvidenceScoreService` | `/src/backend/application/scoring/EvidenceScoreService.ts` | Calcula `evidenceScore`. | Evidencia | `number` |
| `RiskScoreService` | `/src/backend/application/scoring/RiskScoreService.ts` | Calcula `riskScore`. | Señales de riesgo | `number` |
| `SourceAgreementService` | `/src/backend/application/scoring/SourceAgreementService.ts` | Calcula `sourceAgreement`. | Evidencia | `HIGH`, `MEDIUM`, `LOW` |
| `AIDecisionGate` | `/src/backend/application/verification/AIDecisionGate.ts` | Decide `PASS`, `NO_PASS` o `HUMAN_REVIEW`. | Scores y evidencia | `AgentDecisionResult` |

## Métodos principales

| Clase | Método |
|---|---|
| `CreateVerificationCaseService` | `execute(request: CreateVerificationRequestDTO)` |
| `ClaimExtractionService` | `extractClaim(rawText: string)` |
| `FactCheckEvidenceService` | `searchEvidence(claim: ClaimCandidate)` |
| `RiskAnalysisService` | `analyze(rawText: string, evidence: EvidenceResult[])` |
| `EvidenceScoreService` | `calculate(evidence: EvidenceResult[])` |
| `RiskScoreService` | `calculate(riskSignals: RiskSignal[])` |
| `SourceAgreementService` | `calculate(evidence: EvidenceResult[])` |
| `AIDecisionGate` | `decide(input: AIDecisionGateInput)` |

## Diagrama

~~~text
+------------------------------------------------------+
|              CreateVerificationCaseService           |
|------------------------------------------------------|
| + execute(request)                                   |
| + orchestrateVerification()                          |
+------------------------------------------------------+
                         |
                         v
+------------------------------------------------------+
|                ClaimExtractionService                |
|------------------------------------------------------|
| + extractClaim(rawText)                              |
+------------------------------------------------------+
                         |
                         v
+------------------------------------------------------+
|                FactCheckEvidenceService              |
|------------------------------------------------------|
| + searchEvidence(claim)                              |
+------------------------------------------------------+
                         |
                         v
+------------------------------------------------------+
|                  RiskAnalysisService                 |
|------------------------------------------------------|
| + analyze(rawText, evidence)                         |
+------------------------------------------------------+
                         |
                         v
+---------------------------+     +---------------------------+     +---------------------------+
|   EvidenceScoreService    |     |      RiskScoreService     |     |  SourceAgreementService   |
|---------------------------|     |---------------------------|     |---------------------------|
| + calculate(evidence)     |     | + calculate(riskSignals)  |     | + calculate(evidence)     |
+---------------------------+     +---------------------------+     +---------------------------+
              \                         |                         /
               \                        |                        /
                v                       v                       v
+------------------------------------------------------+
|                    AIDecisionGate                    |
|------------------------------------------------------|
| + decide(input)                                      |
| + calculateDecision()                                |
+------------------------------------------------------+
              |                    |                  |
              v                    v                  v
       +-------------+     +---------------+   +----------------+
       |    PASS     |     |    NO_PASS    |   | HUMAN_REVIEW   |
       +-------------+     +---------------+   +----------------+
              |                    |                  |
              v                    v                  v
+---------------------+  +---------------------+  +----------------------+
| READY_FOR_REVIEW    |  | NOT_VERIFIABLE      |  | Manual Review Needed |
+---------------------+  +---------------------+  +----------------------+
              \                    |                  /
               \                   |                 /
                v                  v                v
+------------------------------------------------------+
|                    AuditLogRepository                |
|------------------------------------------------------|
| + create(event)                                      |
+------------------------------------------------------+
~~~

## Restricciones
- La IA puede decidir `PASS`, `NO_PASS` o `HUMAN_REVIEW`.
- La IA no puede publicar contenido automáticamente.
- `PASS` significa que el caso avanza a revisión editorial, no que sea verdad absoluta.
- `NO_PASS` significa que el caso no tiene condiciones suficientes para avanzar.
- Los casos ambiguos siempre deben ir a `HUMAN_REVIEW`.
- Toda decisión del agente debe guardar evidencia, puntajes y razón.
- El usuario no debe ver únicamente `TRUE` o `FALSE`; debe ver evidencia, riesgo y estado del caso.

## Manejo de excepciones

| Caso | Respuesta |
|---|---|
| No se puede extraer una afirmación | `HUMAN_REVIEW` con ingreso manual de claim. |
| No se encuentra evidencia | `NO_PASS` o `NOT_VERIFIABLE`. |
| Fuentes contradictorias | `HUMAN_REVIEW`. |
| Falla la IA | `HUMAN_REVIEW` por seguridad. |
| Usuario sin permisos decide | `ACCESS_DENIED`. |
| Puntajes incompletos | `HUMAN_REVIEW` hasta completar evidencia. |

## Estados finales del flujo

| Estado | Significado |
|---|---|
| `READY_FOR_REVIEW` | El caso pasó el análisis automático y puede avanzar a revisión editorial. |
| `NOT_VERIFIABLE` | No hay evidencia suficiente para sostener el contenido. |
| `HUMAN_REVIEW` | El caso requiere decisión humana por ambigüedad o riesgo medio. |
| `ACCESS_DENIED` | Un usuario sin permisos intentó tomar una decisión. |