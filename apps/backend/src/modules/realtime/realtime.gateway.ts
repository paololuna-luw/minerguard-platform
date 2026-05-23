import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "realtime",
  cors: {
    origin: "*"
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket) {
    client.emit("connected", {
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect() {
    return undefined;
  }

  publishTelemetry(payload: unknown) {
    this.server.emit("telemetry.received", payload);
  }

  publishAlert(payload: unknown) {
    this.server.emit("alert.received", payload);
  }
}
