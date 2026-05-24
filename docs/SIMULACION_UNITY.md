# Simulacion Unity

MinerGuard queda preparado para recibir estados simulados desde Unity por HTTP.

## Endpoint

```txt
POST http://localhost:4000/api/simulation/state
```

Desde otro equipo/celular en la misma red:

```txt
POST http://IP_DEL_COMPUTADOR:4000/api/simulation/state
```

## Payload

```json
{
  "deviceCode": "HELMET-001",
  "position": {
    "x": 61.4,
    "y": 38.2,
    "z": 0
  },
  "nearestNodeCode": "GW-NORTE-002",
  "confidence": 0.84,
  "vitals": {
    "heartRate": 86,
    "spo2": 98,
    "bodyTemperature": 36.7
  },
  "motion": {
    "fallDetected": false,
    "accelX": 0.02,
    "accelY": 0.01,
    "accelZ": 0.98
  },
  "battery": 79,
  "signalRssi": -69,
  "snr": 8.2
}
```

## Campos Principales

- `deviceCode`: codigo del dispositivo existente en MinerGuard.
- `position.x/y`: coordenadas 2D del mapa/simulacion.
- `nearestNodeCode`: nodo LoRa mas cercano o nodo que recibio la senal.
- `confidence`: confianza de ubicacion entre `0` y `1`.
- `vitals.heartRate`: frecuencia cardiaca.
- `vitals.spo2`: oxigenacion de sangre.
- `motion.fallDetected`: caida detectada.
- `battery`: bateria del wearable.
- `signalRssi`: fuerza de senal LoRa.
- `snr`: relacion senal/ruido.

## Efectos en la Plataforma

Cada envio crea registros en:

- `TelemetryEvent`
- `VitalSignEvent`
- `LocationEvent`
- `NodeSignalEvent`

Tambien puede generar alertas automaticas:

- SpO2 baja.
- Frecuencia cardiaca alta.
- Caida detectada.
- Bateria baja.

El dashboard refresca datos cada 3 segundos y refleja el movimiento en el mapa operativo.
