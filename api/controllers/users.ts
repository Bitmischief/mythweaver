import {
  Body,
  Get,
  Inject,
  OperationId,
  Patch,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { User } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';

interface PatchUserRequest {
  campaignId: number;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
  confirmEarlyAccessStart?: boolean;
}

@Route('users')
@Tags('Users')
export default class UserController {
  @Security('jwt')
  @OperationId('getLoggedInUser')
  @Get('/me')
  public async getUser(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
  ): Promise<User> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetLoggedInUser, userId, trackingInfo);

    return user;
  }

  @Security('jwt')
  @OperationId('updateUser')
  @Patch('/me')
  public async patchUser(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PatchUserRequest,
  ): Promise<User> {
    track(AppEvent.UpdateUser, userId, trackingInfo);

    if (request.confirmEarlyAccessStart) {
      const earlyAccessEnd = new Date();
      earlyAccessEnd.setHours(new Date().getHours() + 24);

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          earlyAccessCutoffAt: earlyAccessEnd,
        },
      });
    }

    const payload = {
      ...request,
      confirmEarlyAccessStart: undefined,
    };

    return prisma.user.update({
      where: {
        id: userId,
      },
      data: payload,
    });
  }
}
