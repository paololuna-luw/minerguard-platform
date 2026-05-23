import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { TelemetryController } from "./telemetry.controller";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [RealtimeModule],
  controllers: [TelemetryController],
  providers: [TelemetryService]
})
export class TelemetryModule {}
