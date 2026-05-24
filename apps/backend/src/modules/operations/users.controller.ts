import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { createPasswordHash } from "../auth/password";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

type CreateUserBody = {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
};

type UpdateRolesBody = {
  roles?: string[];
};

@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: { username: "asc" }
    });
  }

  @Get("roles")
  roles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" }
    });
  }

  @Post()
  async create(@Body() body: CreateUserBody) {
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return {
        accepted: false,
        message: "username and password are required"
      };
    }

    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash: createPasswordHash(password),
        fullName: body.fullName?.trim() || null,
        email: body.email?.trim() || null,
        mustChangePassword: true,
        roles: {
          create: await this.toRoleAssignments(body.roles?.length ? body.roles : ["viewer"])
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        mustChangePassword: true
      }
    });

    return {
      accepted: true,
      user
    };
  }

  @Patch(":id/roles")
  async updateRoles(@Param("id") id: string, @Body() body: UpdateRolesBody) {
    const roleNames = body.roles?.length ? body.roles : ["viewer"];
    const assignments = await this.toRoleAssignments(roleNames);

    await this.prisma.userRole.deleteMany({
      where: { userId: id }
    });

    await this.prisma.userRole.createMany({
      data: assignments.map((assignment) => ({
        userId: id,
        roleId: assignment.role.connect.id
      }))
    });

    return {
      accepted: true
    };
  }

  private async toRoleAssignments(roleNames: string[]) {
    const roles = await this.prisma.role.findMany({
      where: {
        name: {
          in: roleNames
        }
      }
    });

    return roles.map((role) => ({
      role: {
        connect: {
          id: role.id
        }
      }
    }));
  }
}
