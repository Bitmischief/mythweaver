import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { MythWeaverLogger } from '@/modules/core/logging/logger';
import {
  TrackingInfo,
  track,
  AppEvent,
  identify,
} from '@/modules/core/analytics/tracking';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import {
  GetUserResponse,
  PatchUserRequest,
  AddUserCreditsRequest,
  GetSubscriptionResponse,
} from './users.interface';
import { ImageCreditChangeType, User } from '@prisma/client';
import { StripeProvider } from '@/providers/stripe';
import { CreditsProvider } from '@/providers/creditsProvider';
import { CampaignsService } from '@/modules/campaigns/campaigns.service';
import { EmailProvider } from '@/providers/emailProvider';
import { prisma } from '@/providers/prisma';
import { reportAdConversionEvent, AdConversionEvent } from '@/modules/core/ads';

export class UsersService {
  constructor(
    private usersDataProvider: UsersDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
    private logger: MythWeaverLogger,
    private creditsProvider: CreditsProvider,
    private campaignService: CampaignsService,
    private stripeProvider: StripeProvider,
    private emailProvider: EmailProvider,
  ) {}

  public async createNewUser(email: string) {
    const trialEnd = new Date();
    trialEnd.setHours(new Date().getHours() + 24 * 7);

    const stripeCustomerId = await this.stripeProvider.createCustomer(email);
    const username = await this.buildUniqueUsername(email.toLowerCase());

    const user = await this.usersDataProvider.createUser({
      email: email,
      trialEndsAt: trialEnd,
      billingCustomerId: stripeCustomerId,
      imageCredits: 0,
      username,
    });

    await this.creditsProvider.modifyImageCreditCount(
      user.id,
      25,
      ImageCreditChangeType.TRIAL,
      'Initial credits for signup',
    );

    await this.campaignService.createCampaign(user.id, {
      name: 'My Campaign',
    });

    await this.emailProvider.addEmailToMailingList(email);

    track(AppEvent.Registered, user.id, undefined, {
      email,
    });

    await reportAdConversionEvent(AdConversionEvent.Lead, user);

    return user;
  }

  buildUniqueUsername = async (email: string) => {
    const username = email.split('@')[0];
    const usernameExists = await prisma.user.findFirst({
      where: {
        username,
      },
    });

    return usernameExists
      ? username + Math.floor(Math.random() * 1000)
      : username;
  };

  public async getUser(
    userId: number,
    trackingInfo: TrackingInfo,
  ): Promise<GetUserResponse> {
    this.logger.info('Getting user', { userId, trackingInfo });

    const user = await this.usersDataProvider.getUserById(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetLoggedInUser, userId, trackingInfo);

    const conjurationCount =
      await this.conjurationsDataProvider.getUserConjurationCount(userId);

    return {
      ...user,
      conjurationCount: conjurationCount,
    } as GetUserResponse;
  }

  public async updateUser(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PatchUserRequest,
  ): Promise<User> {
    track(AppEvent.UpdateUser, userId, trackingInfo);

    const payload = {
      ...request,
      confirmEarlyAccessStart: undefined,
    };

    if (request.username) {
      const usernameExists = await this.usersDataProvider.getUserByUsername(
        request.username,
      );

      if (usernameExists) {
        throw new AppError({
          description: 'Username already exists.',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }
    }

    const existingUser = await this.usersDataProvider.getUserById(userId);

    if (!existingUser) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (payload.initialTrackingData) {
      if (existingUser.initialTrackingData) {
        this.logger.info(
          'User already has initial tracking data, dropping new initialTrackingData',
        );
        return existingUser;
      }

      identify(userId, {
        email: existingUser.email,
        ...payload.initialTrackingData,
      });
    }

    return await this.usersDataProvider.updateUser(userId, payload);
  }

  public async getSubscription(
    userId: number,
    trackingInfo: TrackingInfo,
  ): Promise<GetSubscriptionResponse> {
    this.logger.info('Getting subscription', { userId, trackingInfo });

    const user = await this.usersDataProvider.getUserById(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const subscription = await this.stripeProvider.getSubscriptionForCustomer(
      user.billingCustomerId,
    );

    if (!subscription) {
      throw new AppError({
        description: 'Subscription not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (subscription.discount) {
      this.logger.info('Subscription has discount', {
        discount: subscription.discount,
      });
    }

    const isPreOrder = subscription.discount?.coupon?.name === user.email;

    return {
      isPreOrder,
      preOrderValidUntil:
        isPreOrder && subscription.discount
          ? new Date(subscription.discount?.end || 0 * 1000)
          : undefined,
      isLifetimePreOrder: subscription.discount && !subscription.discount.end,
      subscriptionRenewalDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    };
  }

  public async addUserCredits(
    trackingInfo: TrackingInfo,
    request: AddUserCreditsRequest,
  ): Promise<void> {
    this.logger.info('Getting request to add user credits', {
      trackingInfo,
    });

    const user = await this.usersDataProvider.getUserByEmail(request.email);

    if (!user) {
      this.logger.warn('User not found', { trackingInfo });

      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    this.logger.info(`Adding ${request.amount} credits to user`, {
      trackingInfo,
    });

    await this.creditsProvider.modifyImageCreditCount(
      user.id,
      request.amount,
      ImageCreditChangeType.SUPPORT,
      `Requested by support`,
    );
  }
}
