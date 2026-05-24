import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [miners, devices, gateways, alerts, mines] = await Promise.all([
      this.prisma.miner.findMany({
        include: {
          mine: true,
          devices: {
            include: {
              telemetry: {
                orderBy: { receivedAt: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: { fullName: "asc" }
      }),
      this.prisma.device.findMany({
        include: {
          mine: true,
          miner: true,
          telemetry: {
            orderBy: { receivedAt: "desc" },
            take: 1
          }
        },
        orderBy: { code: "asc" }
      }),
      this.prisma.gateway.findMany({
        include: { mine: true },
        orderBy: { code: "asc" }
      }),
      this.prisma.alert.findMany({
        include: {
          device: {
            include: { miner: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.mine.findMany({
        include: {
          zones: true,
          gateways: true
        },
        orderBy: { name: "asc" }
      })
    ]);

    return {
      summary: {
        minersActive: miners.filter((miner) => miner.status === "active").length,
        devicesLinked: devices.filter((device) => Boolean(device.minerId)).length,
        gatewaysOnline: gateways.filter((gateway) => gateway.status === "online").length,
        alertsOpen: alerts.filter((alert) => alert.status === "open").length
      },
      miners,
      devices,
      gateways,
      alerts,
      mines
    };
  }

  listMiners() {
    return this.prisma.miner.findMany({
      include: { mine: true, devices: true },
      orderBy: { fullName: "asc" }
    });
  }

  listDevices() {
    return this.prisma.device.findMany({
      include: {
        mine: true,
        miner: true,
        telemetry: { orderBy: { receivedAt: "desc" }, take: 1 }
      },
      orderBy: { code: "asc" }
    });
  }

  listGateways() {
    return this.prisma.gateway.findMany({
      include: { mine: true },
      orderBy: { code: "asc" }
    });
  }

  listAlerts() {
    return this.prisma.alert.findMany({
      include: {
        device: {
          include: {
            miner: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listMines() {
    return this.prisma.mine.findMany({
      include: {
        zones: true,
        gateways: true,
        miners: true,
        devices: true
      },
      orderBy: { name: "asc" }
    });
  }
}
