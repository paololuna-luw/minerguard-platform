-- CreateTable
CREATE TABLE "VitalSignEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "minerId" TEXT,
    "heartRate" INTEGER,
    "spo2" INTEGER,
    "bodyTemperature" DOUBLE PRECISION,
    "fallDetected" BOOLEAN NOT NULL DEFAULT false,
    "accelX" DOUBLE PRECISION,
    "accelY" DOUBLE PRECISION,
    "accelZ" DOUBLE PRECISION,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalSignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "mineId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION,
    "nearestNodeCode" TEXT,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'simulation',
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeSignalEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "nearestNodeCode" TEXT,
    "signalRssi" INTEGER,
    "snr" DOUBLE PRECISION,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeSignalEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VitalSignEvent" ADD CONSTRAINT "VitalSignEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationEvent" ADD CONSTRAINT "LocationEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationEvent" ADD CONSTRAINT "LocationEvent_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeSignalEvent" ADD CONSTRAINT "NodeSignalEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeSignalEvent" ADD CONSTRAINT "NodeSignalEvent_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;
