import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OperationsService } from "./operations.service";

@Controller("mines")
@UseGuards(AuthGuard)
export class MinesController {
  constructor(private readonly operations: OperationsService) {}

  @Get()
  list() {
    return this.operations.listMines();
  }
}
