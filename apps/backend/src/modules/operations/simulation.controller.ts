import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { SimulationService, SimulationStatePayload } from "./simulation.service";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly simulation: SimulationService) {}

  @Get("state")
  @UseGuards(AuthGuard)
  getState() {
    return this.simulation.getCurrentState();
  }

  @Post("state")
  ingestState(@Body() payload: SimulationStatePayload) {
    return this.simulation.ingestState(payload);
  }
}
