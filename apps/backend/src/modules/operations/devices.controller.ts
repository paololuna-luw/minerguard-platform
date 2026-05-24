import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("devices")
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list() {
    return this.operations.listDevices();
  }
}
