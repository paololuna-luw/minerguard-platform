import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import mqtt, { MqttClient } from "mqtt";
import { telemetryMessageSchema } from "@minerguard/shared";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private client?: MqttClient;

  constructor(
    private readonly config: ConfigService,
    private readonly realtime: RealtimeGateway
  ) {}

  onModuleInit() {
    const mqttUrl = this.config.get<string>("MQTT_URL", "mqtt://localhost:1883");
    this.client = mqtt.connect(mqttUrl, {
      username: this.config.get<string>("MQTT_USERNAME") || undefined,
      password: this.config.get<string>("MQTT_PASSWORD") || undefined
    });

    this.client.on("connect", () => {
      this.logger.log(`Connected to MQTT broker: ${mqttUrl}`);
      this.client?.subscribe("mines/+/devices/+/telemetry");
      this.client?.subscribe("mines/+/alerts/+");
    });

    this.client.on("message", (topic, message) => {
      this.handleMqttMessage(topic, message);
    });

    this.client.on("error", (error) => {
      this.logger.error(error.message);
    });
  }

  onModuleDestroy() {
    this.client?.end();
  }

  ingest(payload: unknown, source: "http" | "mqtt") {
    const parsed = telemetryMessageSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        accepted: false,
        source,
        errors: parsed.error.flatten()
      };
    }

    this.realtime.publishTelemetry(parsed.data);

    return {
      accepted: true,
      source,
      data: parsed.data
    };
  }

  private handleMqttMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      const result = this.ingest(payload, "mqtt");

      if (!result.accepted) {
        this.logger.warn(`Rejected MQTT message from ${topic}`);
      }
    } catch (error) {
      this.logger.warn(`Invalid MQTT JSON from ${topic}: ${(error as Error).message}`);
    }
  }
}
