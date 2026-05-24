import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("miners")
@UseGuards(AuthGuard)
export class MinersController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list() {
    return this.operations.listMiners();
  }
}
