import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("gateways")
@UseGuards(AuthGuard)
export class GatewaysController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list() {
    return this.operations.listGateways();
  }
}
