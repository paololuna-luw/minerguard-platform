export const mqttTopics = {
  telemetry: "mines/+/devices/+/telemetry",
  alerts: "mines/+/alerts/+"
} as const;

export const defaultPorts = {
  frontend: 3000,
  backend: 4000,
  postgres: 5432,
  mqtt: 1883,
  mqttWebsocket: 19001
} as const;
