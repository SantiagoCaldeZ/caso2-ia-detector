# Hallazgos y Correcciones Aplicadas por los Agentes

> Este archivo registra hallazgos reales de revisiones de agentes. Cada entrada incluye archivo:línea, severidad, riesgo, corrección sugerida y decisión del equipo.

## Registro de cambios

---

### 2026-06-18 - code-quality-security - SEC-001

**Descripción del hallazgo**:
Validación de MIME type en el upload de imágenes usa `file.mimetype`, que proviene del header `Content-Type` enviado por el cliente en el form-data multipart. Un atacante puede enviar `Content-Type: image/jpeg` con contenido arbitrario (SVG con XSS, HTML, ejecutable) y pasar la validación sin detección.

**Ubicación(es)**:
`src/backend/api/controllers/UploadController.ts:42`

**Severidad**: Alta (producción) / Media (MVP mock sin almacenamiento real que sirva archivos)

**Corrección sugerida**:
Validar magic bytes del `file.buffer` con `file-type`:
```ts
import { fileTypeFromBuffer } from 'file-type';
const detected = await fileTypeFromBuffer(file.buffer);
if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
  throw new UnsupportedMediaTypeException('Only JPEG, PNG, and WEBP files are allowed.');
}
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Elimina bypass de validación MIME via header cliente.

---

### 2026-06-18 - code-quality-security - SEC-002

**Descripción del hallazgo**:
La rama `else` del bloque `catch` en el bootstrap de `AuthProvider` ejecuta exactamente la misma acción que la rama `if`: `applySession(null, null)`. En consecuencia, errores 500, timeouts de red u otros fallos del backend destruyen la sesión silenciosamente como si el token hubiera expirado.

**Ubicación(es)**:
`src/frontend/app/providers/AuthProvider.tsx:79-85`

**Severidad**: Baja (MVP), Media (producción)

**Corrección sugerida**:
Eliminar el `if/else` y dejar una sola llamada `applySession(null, null)`, o diferenciar la rama `else` para no destruir sesión en errores de red inesperados.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Elimina código muerto y previene logout silencioso ante errores no relacionados con autenticación.

---

### 2026-06-18 - code-quality-security - SEC-003

**Descripción del hallazgo**:
`traceId` se concatena directamente en el mensaje de error visible al usuario en la UI en múltiples lugares. Facilita la correlación de requests propias con logs del backend.

**Ubicación(es)**:
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:57-58`
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:65-66`

**Severidad**: Baja

**Corrección sugerida**:
Mostrar `traceId` en un tooltip o sección colapsable de soporte, no inline en el mensaje de error visible al usuario.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Reduce superficie de información expuesta al usuario final.

---

### 2026-06-18 - code-quality-security - SEC-004

**Descripción del hallazgo**:
`void runImageFlow()` en el handler del form ejecuta una función async sin catch para errores fuera del ciclo `onError` de la mutation. Si ocurre una excepción inesperada dentro de `runImageFlow`, la promesa se descarta silenciosamente sin feedback al usuario.

**Ubicación(es)**:
`src/frontend/features/verification/pages/VerificationHubPage.tsx:137`

**Severidad**: Baja

**Corrección sugerida**:
```ts
runImageFlow().catch((error) => {
  const parsed = toApiError(error);
  setApiError(parsed.message);
});
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Evita que el usuario quede con el botón girando indefinidamente sin feedback.

---

### 2026-06-18 - kiss-principle-agent - KISS-001

**Descripción del hallazgo**:
Ambas ramas del `if/else` en el catch del bootstrap de `AuthProvider` son idénticas. El `if` documenta una intención que nunca se materializó en comportamiento distinto. La rama `else` es código muerto que puede inducir a error a futuros desarrolladores.

**Ubicación(es)**:
`src/frontend/app/providers/AuthProvider.tsx:82-87`

**Severidad**: Baja

**Corrección sugerida**:
Eliminar el `if/else` completo:
```ts
if (isMounted) {
  applySession(null, null);
}
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Simplifica el bloque catch y elimina dead code.

---

### 2026-06-18 - kiss-principle-agent - KISS-002

**Descripción del hallazgo**:
La expresión ternaria de formateo de error está duplicada literalmente en los dos `onError` handlers consecutivos de `VerificationHubPage`. Si la convención de formato cambia, hay que actualizar ambos sitios.

**Ubicación(es)**:
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:57-58`
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:65-66`

**Severidad**: Baja

**Corrección sugerida**:
```ts
const formatMutationError = (parsed: ReturnType<typeof toApiError>) =>
  parsed.traceId ? `${parsed.message} (traceId: ${parsed.traceId})` : parsed.message;
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Centraliza el formato de error dentro del componente.

---

### 2026-06-18 - state-management-agent - SM-002

**Descripción del hallazgo**:
`accessToken` está expuesto en `AuthContextValue` y en el value del `useMemo`. Ningún consumidor actual lo lee directamente del contexto. Exponerlo amplía la superficie XSS y lo hace visible desde DevTools y logs accidentales.

**Ubicación(es)**:
- `src/frontend/app/providers/AuthProvider.tsx:23`
- `src/frontend/app/providers/AuthProvider.tsx:105`

**Severidad**: Media

**Corrección sugerida**:
Eliminar `accessToken` de `AuthContextValue` y del value del contexto. `isAuthenticated` cubre todas las necesidades actuales de los consumidores.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Reduce superficie de exposición del token en el árbol de React.

---

### 2026-06-18 - state-management-agent - SM-003

