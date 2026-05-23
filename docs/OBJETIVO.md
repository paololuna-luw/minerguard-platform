# Objetivo del Proyecto

## Objetivo General

Desarrollar una plataforma de monitoreo para zonas mineras subterraneas que permita conocer el estado y la ultima ubicacion estimada de los mineros dentro del socavon, recibir telemetria de dispositivos, registrar eventos criticos y generar alertas operativas en tiempo real.

## Problema

En zonas mineras informales o con baja infraestructura de seguridad, las emergencias, accidentes y muertes pueden no quedar registradas oportunamente. La comunicacion dentro de socavones es compleja por la profundidad, humedad, geometria irregular y obstrucciones fisicas.

MinerGuard busca crear una base tecnologica para mejorar trazabilidad, reaccion ante emergencias y registro historico de eventos.

## Alcance Inicial

- Dashboard web de monitoreo.
- Backend central para telemetria y alertas.
- Base de datos para minas, zonas, mineros, dispositivos y eventos.
- Recepcion de mensajes MQTT.
- Comunicacion en tiempo real hacia el dashboard.
- Simulacion de dispositivos antes de integrar hardware real.

## Alcance Futuro

- Integracion con ESP32 y LoRa/LoRaWAN.
- Nodos internos en puntos estrategicos del socavon.
- Estimacion de ubicacion por zona o nodo cercano.
- Alertas por boton SOS, bateria baja, gases, temperatura o perdida de senal.
- Reportes historicos y auditoria.
- Sincronizacion externa si el servidor local queda aislado.

## Criterio Tecnico

La primera version prioriza una arquitectura robusta y extensible. La ubicacion inicial debe tratarse como estimacion por zona, no como posicion exacta, hasta validar hardware y propagacion de senal dentro de minas reales.
