import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { TelemetryModule } from "./telemetry/telemetry.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    HealthModule,
    RealtimeModule,
    TelemetryModule
  ]
})
export class AppModule {}
