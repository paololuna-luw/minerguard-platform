import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AlertsController } from "./alerts.controller";
import { DashboardController } from "./dashboard.controller";
import { DevicesController } from "./devices.controller";
import { GatewaysController } from "./gateways.controller";
import { MinesController } from "./mines.controller";
import { MinersController } from "./miners.controller";
import { UsersController } from "./users.controller";
import { OperationsService } from "./operations.service";

@Module({
  imports: [AuthModule],
  controllers: [
    AlertsController,
    DashboardController,
    DevicesController,
    GatewaysController,
    MinesController,
    MinersController,
    UsersController
  ],
  providers: [OperationsService]
})
export class OperationsModule {}
