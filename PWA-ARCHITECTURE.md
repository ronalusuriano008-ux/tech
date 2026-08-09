# Arquitectura PWA offline-first

## Diagnóstico y migración

La versión anterior (`shared/sw.js`) precacheaba solo el login y dependía de red para API y datos. Las pantallas protegidas se cacheaban solo después de una navegación correcta; cada módulo consumía `fetch` directamente y varios usaban `localStorage` para el perfil. No hay WebSocket ni sincronización existente. Los recursos críticos externos identificados son Pico, Bootstrap, Font Awesome, Boxicons, Google Fonts y html2canvas: siguen siendo mejoras visuales, pero el shell y los datos no dependen de ellos para persistir ni sincronizar.

La migración conserva manifest, iconos, `config.js`, rutas y cookie de sesión. Reemplaza el SW v3 por v4 y no deja dos registradores o caches activos: la activación limpia caches con nombres anteriores.

## Capas

`UI -> DataService -> IndexedDB (records, meta, operations) -> Sync -> API -> backend`.

`DataService.get` usa red primero y guarda respuestas JSON por URL; si falla, devuelve su copia IndexedDB. `create`, `update` y `delete` se envían normalmente y, ante una falla de red, se encolan con UUID, método, cuerpo, clave de recurso, estado, reintentos y marca temporal. El indicador global refleja conexión, cola y sincronización.

La cola se procesa ordenada al evento `online` y mediante Background Sync cuando el navegador lo admite. Errores transitorios permanecen pendientes; errores HTTP quedan como fallidos; un 409 queda como conflicto y no se reintenta silenciosamente. El límite actual es cinco intentos; el próximo incremento puede añadir backoff por `updatedAt` sin cambiar las APIs de UI.

## Autenticación, conflictos y servidor

La cookie `httpOnly` sigue siendo la única credencial. IndexedDB conserva exclusivamente el perfil visible y la hora de la última validación, nunca contraseña ni cookie. Sin red solo se habilita una sesión que ya fue validada en ese equipo; no se intenta login offline. Un 401 online invalida la sesión normal.

Las operaciones llevan `X-Operation-Id`; el middleware de backend guarda su primera respuesta durante 14 días y devuelve esa respuesta si el navegador la reenvía, evitando duplicados. Para servicios nuevos el servidor asigna su identificador definitivo. Los recursos de día/mes son reemplazos completos: ante un futuro `409`, la operación se conserva como `conflict` para revisión humana en lugar de aplicar "última escritura gana". Reportes/PDF, backups e inicio de sesión siguen siendo online-only porque no tienen una equivalencia local segura.

## Service Worker y actualización

El SW v4 precachea shell, login, manifest, iconos y capa de datos. Navegaciones usan network-first con fallback de página y `offline.html`; JS/CSS/iconos usan stale-while-revalidate. API y `/data` nunca se guardan en Cache Storage: los datos autenticados están en IndexedDB y tienen política explícita. Las actualizaciones se anuncian y no fuerzan `skipWaiting`, para no interrumpir una edición offline; al recargar se adopta la nueva versión.

## Cobertura actual

Los flujos de diario, tienda y registro de servicios ya usan la capa común. El resto de lecturas existentes conserva su comportamiento online y puede migrarse de forma gradual a `DataService` sin cambiar el contrato de backend. Administración, exportación/importación, reportes y generación de PDF permanecen explícitamente online por seguridad e integridad.
