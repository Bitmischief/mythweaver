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
import { ImageCreditChangeType, User } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';
import { modifyImageCreditCount } from '../services/credits';

interface PatchUserRequest {
  campaignId: number;
  name: string;
  username: string;
  imageUri?: string;
  data: any;
  tags?: string[];
  confirmEarlyAccessStart?: boolean;
}

interface AddUserCreditsRequest {
  email: string;
  amount: number;
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
    @Inject() logger: MythWeaverLogger,
  ): Promise<User> {
    logger.info('Getting user', { userId, trackingInfo });

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

    // await setIntercomCustomAttributes(user.id, {
    //   'Trial End Date': user.trialEndsAt,
    // });

    return user;
  }

  @Security('jwt')
  @OperationId('updateUser')
  @Patch('/me')
  public async patchUser(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PatchUserRequest,
  ): Promise<User> {
    track(AppEvent.UpdateUser, userId, trackingInfo);

    const payload = {
      ...request,
      confirmEarlyAccessStart: undefined,
    };

    if (request.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: request.username,
        },
      });

      if (usernameExists) {
        throw new AppError({
          description: 'Username already exists.',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }
    }

    return prisma.user.update({
      where: {
        id: userId,
      },
      data: payload,
    });
  }

  public async addUserCredits(
    trackingInfo: TrackingInfo,
    logger: MythWeaverLogger,
    request: AddUserCreditsRequest,
  ) {
    logger.info('Getting request to add user credits', {
      trackingInfo,
    });

    const user = await prisma.user.findUnique({
      where: {
        email: request.email,
      },
    });

    if (!user) {
      logger.warn('User not found', { trackingInfo });

      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    logger.info(`Adding ${request.amount} credits to user`, {
      trackingInfo,
    });

    await modifyImageCreditCount(
      user.id,
      request.amount,
      ImageCreditChangeType.SUPPORT,
      `Requested by support`,
    );
  }
}