**Descripción del hallazgo**:
No existe interceptor de respuesta en `httpClient` para renovar el token automáticamente al recibir 401 durante una sesión activa. El bootstrap cubre recarga de página pero no expiración mid-session. La regla del proyecto requiere llamar `POST /api/auth/refresh` ante expiración del access token.

**Ubicación(es)**:
`src/frontend/shared/api/httpClient.ts:16`

**Severidad**: Alta

**Corrección sugerida**:
Agregar `httpClient.interceptors.response.use` que ante 401 llame `refreshSession()`, actualice el token y reintente la petición original, con guardia para no reintentar el endpoint `/auth/refresh` mismo.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Cumple regla del proyecto y evita sesiones rotas silenciosamente tras expiración del token.

---

### 2026-06-18 - state-management-agent - SM-004

**Descripción del hallazgo**:
`uploadedImageId` y `selectedImage` no se limpian al cambiar de modo de entrada (`inputType`). Si el usuario sube una imagen, cambia a TEXT o URL, y vuelve a IMAGE sin reseleccionar archivo, el `uploadedImageId` previo persiste y el envío usa silenciosamente el archivo anterior.

**Ubicación(es)**:
`src/frontend/features/verification/pages/VerificationHubPage.tsx:155`

**Severidad**: Baja

**Corrección sugerida**:
```ts
onClick={() => {
  setInputType(mode.value);
  setSelectedImage(null);
  setUploadedImageId(null);
}}
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Previene envío silencioso de archivo anterior al cambiar de modo.

---

### 2026-06-18 - dry-principle-agent - DRY-002

**Descripción del hallazgo**:
La expresión ternaria de formateo de error con `traceId` está duplicada en 6 instancias a través de 5 archivos. La función `getApiErrorMessage` en `apiError.ts` ya existe pero no incluye `traceId`, por lo que nunca se usa.

**Ubicación(es)**:
- `src/frontend/features/verification/pages/VerificationResultPage.tsx:36-40`
- `src/frontend/features/history/pages/VerificationCaseDetailPage.tsx:35-39`
- `src/frontend/features/auth/pages/LoginPage.tsx:49-50`
- `src/frontend/features/auth/pages/RegisterPage.tsx:49-50`
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:57-58`
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:66-67`

**Severidad**: Baja

**Corrección sugerida**:
Ampliar `getApiErrorMessage` en `src/frontend/shared/errors/apiError.ts` para aceptar `ApiError` tipado e incluir `traceId`:
```ts
export function formatApiErrorMessage(error: ApiError): string {
  return error.traceId
    ? `${error.message} (traceId: ${error.traceId})`
    : error.message;
}
```

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Centraliza formato de error. Cambio en 1 lugar impacta los 6 usos.

---

### 2026-06-18 - frontend-component-generator - FC-002

**Descripción del hallazgo**:
`item.status` se renderiza como valor de enum crudo (`COMPLETED`, `FAILED`, `PROCESSING`) directamente en la UI. Las reglas del proyecto prohíben exponer valores de enum crudos al usuario. El patrón correcto (`recommendationLabel`) ya existe en `labels.ts`.

**Ubicación(es)**:
- `src/frontend/features/history/pages/VerificationHistoryPage.tsx:64`
- `src/frontend/features/verification/pages/VerificationHubPage.tsx:232`

**Severidad**: Media (viola regla del proyecto)

**Corrección sugerida**:
Agregar en `src/frontend/shared/components/report/labels.ts`:
```ts
export const statusLabel: Record<'PROCESSING' | 'COMPLETED' | 'FAILED', string> = {
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};
```
Y usar `statusLabel[item.status]` en lugar de `item.status`.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Cumple regla del proyecto y permite internacionalización futura.

---

### 2026-06-18 - frontend-component-generator - FC-003

**Descripción del hallazgo**:
`VerificationResultPage` y `VerificationCaseDetailPage` comparten el mismo `queryKey` base para el mismo recurso (`getVerificationById`) pero usan keys distintas (`'verification-case'` vs `'verification-history-case'`). TanStack Query mantiene dos entradas de caché independientes para el mismo dato, causando doble fetch innecesario y desincronización ante invalidaciones.

**Ubicación(es)**:
- `src/frontend/features/verification/pages/VerificationResultPage.tsx:17`
- `src/frontend/features/history/pages/VerificationCaseDetailPage.tsx:15`

**Severidad**: Media

**Corrección sugerida**:
Unificar ambas en `['verification-case', caseId]`.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Elimina doble fetch y unifica la caché del mismo recurso.

---

### 2026-06-18 - frontend-component-generator - FC-004

**Descripción del hallazgo**:
`getApiErrorMessage` en `apiError.ts` no incluye `traceId` y nunca se importa en ningún archivo del frontend (dead code). Coexiste con el patrón inline que sí incluye `traceId`, generando confusión sobre cuál es el helper canónico.

**Ubicación(es)**:
`src/frontend/shared/errors/apiError.ts:10`

**Severidad**: Baja

**Corrección sugerida**:
Eliminar `getApiErrorMessage` o convertirla en el helper unificado del hallazgo DRY-002.

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Pendiente de decisión del equipo.

**Impacto**:
Elimina dead code y clarifica el helper canónico de formateo de errores.

---

**Severidad**: Crítica / Alta / Media / Baja

**Corrección sugerida**:
(Qué propuso el agente, con código si aplica)

**Decisión del equipo**:
- [ ] Aceptada
- [ ] Rechazada (motivo: )
- [ ] Modificada (explicar)

**Corrección aplicada** (si aplica):
- Enlace al commit o diff.
- Explicación de cómo se implementó.

**Impacto**:
(Qué se mejoró o resolvió)

---
