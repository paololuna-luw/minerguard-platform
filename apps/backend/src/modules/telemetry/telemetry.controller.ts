import { Body, Controller, Post } from "@nestjs/common";
import { TelemetryService } from "./telemetry.service";

@Controller("telemetry")
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  ingest(@Body() payload: unknown) {
    return this.telemetryService.ingest(payload, "http");
  }
}
