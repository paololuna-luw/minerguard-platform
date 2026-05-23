# Arquitectura

## Vista General

```txt
Dispositivo del minero
  ESP32 / sensores / boton SOS
        |
        | LoRa, BLE, UWB o enlace definido por pruebas
        v
Nodos internos / gateways
        |
        | MQTT / HTTP
        v
Backend NestJS
        |
        +--> PostgreSQL
        +--> WebSocket
        v
Dashboard Next.js
```

## Componentes

### Frontend

Aplicacion Next.js ubicada en `apps/frontend`. Su responsabilidad es mostrar estado operativo, mapa del socavon, mineros activos, dispositivos, alertas e historial.

### Backend

Aplicacion NestJS ubicada en `apps/backend`. Sus responsabilidades iniciales son:

- Exponer API REST.
- Consumir telemetria por MQTT.
- Emitir eventos en tiempo real por WebSocket.
- Validar contratos de datos.
- Persistir informacion en PostgreSQL.

### Base de Datos

PostgreSQL guarda entidades operativas y eventos:

- minas
- zonas
- mineros
- dispositivos
- gateways
- telemetria
- alertas

Si la telemetria crece mucho, se evaluara TimescaleDB.

### MQTT

Mosquitto se usa como broker local. El backend se suscribe a topicos de telemetria y alertas.

## Principio de Diseno

Los dispositivos no deben depender directamente del dashboard. Deben publicar mensajes a una capa de comunicacion estable; el backend interpreta, valida, guarda y distribuye la informacion.
