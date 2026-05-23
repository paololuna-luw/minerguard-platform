import { z } from "zod";

export const telemetryMessageSchema = z.object({
  mineId: z.string().min(1),
  deviceId: z.string().min(1),
  gatewayId: z.string().optional(),
  zoneId: z.string().optional(),
  minerId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  battery: z.number().int().min(0).max(100).optional(),
  signalRssi: z.number().int().optional(),
  temperature: z.number().optional(),
  gasLevel: z.number().optional(),
  emergency: z.boolean().optional(),
  locationHint: z
    .object({
      method: z.enum(["lora_node", "ble_beacon", "uwb", "manual", "simulated"]),
      confidence: z.number().min(0).max(1).optional(),
      label: z.string().optional()
    })
    .optional()
});

export type TelemetryMessage = z.infer<typeof telemetryMessageSchema>;

export type DeviceStatus = "offline" | "online" | "warning" | "emergency";

export type AlertSeverity = "low" | "medium" | "high" | "critical";
