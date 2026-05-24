import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("alerts")
@UseGuards(AuthGuard)
export class AlertsController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list() {
    return this.operations.listAlerts();
  }
}
