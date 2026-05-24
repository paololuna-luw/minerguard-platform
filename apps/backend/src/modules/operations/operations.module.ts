import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { AlertsController } from "./alerts.controller";
import { DashboardController } from "./dashboard.controller";
import { DevicesController } from "./devices.controller";
import { GatewaysController } from "./gateways.controller";
import { MinesController } from "./mines.controller";
import { MinersController } from "./miners.controller";
import { SimulationController } from "./simulation.controller";
import { UsersController } from "./users.controller";
import { OperationsService } from "./operations.service";
import { SimulationService } from "./simulation.service";

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [
    AlertsController,
    DashboardController,
    DevicesController,
    GatewaysController,
    MinesController,
    MinersController,
    SimulationController,
    UsersController
  ],
  providers: [OperationsService, SimulationService]
})
export class OperationsModule {}
