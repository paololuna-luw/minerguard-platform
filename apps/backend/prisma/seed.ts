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
    { fullName: "Andres Salcedo", document: "MIN-1004", status: "inactive" }
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
