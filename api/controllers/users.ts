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
import { AppEvent, identify, track, TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';
import { modifyImageCreditCount } from '../services/credits';
import {
  createCustomer,
  getSubscriptionForCustomer,
} from '../services/billing';

interface PatchUserRequest {
  campaignId?: number;
  name?: string;
  username?: string;
  imageUri?: string;
  data?: any;
  tags?: string[];
  confirmEarlyAccessStart?: boolean;
  initialTrackingData?: any;
  onboarded?: boolean;
}

interface AddUserCreditsRequest {
  email: string;
  amount: number;
}

interface GetUserResponse {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  email: string;

  trialEndsAt?: Date;
  billingCustomerId?: string;
  subscriptionPaidThrough?: Date;
  plan: string;
  planInterval: string;
  username: string;
  imageCredits: number;
  lifetimeAccess: boolean;
  preorderRedemptionCoupon: string;
  preorderRedemptionStripePriceId: string;

  conjurationCount: number;
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
  ): Promise<GetUserResponse> {
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

    const conjurationCount = await prisma.conjuration.count({
      where: {
        OR: [
          {
            userId: user.id,
          },
          {
            saves: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
    });

    return {
      ...user,
      conjurationCount: conjurationCount,
    } as GetUserResponse;
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

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (payload.initialTrackingData) {
      if (existingUser.initialTrackingData) {
        logger.info(
          'User already has initial tracking data, dropping new initialTrackingData',
        );
        return existingUser;
      }

      identify(userId, {
        email: existingUser.email,
        ...payload.initialTrackingData,
      });
    }

    return prisma.user.update({
      where: {
        id: userId,
      },
      data: payload,
    });
  }

  @Security('jwt')
  @OperationId('getSubscription')
  @Get('/me/subscription')
  public async getSubscription(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
  ) {
    logger.info('Getting subscription', { userId, trackingInfo });

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

    const subscription = await getSubscriptionForCustomer(
      user.billingCustomerId,
    );

    if (!subscription) {
      throw new AppError({
        description: 'Subscription not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (subscription.discount) {
      logger.info('Subscription has discount', {
        discount: subscription.discount,
      });
    }

    const isPreOrder = subscription.discount?.coupon?.name === user.email;

    return {
      isPreOrder,
      preOrderValidUntil:
        isPreOrder && subscription.discount
          ? new Date(subscription.discount?.end * 1000)
          : undefined,
      isLifetimePreOrder: subscription.discount && !subscription.discount.end,
      subscriptionRenewalDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    };
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
