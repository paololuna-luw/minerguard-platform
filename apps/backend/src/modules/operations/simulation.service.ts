import { Injectable, NotFoundException } from "@nestjs/common";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { PrismaService } from "../prisma/prisma.service";

export type SimulationStatePayload = {
  mineId?: string;
  mineName?: string;
  minerDocument?: string;
  minerId?: string;
  deviceCode: string;
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  nearestNodeCode?: string;
  confidence?: number;
  vitals?: {
    heartRate?: number;
    spo2?: number;
    bodyTemperature?: number;
  };
  motion?: {
    fallDetected?: boolean;
    accelX?: number;
    accelY?: number;
    accelZ?: number;
  };
  battery?: number;
  signalRssi?: number;
  snr?: number;
};

@Injectable()
export class SimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  async ingestState(payload: SimulationStatePayload) {
    const device = await this.prisma.device.findUnique({
      where: { code: payload.deviceCode },
      include: { mine: true, miner: true }
    });

    if (!device) {
      throw new NotFoundException(`Device ${payload.deviceCode} not found`);
    }

    const gateway = payload.nearestNodeCode
      ? await this.prisma.gateway.findUnique({ where: { code: payload.nearestNodeCode } })
      : null;

    const mineId = payload.mineId ?? device.mineId;
    const rawPayload = JSON.parse(JSON.stringify(payload));

    const [telemetry, vitalSigns, location, nodeSignal] = await this.prisma.$transaction([
      this.prisma.telemetryEvent.create({
        data: {
          mineId,
          deviceId: device.id,
          battery: payload.battery,
          signalRssi: payload.signalRssi,
          rawPayload
        }
      }),
      this.prisma.vitalSignEvent.create({
        data: {
          deviceId: device.id,
          minerId: payload.minerId ?? device.minerId,
          heartRate: payload.vitals?.heartRate,
          spo2: payload.vitals?.spo2,
          bodyTemperature: payload.vitals?.bodyTemperature,
          fallDetected: payload.motion?.fallDetected ?? false,
          accelX: payload.motion?.accelX,
          accelY: payload.motion?.accelY,
          accelZ: payload.motion?.accelZ,
          rawPayload
        }
      }),
      this.prisma.locationEvent.create({
        data: {
          mineId,
          deviceId: device.id,
          gatewayId: gateway?.id,
          x: payload.position?.x ?? 0,
          y: payload.position?.y ?? 0,
          z: payload.position?.z,
          nearestNodeCode: payload.nearestNodeCode,
          confidence: payload.confidence,
          source: "unity",
          rawPayload
        }
      }),
      this.prisma.nodeSignalEvent.create({
        data: {
          deviceId: device.id,
          gatewayId: gateway?.id,
          nearestNodeCode: payload.nearestNodeCode,
          signalRssi: payload.signalRssi,
          snr: payload.snr,
          rawPayload
        }
      })
    ]);

    await this.applyAutomaticAlerts(device.id, mineId, payload);

    const state = {
      accepted: true,
      deviceCode: device.code,
      miner: device.miner,
      telemetry,
      vitalSigns,
      location,
      nodeSignal
    };

    this.realtime.publishSimulationState(state);
    return state;
  }

  async getCurrentState() {
    const devices = await this.prisma.device.findMany({
      include: {
        mine: true,
        miner: true,
        telemetry: { orderBy: { receivedAt: "desc" }, take: 1 },
        vitalSigns: { orderBy: { receivedAt: "desc" }, take: 1 },
        locations: { orderBy: { receivedAt: "desc" }, take: 1 },
        nodeSignals: { orderBy: { receivedAt: "desc" }, take: 1 }
      },
      orderBy: { code: "asc" }
    });

    return { devices };
  }

  private async applyAutomaticAlerts(
    deviceId: string,
    mineId: string,
    payload: SimulationStatePayload
  ) {
    const alerts = [];

    if (payload.vitals?.spo2 !== undefined && payload.vitals.spo2 < 92) {
      alerts.push({
        mineId,
        deviceId,
        type: "spo2_low",
        severity: "critical",
        message: `SpO2 baja (${payload.vitals.spo2}%) en ${payload.deviceCode}`,
        status: "open"
      });
    }

    if (payload.vitals?.heartRate !== undefined && payload.vitals.heartRate > 130) {
      alerts.push({
        mineId,
        deviceId,
        type: "heart_rate_high",
        severity: "high",
        message: `Frecuencia cardiaca alta (${payload.vitals.heartRate} bpm) en ${payload.deviceCode}`,
        status: "open"
      });
    }

    if (payload.motion?.fallDetected) {
      alerts.push({
        mineId,
        deviceId,
        type: "fall_detected",
        severity: "critical",
        message: `Caida detectada en ${payload.deviceCode}`,
        status: "open"
      });
    }

    if (payload.battery !== undefined && payload.battery < 20) {
      alerts.push({
        mineId,
        deviceId,
        type: "battery_low",
        severity: "medium",
        message: `Bateria baja (${payload.battery}%) en ${payload.deviceCode}`,
        status: "open"
      });
    }

    if (alerts.length > 0) {
      await this.prisma.alert.createMany({ data: alerts });
      this.realtime.publishAlert({ alerts });
    }
  }
}
