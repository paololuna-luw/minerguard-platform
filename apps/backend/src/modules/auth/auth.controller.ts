import { Body, Controller, Get, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

type LoginBody = {
  username?: string;
  password?: string;
};

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginBody) {
    return this.authService.login(body.username ?? "", body.password ?? "");
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    return this.authService.getSessionUser(token);
  }

  @Post("change-password")
  changePassword(@Headers("authorization") authorization: string | undefined, @Body() body: ChangePasswordBody) {
    const token = authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    return this.authService.changePassword(token, body.currentPassword ?? "", body.newPassword ?? "");
  }
}
