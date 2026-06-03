# Architectural Pattern — AI Provider Ambassador

## Nombre del workflow

Procesamiento centralizado de solicitudes de IA para verificación de contenido sospechoso.

---

## Patrón seleccionado

**Ambassador Pattern**

---

## Reto a resolver

IA Detector necesita ejecutar tareas relacionadas con IA dentro del flujo principal de verificación:

- extraer la afirmación principal desde texto o URL,
- extraer texto desde una imagen o screenshot usando OCR mock/local stub en el MVP,
- calcular señales de riesgo,
- normalizar respuestas para que el backend trabaje con un formato único.

Sin un patrón arquitectónico, cada servicio del backend podría conectarse directamente a un proveedor de IA o a un stub local. Eso generaría alto acoplamiento, lógica duplicada, manejo de errores repetido y dificultad para cambiar proveedores sin modificar varias partes del sistema.

Ejemplo de problema sin patrón:

```text
ClaimExtractionService  ───► OpenAI API
RiskSignalService       ───► OpenAI API
ImageTextService        ───► OCR Stub
VerificationService     ───► OpenAI API
```

Ese diseño no es conveniente porque:

- cada servicio tendría su propio manejo de API keys,
- cada servicio tendría su propio timeout y retry,
- cada servicio tendría que normalizar respuestas por separado,
- cambiar el proveedor de IA obligaría a modificar varios archivos,
- los errores externos se propagarían de forma inconsistente,
- sería más difícil probar el MVP local con respuestas simuladas.

---

## Solución

Se utiliza el **Ambassador Pattern** mediante un componente central llamado `AIAmbassador`.

`AIAmbassador` funciona como punto único de entrada para cualquier operación de IA usada por IA Detector. Los servicios del backend no llaman directamente a proveedores externos ni a stubs locales. En su lugar, llaman al ambassador.

El ambassador se encarga de:

- enrutar solicitudes de IA,
- seleccionar el conector correcto,
- aplicar timeout,
- aplicar retry controlado,
- normalizar respuestas,
- registrar eventos de observabilidad,
- devolver DTOs internos al backend.

Para el MVP local, el ambassador debe poder trabajar con respuestas simuladas o conectores locales. Esto permite construir y probar el flujo principal sin depender de servicios externos pagados.

---

## Diseño de clases

```text
+------------------------------------------------------+
|                    AIAmbassador                      |
|------------------------------------------------------|
| + extractClaim(rawText)                              |
| + analyzeRisk(rawText, evidence)                     |
| + extractTextFromImage(fileId)                       |
| + routeRequest(request)                              |
| + normalizeResponse(providerResponse)                |
+------------------------------------------------------+
             |                         |
             |                         |
             v                         v
+---------------------------+   +---------------------------+
|      AITextConnector      |   |       OCRConnector        |
|---------------------------|   |---------------------------|
| + sendPrompt(prompt)      |   | + extractText(fileId)     |
| + parseResponse(response) |   | + parseResponse(response) |
+---------------------------+   +---------------------------+
             |                         |
             |                         |
             v                         v
+---------------------------+   +---------------------------+
|      MockAIConnector      |   |     MockOCRConnector      |
|---------------------------|   |---------------------------|
| + sendPrompt(prompt)      |   | + extractText(fileId)     |
| + parseResponse(response) |   | + parseResponse(response) |
+---------------------------+   +---------------------------+

+------------------------------------------------------+
|                    RetryManager                      |
|------------------------------------------------------|
| + executeWithRetry(operation)                        |
| + applyTimeout(operation)                            |
+------------------------------------------------------+

+------------------------------------------------------+
|                    AIResponseAdapter                 |
|------------------------------------------------------|
| + toClaimCandidate(response)                         |
| + toRiskSignals(response)                            |
| + toExtractedImageText(response)                     |
+------------------------------------------------------+

+------------------------------------------------------+
|                    LoggerService                     |
|------------------------------------------------------|
| + logAIRequest(event)                                |
| + logAIError(error)                                  |
| + recordLatency(metric)                              |
+------------------------------------------------------+
```

