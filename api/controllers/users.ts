import {
  Body,
  Get,
  Inject,
  OperationId,
  Patch,
  Route,
  Security,
  Tags,
} from "tsoa";
import { prisma } from "../lib/providers/prisma";
import { User } from "@prisma/client";
import { AppError, HttpCode } from "../lib/errors/AppError";

interface PatchUserRequest {
  campaignId: number;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
}

@Route("users")
@Tags("Users")
export default class UserController {
  @Security("jwt")
  @OperationId("getUser")
  @Get("/me")
  public async getUser(@Inject() userId: number): Promise<User> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: "User not found.",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return user;
  }

  @Security("jwt")
  @OperationId("updateUser")
  @Patch("/me")
  public async patchUser(
    @Inject() userId: number,
    @Body() request: PatchUserRequest
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...request,
      },
    });
  }
}
