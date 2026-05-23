# Dashboard

## Objetivo

El dashboard debe permitir a operadores ver el estado de la mina en tiempo real, identificar mineros activos, revisar alertas y consultar el ultimo punto o zona conocida de cada dispositivo.

## Vistas Iniciales

- Resumen operativo.
- Mapa o plano del socavon.
- Lista de mineros.
- Estado de dispositivos.
- Alertas abiertas.
- Historial de eventos.

## Datos en Tiempo Real

El backend emitira eventos por WebSocket:

```txt
telemetry.received
alert.received
```

El frontend debe conectarse a:

```txt
ws://localhost:4000/realtime
```