---

## Ubicación en `/src`

```text
/src/backend
├── application/
│   └── ai/
│       ├── AIAmbassador.ts
│       ├── RetryManager.ts
│       └── AIResponseAdapter.ts
│
├── infrastructure/
│   └── ai/
│       ├── AITextConnector.ts
│       ├── OCRConnector.ts
│       ├── MockAIConnector.ts
│       └── MockOCRConnector.ts
│
├── domain/
│   └── ai/
│       ├── ClaimCandidate.ts
│       ├── RiskSignal.ts
│       ├── ExtractedImageText.ts
│       └── AIProviderResponse.ts
│
└── infrastructure/
    └── observability/
        └── LoggerService.ts
```

---

## Responsabilidades de componentes

| Componente | Responsabilidad | Input | Output |
|---|---|---|---|
| `AIAmbassador` | Punto único de entrada para operaciones de IA. | Solicitudes internas del backend. | DTOs normalizados. |
| `AITextConnector` | Ejecuta operaciones de IA textual para extracción de claims y señales de riesgo. | Prompt o texto normalizado. | Respuesta cruda del proveedor. |
| `OCRConnector` | Extrae texto desde imágenes cuando exista OCR real en una fase posterior. | `fileId` o referencia de imagen. | Texto extraído. |
| `MockAIConnector` | Simula respuestas de IA para el MVP local. | Prompt o texto normalizado. | Respuesta simulada. |
| `MockOCRConnector` | Simula extracción de texto desde imagen para el MVP local. | `fileId` o imagen de prueba. | Texto simulado. |
| `RetryManager` | Aplica timeout y reintentos controlados. | Operación asíncrona. | Resultado o excepción controlada. |
| `AIResponseAdapter` | Convierte respuestas externas o simuladas a DTOs internos. | Respuesta del conector. | `ClaimCandidate`, `RiskSignal`, `ExtractedImageText`. |
| `LoggerService` | Registra eventos, latencia y errores. | Evento o excepción. | Log estructurado. |

---

## Métodos principales

| Clase | Método | Uso |
|---|---|---|
| `AIAmbassador` | `extractClaim(rawText)` | Extrae la afirmación principal desde texto o contenido de URL. |
| `AIAmbassador` | `analyzeRisk(rawText, evidence)` | Calcula señales de riesgo a partir del contenido y la evidencia. |
| `AIAmbassador` | `extractTextFromImage(fileId)` | Extrae texto desde imagen usando OCR mock/local stub en el MVP. |
| `AIAmbassador` | `routeRequest(request)` | Selecciona el conector correcto según el tipo de operación. |
| `AIAmbassador` | `normalizeResponse(providerResponse)` | Convierte la respuesta en DTOs internos. |
| `AITextConnector` | `sendPrompt(prompt)` | Envía una solicitud textual al proveedor configurado o al mock. |
| `AITextConnector` | `parseResponse(response)` | Procesa la respuesta textual cruda. |
| `OCRConnector` | `extractText(fileId)` | Extrae texto desde una imagen. |
| `RetryManager` | `executeWithRetry(operation)` | Ejecuta una operación con reintentos controlados. |
| `RetryManager` | `applyTimeout(operation)` | Corta la operación si supera el tiempo configurado. |
| `AIResponseAdapter` | `toClaimCandidate(response)` | Convierte respuesta de IA en `ClaimCandidate`. |
| `AIResponseAdapter` | `toRiskSignals(response)` | Convierte respuesta de IA en `RiskSignal[]`. |
| `LoggerService` | `logAIRequest(event)` | Registra solicitud de IA. |
| `LoggerService` | `logAIError(error)` | Registra error de IA. |

---

## Flujo del patrón

