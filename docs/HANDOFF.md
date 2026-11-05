# Handoff

## Estado actual (rama `feat/ui-rebuild`)
- Nueva figura isométrica **"El ATM por dentro"** en `/simulator/[id]`, como tercera columna junto al ATM y al lector de tarjeta.
- Al confirmar una transacción (retiro/depósito/pago/consulta) se anima un paquete que recorre: lector → EPP (PIN block) → PC (mensaje NDC) → módulo de seguridad (MAC/TLS) → red → switch (NDC → ISO 8583 0200) → emisor (0210, DE39) → switch (respuesta NDC) → dispensador/impresora.
- La pantalla del ATM espera ~11,8 s (`TRACE_HOLD_MS`) antes de mostrar el resultado; botón **Saltar** lo adelanta y **Repetir** vuelve a reproducir.

## Archivos
- `src/components/iso/` — kit isométrico (copiado de la skill `anatomy`, sin cambios salvo un `eslint-disable` en `react/live.tsx`).
- `src/components/simulator/inside/model.ts` — pasos, tiempos y textos (fuente única para dibujo, readout y explicación).
- `src/components/simulator/inside/geometry.ts` — geometría estática, rutas de cables y del paquete, etiquetas por módulo.
- `src/components/simulator/inside/AtmInsideFigure.tsx` + `atm-inside.css` — componente cliente; reloj por tiempo real (`performance.now`).
- `src/store/atmStore.ts` — campo `trace`, `skipTrace()`, espera `holdForTrace()` en `authorizeAndComplete` y `requestBalanceInquiry`.

## Decisiones
- Ritmo 10–15 s (pedido del usuario): ~13,6 s en total.
- El PIN block y el MAC son ilustrativos: `src/lib/ndc.ts` no los genera.
- Paquete con color por tramo: azul NDC, naranjo ISO 8583, verde respuesta. Módulo activo en azul `#0070C8`.

## Pendientes / ideas
- No se corrió el `audit` de la skill anatomy (orden de pintado medido); el paquete se dibuja siempre encima.
- Posibles mejoras: acercamientos (zoom) al mensaje NDC campo a campo y a la traducción ISO 8583 en el switch.
- `package-lock.json` está desincronizado (`npm ci` falla por `@emnapi/*`); se usó `npm install` localmente sin commitear el lock.
