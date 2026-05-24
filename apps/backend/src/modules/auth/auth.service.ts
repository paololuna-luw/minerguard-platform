import { createHash, randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { verifyPassword } from "./password";

const sessionDurationMs = 1000 * 60 * 60 * 12;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return {
      token,
      expiresAt,
      user: this.toPublicUser(user)
    };
  }

  async getSessionUser(token: string) {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid session");
    }

    return {
      user: this.toPublicUser(session.user)
    };
  }

  async authenticateToken(token: string) {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid session");
    }

    return this.toPublicUser(session.user);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  toPublicUser(user: {
    id: string;
    username: string;
    email: string | null;
    fullName: string | null;
    status: string;
    mustChangePassword: boolean;
    roles: Array<{ role: { name: string; description: string | null } }>;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      roles: user.roles.map(({ role }) => ({
        name: role.name,
        description: role.description
      }))
    };
  }
}