1. Un servicio del backend necesita una operación de IA.
2. El servicio llama a `AIAmbassador`, no al proveedor directamente.
3. `AIAmbassador` identifica el tipo de solicitud:
   - extracción de claim,
   - análisis de riesgo,
   - extracción de texto desde imagen.
4. `AIAmbassador` selecciona el conector correspondiente.
5. `RetryManager` ejecuta la operación con timeout y retry.
6. El conector devuelve una respuesta cruda o simulada.
7. `AIResponseAdapter` normaliza la respuesta.
8. `AIAmbassador` devuelve un DTO interno al backend.
9. `LoggerService` registra latencia, éxito o error.

---

## Configuración requerida

```env
AI_MODE=mock
AI_TIMEOUT_SECONDS=8
AI_MAX_RETRIES=2
AI_TEXT_PROVIDER=mock
OCR_PROVIDER=mock
```

Para el MVP local:

```env
AI_MODE=mock
AI_TEXT_PROVIDER=mock
OCR_PROVIDER=mock
```

Esto significa que el MVP puede ejecutarse sin depender de un proveedor real de IA.

---

## Reglas para desarrolladores

- Ningún servicio del backend puede llamar directamente a un proveedor de IA.
- Toda operación de IA debe pasar por `AIAmbassador`.
- `AIAmbassador` debe devolver DTOs internos, no respuestas crudas del proveedor.
- Los conectores no deben contener lógica de negocio de IA Detector.
- `RetryManager` es el único responsable de timeout y retry.
- `AIResponseAdapter` es el único responsable de convertir respuestas externas a modelos internos.
- Las API keys o secretos nunca deben estar hardcodeados.
- En el MVP, los conectores mock deben permitir ejecutar el flujo completo localmente.
- El patrón no debe implementar detección real de deepfake porque está fuera del alcance del MVP.
- Si el proveedor de IA falla, el sistema debe continuar con resultado parcial o enviar el caso a `HUMAN_REVIEW`.

---

## Manejo de excepciones

| Caso | Respuesta del sistema |
|---|---|
| Timeout del proveedor de IA | `RetryManager` reintenta hasta 2 veces. Si falla, devuelve error controlado. |
| Falla del conector textual | `AIAmbassador` marca la operación como fallida y permite continuar con evidencia parcial. |
| Falla del OCR mock/local | El caso pasa a `HUMAN_REVIEW` o permite ingreso manual de texto. |
| Respuesta inválida del proveedor | `AIResponseAdapter` rechaza la respuesta y registra error de normalización. |
| Configuración faltante | El backend no debe iniciar el servicio y debe reportar error de configuración. |
| Límite de rate limit externo | El sistema registra el evento y usa fallback mock o `HUMAN_REVIEW` según ambiente. |
| Error desconocido | Se registra en `LoggerService` y se devuelve una excepción controlada al flujo de verificación. |

---

## DTOs internos esperados

### ClaimCandidate

```ts
type ClaimCandidate = {
  claimText: string;
  sourceType: "TEXT" | "URL" | "IMAGE";
  confidence: number;
};
```

### RiskSignal

```ts
type RiskSignal = {
  type: "NO_SOURCE" | "EMOTIONAL_LANGUAGE" | "CONTRADICTORY_EVIDENCE" | "LOW_SOURCE_AGREEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
};
```

### ExtractedImageText

```ts
type ExtractedImageText = {
  fileId: string;
  extractedText: string;
  extractionMode: "MOCK" | "LOCAL_STUB" | "REAL_OCR";
};
```

---

## Acceptance Criteria

The Ambassador Pattern is correctly applied when:

- backend services call `AIAmbassador` instead of calling IA providers directly,
- text, URL and image/screenshot flows can use the same ambassador entry point,
- MVP can run locally with mock connectors,
- responses are normalized before reaching application services,
- timeout and retry logic are centralized,
- failures do not crash the verification flow,
- real deepfake detection is not implemented in the MVP,
- the system can route failed or uncertain IA operations to `HUMAN_REVIEW`.