import { PrismaClient } from "@prisma/client";
import { createPasswordHash } from "../src/modules/auth/password";

const prisma = new PrismaClient();

const roles = [
  {
    name: "admin",
    description: "Acceso total a configuracion, usuarios, roles, dispositivos y monitoreo."
  },
  {
    name: "editor",
    description: "Gestion operativa de minas, mineros, dispositivos, gateways y alertas."
  },
  {
    name: "viewer",
    description: "Acceso de solo lectura al dashboard, telemetria, ubicaciones y alertas."
  },
  {
    name: "operator",
    description: "Atiende alertas, revisa estado en tiempo real y registra seguimiento operativo."
  }
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "admin" }
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      fullName: "Administrador MinerGuard",
      passwordHash: createPasswordHash("admin"),
      mustChangePassword: true,
      status: "active"
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id
    }
  });

  const mine =
    (await prisma.mine.findFirst({ where: { name: "Mina Esperanza Norte" } })) ??
    (await prisma.mine.create({
      data: {
        name: "Mina Esperanza Norte",
        location: "Distrito minero piloto"
      }
    }));

  const zoneNames = [
    { name: "Entrada principal", level: "Superficie" },
    { name: "Galeria Norte", level: "Nivel 1" },
    { name: "Camara de extraccion A", level: "Nivel 2" },
    { name: "Refugio interno", level: "Nivel 2" }
  ];

  const zones = [];
  for (const zone of zoneNames) {
    zones.push(
      (await prisma.zone.findFirst({ where: { mineId: mine.id, name: zone.name } })) ??
        (await prisma.zone.create({
          data: {
            mineId: mine.id,
            name: zone.name,
            level: zone.level
          }
        }))
    );
  }

  const minersData = [
    { fullName: "Carlos Rojas", document: "MIN-1001", status: "active" },
    { fullName: "Marta Quintero", document: "MIN-1002", status: "active" },
    { fullName: "Luis Paredes", document: "MIN-1003", status: "warning" },
    { fullName: "Andres Salcedo", document: "MIN-1004", status: "inactive" },
    { fullName: "Diana Morales", document: "MIN-1005", status: "active" }
  ];

  const miners = [];
  for (const miner of minersData) {
    miners.push(
      (await prisma.miner.findFirst({ where: { document: miner.document } })) ??
        (await prisma.miner.create({
          data: {
            mineId: mine.id,
            fullName: miner.fullName,
            document: miner.document,
            status: miner.status
          }
        }))
    );
  }

  await prisma.gateway.upsert({
    where: { code: "GW-ENTRADA-001" },
    update: { status: "online" },
    create: {
      mineId: mine.id,
      code: "GW-ENTRADA-001",
      name: "Gateway Entrada Principal",
      status: "online"
    }
  });

  await prisma.gateway.upsert({
    where: { code: "GW-NORTE-002" },
    update: { status: "online" },
    create: {
      mineId: mine.id,
      code: "GW-NORTE-002",
      name: "Nodo Galeria Norte",
      status: "online"
    }
  });

  await prisma.gateway.upsert({
    where: { code: "GW-REFUGIO-003" },
    update: { status: "warning" },
    create: {
      mineId: mine.id,
      code: "GW-REFUGIO-003",
      name: "Nodo Refugio Interno",
      status: "warning"
    }
  });

  const devicesData = [
    {
      code: "HELMET-001",
      type: "helmet_lora",
      status: "online",
      minerId: miners[0].id,
      zoneId: zones[1].id,
      battery: 82,
      signalRssi: -71,
      temperature: 28.4,
      gasLevel: 0.02
    },
    {
      code: "WRIST-002",
      type: "vital_watch_ble_lora_bridge",
      status: "online",
      minerId: miners[1].id,
      zoneId: zones[2].id,
      battery: 67,
      signalRssi: -78,
      temperature: 36.6,
      gasLevel: 0.01
    },
    {
      code: "HELMET-003",
      type: "helmet_lora",
      status: "warning",
      minerId: miners[2].id,
      zoneId: zones[3].id,
      battery: 18,
      signalRssi: -92,
      temperature: 30.1,
      gasLevel: 0.04
    },
    {
      code: "TAG-004",
      type: "location_tag",
      status: "offline",
      minerId: miners[3].id,
      zoneId: zones[0].id,
      battery: 0,
      signalRssi: -115,
      temperature: null,
      gasLevel: null
    },
    {
      code: "VITAL-005",
      type: "vital_watch_lora_bridge",
      status: "online",
      minerId: miners[4].id,
      zoneId: zones[1].id,
      battery: 91,
      signalRssi: -64,
      temperature: 36.8,
      gasLevel: 0.01
    }
  ];

  for (const deviceData of devicesData) {
    const device = await prisma.device.upsert({
      where: { code: deviceData.code },
      update: {
        status: deviceData.status,
        minerId: deviceData.minerId
      },
      create: {
        mineId: mine.id,
        minerId: deviceData.minerId,
        code: deviceData.code,
        type: deviceData.type,
        status: deviceData.status
      }
    });

    const telemetryExists = await prisma.telemetryEvent.findFirst({
      where: { deviceId: device.id }
    });

    if (!telemetryExists) {
      await prisma.telemetryEvent.create({
        data: {
          mineId: mine.id,
          deviceId: device.id,
          zoneId: deviceData.zoneId,
          battery: deviceData.battery,
          signalRssi: deviceData.signalRssi,
          temperature: deviceData.temperature,
          gasLevel: deviceData.gasLevel,
          rawPayload: {
            source: "seed",
            deviceCode: deviceData.code,
            locationMethod: "lora_node"
          }
        }
      });
    }

    const vitalExists = await prisma.vitalSignEvent.findFirst({ where: { deviceId: device.id } });
    if (!vitalExists) {
      await prisma.vitalSignEvent.create({
        data: {
          deviceId: device.id,
          minerId: deviceData.minerId,
          heartRate: deviceData.code === "HELMET-003" ? 118 : 78,
          spo2: deviceData.code === "HELMET-003" ? 93 : 97,
          bodyTemperature: deviceData.temperature ?? 36.6,
          fallDetected: false,
          accelX: 0.02,
          accelY: 0.01,
          accelZ: 0.98,
          rawPayload: { source: "seed", deviceCode: deviceData.code }
        }
      });
    }

    const gateway = await prisma.gateway.findFirst({ where: { mineId: mine.id, status: "online" } });
    const locationExists = await prisma.locationEvent.findFirst({ where: { deviceId: device.id } });
    if (!locationExists) {
      await prisma.locationEvent.create({
        data: {
          mineId: mine.id,
          deviceId: device.id,
          gatewayId: gateway?.id,
          x: 15 + devicesData.indexOf(deviceData) * 18,
          y: 22 + (devicesData.indexOf(deviceData) % 3) * 23,
          nearestNodeCode: gateway?.code,
          confidence: 0.72,
          source: "seed",
          rawPayload: { source: "seed", deviceCode: deviceData.code }
        }
      });
    }

    const nodeSignalExists = await prisma.nodeSignalEvent.findFirst({ where: { deviceId: device.id } });
    if (!nodeSignalExists) {
      await prisma.nodeSignalEvent.create({
        data: {
          deviceId: device.id,
          gatewayId: gateway?.id,
          nearestNodeCode: gateway?.code,
          signalRssi: deviceData.signalRssi,
          snr: 7.5,
          rawPayload: { source: "seed", deviceCode: deviceData.code }
        }
      });
    }
  }

  const warningDevice = await prisma.device.findUniqueOrThrow({ where: { code: "HELMET-003" } });
  const offlineDevice = await prisma.device.findUniqueOrThrow({ where: { code: "TAG-004" } });

  const existingAlerts = await prisma.alert.count({ where: { mineId: mine.id } });
  if (existingAlerts === 0) {
    await prisma.alert.createMany({
      data: [
        {
          mineId: mine.id,
          deviceId: warningDevice.id,
          type: "battery_low",
          severity: "high",
          message: "Bateria baja en casco HELMET-003",
          status: "open"
        },
        {
          mineId: mine.id,
          deviceId: offlineDevice.id,
          type: "signal_lost",
          severity: "medium",
          message: "Dispositivo TAG-004 sin reporte reciente",
          status: "open"
        },
        {
          mineId: mine.id,
          type: "gas_review",
          severity: "low",
          message: "Revision preventiva de sensores de gas en Galeria Norte",
          status: "resolved",
          resolvedAt: new Date()
        }
      ]
    });
  }

  const southMine =
    (await prisma.mine.findFirst({ where: { name: "Mina San Rafael Sur" } })) ??
    (await prisma.mine.create({
      data: {
        name: "Mina San Rafael Sur",
        location: "Sector cordillera sur"
      }
    }));

  const southZones = [];
  for (const zone of [
    { name: "Bocamina Sur", level: "Superficie" },
    { name: "Rampa Central", level: "Nivel 1" },
    { name: "Galeria Este", level: "Nivel 2" },
    { name: "Camara de ventilacion", level: "Nivel 2" },
    { name: "Frente de avance B", level: "Nivel 3" }
  ]) {
    southZones.push(
      (await prisma.zone.findFirst({ where: { mineId: southMine.id, name: zone.name } })) ??
        (await prisma.zone.create({
          data: {
            mineId: southMine.id,
            name: zone.name,
            level: zone.level
          }
        }))
    );
  }

  const extraMinersData = [
    { fullName: "Jorge Cardenas", document: "MIN-2001", status: "active" },
    { fullName: "Paula Herrera", document: "MIN-2002", status: "active" },
    { fullName: "Nicolas Tovar", document: "MIN-2003", status: "warning" },
    { fullName: "Sandra Diaz", document: "MIN-2004", status: "active" },
    { fullName: "Miguel Arango", document: "MIN-2005", status: "inactive" },
    { fullName: "Elena Vargas", document: "MIN-2006", status: "active" },
    { fullName: "Raul Benitez", document: "MIN-2007", status: "emergency" }
  ];

  const extraMiners = [];
  for (const miner of extraMinersData) {
    extraMiners.push(
      (await prisma.miner.findFirst({ where: { document: miner.document } })) ??
        (await prisma.miner.create({
          data: {
            mineId: southMine.id,
            fullName: miner.fullName,
            document: miner.document,
            status: miner.status
          }
        }))
    );
  }

  for (const gateway of [
    { code: "GW-SUR-001", name: "Gateway Bocamina Sur", status: "online" },
    { code: "GW-RAMPA-002", name: "Nodo Rampa Central", status: "online" },
    { code: "GW-ESTE-003", name: "Nodo Galeria Este", status: "online" },
    { code: "GW-VENT-004", name: "Nodo Ventilacion", status: "warning" },
    { code: "GW-AVANCE-005", name: "Nodo Frente de Avance", status: "offline" }
  ]) {
    await prisma.gateway.upsert({
      where: { code: gateway.code },
      update: {
        name: gateway.name,
        status: gateway.status
      },
      create: {
        mineId: southMine.id,
        code: gateway.code,
        name: gateway.name,
        status: gateway.status
      }
    });
  }

  const extraDevicesData = [
    ["HELMET-201", "helmet_lora", "online", 0, 1, 88, -62, 28.2, 0.01],
    ["WRIST-202", "vital_watch_lora_bridge", "online", 1, 2, 76, -70, 36.7, 0.01],
    ["HELMET-203", "helmet_lora", "warning", 2, 3, 24, -86, 29.9, 0.03],
    ["TAG-204", "location_tag", "online", 3, 4, 64, -77, null, null],
    ["GAS-205", "gas_sensor_lora", "online", 4, 3, 58, -73, 30.5, 0.06],
    ["VITAL-206", "vital_watch_lora_bridge", "online", 5, 2, 93, -61, 36.5, 0.01],
    ["SOS-207", "panic_button_lora", "emergency", 6, 4, 51, -89, null, null]
  ] as const;

  for (const [
    code,
    type,
    status,
    minerIndex,
    zoneIndex,
    battery,
    signalRssi,
    temperature,
    gasLevel
  ] of extraDevicesData) {
    const device = await prisma.device.upsert({
      where: { code },
      update: {
        status,
        minerId: extraMiners[minerIndex].id
      },
      create: {
        mineId: southMine.id,
        minerId: extraMiners[minerIndex].id,
        code,
        type,
        status
      }
    });

    const telemetryCount = await prisma.telemetryEvent.count({ where: { deviceId: device.id } });
    if (telemetryCount < 3) {
      for (let index = telemetryCount; index < 3; index += 1) {
        await prisma.telemetryEvent.create({
          data: {
            mineId: southMine.id,
            deviceId: device.id,
            zoneId: southZones[zoneIndex].id,
            battery: Math.max(0, Number(battery) - index * 3),
            signalRssi: Number(signalRssi) - index * 2,
            temperature: temperature === null ? null : Number(temperature) + index * 0.2,
            gasLevel: gasLevel === null ? null : Number(gasLevel) + index * 0.005,
            rawPayload: {
              source: "seed",
              sample: index + 1,
              deviceCode: code,
              locationMethod: "lora_node"
            }
          }
        });
      }
    }

    const gateway =
      zoneIndex >= 4
        ? await prisma.gateway.findFirst({
            where: { mineId: southMine.id, code: "GW-AVANCE-005" }
          })
        : null;
    const fallbackGateway = gateway ?? (await prisma.gateway.findFirst({ where: { mineId: southMine.id } }));

    const vitalCount = await prisma.vitalSignEvent.count({ where: { deviceId: device.id } });
    if (vitalCount === 0) {
      await prisma.vitalSignEvent.create({
        data: {
          deviceId: device.id,
          minerId: extraMiners[minerIndex].id,
          heartRate: status === "emergency" ? 142 : status === "warning" ? 112 : 76 + minerIndex * 3,
          spo2: status === "emergency" ? 88 : status === "warning" ? 94 : 97,
          bodyTemperature: temperature === null ? 36.5 : Number(temperature),
          fallDetected: status === "emergency",
          accelX: status === "emergency" ? 1.8 : 0.03,
          accelY: status === "emergency" ? 0.9 : 0.02,
          accelZ: status === "emergency" ? 0.1 : 0.98,
          rawPayload: { source: "seed", deviceCode: code }
        }
      });
    }

    const locationCount = await prisma.locationEvent.count({ where: { deviceId: device.id } });
    if (locationCount === 0) {
      await prisma.locationEvent.create({
        data: {
          mineId: southMine.id,
          deviceId: device.id,
          gatewayId: fallbackGateway?.id,
          x: 12 + minerIndex * 11,
          y: 18 + (zoneIndex % 5) * 15,
          nearestNodeCode: fallbackGateway?.code,
          confidence: 0.78,
          source: "seed",
          rawPayload: { source: "seed", deviceCode: code }
        }
      });
    }

    const nodeSignalCount = await prisma.nodeSignalEvent.count({ where: { deviceId: device.id } });
    if (nodeSignalCount === 0) {
      await prisma.nodeSignalEvent.create({
        data: {
          deviceId: device.id,
          gatewayId: fallbackGateway?.id,
          nearestNodeCode: fallbackGateway?.code,
          signalRssi: Number(signalRssi),
          snr: status === "emergency" ? 3.1 : 8.4,
          rawPayload: { source: "seed", deviceCode: code }
        }
      });
    }
  }

  const southAlertCount = await prisma.alert.count({ where: { mineId: southMine.id } });
  if (southAlertCount === 0) {
    const lowBatteryDevice = await prisma.device.findUniqueOrThrow({ where: { code: "HELMET-203" } });
    const gasDevice = await prisma.device.findUniqueOrThrow({ where: { code: "GAS-205" } });
    const sosDevice = await prisma.device.findUniqueOrThrow({ where: { code: "SOS-207" } });

    await prisma.alert.createMany({
      data: [
        {
          mineId: southMine.id,
          deviceId: lowBatteryDevice.id,
          type: "battery_low",
          severity: "medium",
          message: "Casco HELMET-203 requiere cambio de bateria",
          status: "open"
        },
        {
          mineId: southMine.id,
          deviceId: gasDevice.id,
          type: "gas_level",
          severity: "high",
          message: "Sensor GAS-205 reporta aumento de gases",
          status: "open"
        },
        {
          mineId: southMine.id,
          deviceId: sosDevice.id,
          type: "sos",
          severity: "critical",
          message: "Boton SOS-207 activado en Frente de avance B",
          status: "open"
        },
        {
          mineId: southMine.id,
          type: "node_review",
          severity: "low",
          message: "Nodo GW-AVANCE-005 requiere revision de enlace",
          status: "resolved",
          resolvedAt: new Date()
        }
      ]
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
