# Comunicacion IoT

## Estrategia Inicial

La comunicacion debe separar hardware, transporte y software central. El backend no debe depender de un modelo especifico de dispositivo, sino de contratos de telemetria estables.

## Opciones de Comunicacion

### LoRa / LoRaWAN

Ventajas:

- Bajo consumo.
- Buen alcance relativo.
- Adecuado para mensajes pequenos.

Limitaciones:

- La ubicacion precisa en tiempo real no esta garantizada.
- La propagacion dentro de minas depende de roca, humedad, curvas y profundidad.
- Requiere pruebas de campo para definir cantidad y posicion de nodos.

### BLE Beacons

Util para detectar presencia por zonas o puntos cercanos.

### UWB

Mejor opcion para ubicacion precisa, pero mas costosa y con mayor complejidad.

## Recomendacion V1

Usar ubicacion por zona o nodo mas cercano. La posicion debe tratarse como estimada.

## Topicos MQTT Iniciales

```txt
mines/{mineId}/devices/{deviceId}/telemetry
mines/{mineId}/alerts/{alertType}
```

## Payload de Telemetria

```json
{
  "mineId": "mine-001",
  "deviceId": "helmet-001",
  "gatewayId": "gateway-001",
  "zoneId": "zone-a",
  "battery": 87,
  "signalRssi": -72,
  "temperature": 28.4,
  "gasLevel": 0.02,
  "emergency": false,
  "locationHint": {
    "method": "lora_node",
    "confidence": 0.7,
    "label": "Galeria norte"
  }
}
```

## Alertas Iniciales

- Boton SOS.
- Bateria baja.
- Perdida de senal.
- Temperatura alta.
- Nivel de gas critico.
