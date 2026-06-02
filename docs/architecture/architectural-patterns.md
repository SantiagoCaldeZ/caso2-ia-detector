## architecture pattern - Ambassador pattern
------------
## workflow:
    conexión a distintos proveedores de modelos de IA para el procesamiento de noticias e imagenes.

## problema a resolver: dificultad para cambiar modelos de IA y dependencias de proveedores especificos.
    Sin patrón arquitectonico, la app utiliza conexiones directas hacia cada servicio de IA, generando código más dificl de mantener, poca reutilización y alto acoplamiento.

## solucion: 
    patrón ambassador 

## clases

    +------------------------------------------------+
    |                 AIAmbassador                   |
    |------------------------------------------------|
    | + analyzeText()                                |
    | + analyzeImage()                               |
    | + routeRequest()                               |
    | + handleRetry()                                |
    | + normalizeResponse()                          |
    +------------------------------------------------+
                |             |
                |             |
        +-------+             +-------+
        |                             |
        v                             v

    +-------------------+     +-------------------+
    | OpenAIConnector   |     | VisionConnector   |
    |-------------------|     |-------------------|
    | + sendPrompt()    |     |+ detectDeepfake() |
    | + parseResponse() |     |+ analyzeMetadata()|
    +-------------------+     +-------------------+

                |
                v

    +-------------------+
    | RetryManager      |
    |-------------------|
    | + executeRetry()  |
    | + applyTimeout()  |
    +-------------------+

                |
                v

    +-------------------+
    | LoggerService     |
    |-------------------|
    |+ saveLog()        |
    |+ generateMetrics()|
    +-------------------+

## responsabilidades & ubicación
    | Componente      | Responsabilidad                | Entrada                 | Salida                  | Ubicación
    | --------------- | ------------------------------ | ----------------------- | ----------------------- |-----------------------
    | AI Ambassador   | Gestión centralizada de IA     | Solicitudes del backend | Respuestas normalizadas |services/ambassador/AIAmbassador.ts
    | OpenAIConnector | Análisis textual               | Texto                   | Resultado IA            |services/connectors/OpenAIConnector.ts
    | VisionConnector | Detección de imágenes falsas   | Imagen                  | Resultado visual        |services/connectors/VisionConnector.ts
    | RetryManager    | Manejo de errores y reintentos | Request fallido         | Nueva ejecución         |services/ambassador/RetryManager.ts
    | LoggerService   | Monitoreo y logs               | Eventos del sistema     | Métricas                |services/ambassador/LoggerService.ts

## excepciones
    timeout: retry automático
    API down: failover a otro proveedor
    rate limit excedido: implementacion de queue y throttling
    respuesta invalida: normalización y validación
    error de autenticación: actualiación de tokens