import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("dashboard")
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  getDashboard() {
    return this.operations.getDashboard();
  }
}
