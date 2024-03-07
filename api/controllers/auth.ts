import {
  Body,
  Inject,
  OperationId,
  Post,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import jwt from 'jsonwebtoken';
import { AppEvent, identify, track, TrackingInfo } from '../lib/tracking';
import CampaignController, { CampaignRole } from './campaigns';
import mailchimpClient from '../lib/mailchimpMarketing';
import { lists, Status } from '@mailchimp/mailchimp_marketing';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import EmailType = lists.EmailType;
import { urlPrefix } from '../lib/utils';
import { sendTransactionalEmail } from '../lib/transactionalEmail';
import { createCustomer } from '../services/billing';
import { MythWeaverLogger } from '../lib/logger';

const jwtExpirySeconds = 30 * 60; // 30 minutes
const jwtRefreshExpirySeconds = 14 * 24 * 60 * 60; // 14 days

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  signupConjurationPrompt?: string | null | undefined;
}

interface TokenRequest {
  type: 'GOOGLE' | 'MAGIC_LINK';
  credential: string;
  inviteCode?: string;
}

interface RefreshRequest {
  refreshToken: string;
}

interface MagicLinkRequest {
  email: string;
  inviteCode?: string | undefined;
  conjurationPrompt?: string | undefined;
}

@Route('auth')
@Tags('Auth')
export default class AuthController {
  @Post('/token')
  @SuccessResponse('200', 'Success')
  public async postToken(
    @Body() request: TokenRequest,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
  ): Promise<TokenResponse> {
    const magicLink = await prisma.magicLink.findUnique({
      where: {
        token: request.credential,
      },
      include: {
        user: true,
      },
    });

    if (!magicLink) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Unable to properly verify provided credentials',
      });
    }

    if (new Date() > new Date(magicLink.expiresAt)) {
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: 'Magic link has expired',
      });
    }

    if (magicLink.inviteCode) {
      const campaignController = new CampaignController();
      await campaignController.acceptInvite(
        magicLink.user.id,
        trackingInfo,
        logger,
        magicLink.inviteCode,
      );
    }

    const email = magicLink.user.email;

    if (!email) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Email did not exist on provided credentials',
      });
    }

    logger.info('Getting user for email', email);
    let user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      const earlyAccessEnd = new Date();
      earlyAccessEnd.setHours(new Date().getHours() + 24 * 7);

      const stripeCustomerId = await createCustomer(email);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          earlyAccessCutoffAt: earlyAccessEnd,
          billingCustomerId: stripeCustomerId,
          imageCredits: 25,
        },
      });

      const response = (await mailchimpClient.lists.batchListMembers(
        process.env.MAILCHIMP_AUDIENCE_ID as string,
        {
          members: [
            {
              email_address: email.toLowerCase(),
              email_type: 'html' as EmailType,
              status: 'subscribed' as Status,
              ip_opt: trackingInfo?.ip,
              ip_signup: trackingInfo?.ip,
              timestamp_signup: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              timestamp_opt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            },
          ],
        },
      )) as any;

      if (response?.errors?.length > 0) {
        logger.warn('Received errors from Mailchimp', response.errors);
      }

      track(AppEvent.Registered, user.id, trackingInfo, { email });
    }

    if (request.inviteCode) {
      const invite = await prisma.campaignMember.findUnique({
        where: {
          inviteCode: request.inviteCode,
        },
      });

      if (!invite) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invite code is invalid',
        });
      }

      const campaignController = new CampaignController();
      await campaignController.acceptInvite(
        user.id,
        trackingInfo,
        logger,
        request.inviteCode,
      );
    }

    track(AppEvent.LoggedIn, user.id, trackingInfo, { email });
    identify(user.id, { $email: email, $name: email.split('@')[0] });

    return {
      ...(await this.issueTokens(user.id, logger)),
      signupConjurationPrompt: magicLink.signupConjurationPrompt,
    };
  }

  @Post('/refresh')
  @SuccessResponse('200', 'Success')
  public async postRefresh(
    @Body() request: RefreshRequest,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
  ): Promise<TokenResponse> {
    let userId;

    try {
      const payload = jwt.verify(
        request.refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY || '',
      );

      userId = (payload as any).userId;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        // if the error thrown is because the JWT is unauthorized,
        // return a 401 error
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: 'Unable to authorize this refresh token',
        });
      }
      // otherwise, return a bad request error
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: 'Invalid refresh token provided',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (
      !user ||
      (new Date() > user.earlyAccessCutoffAt && !user.earlyAccessExempt)
    ) {
      logger.info(`User ${userId} early access has expired`, user);
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: {
        refreshToken: request.refreshToken,
      },
    });

    if (!dbToken || dbToken.userId !== userId) {
      // otherwise, return a bad request error
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: 'Invalid refresh token provided',
      });
    }

    try {
      await prisma.refreshToken.delete({
        where: {
          refreshToken: request.refreshToken,
        },
      });
    } catch {
      /* empty */
    }

    track(AppEvent.SessionRefreshed, userId, trackingInfo);

    return await this.issueTokens(userId, logger);
  }

  @Security('jwt')
  @OperationId('postMagicLink')
  @Post('/magic-link')
  public async postMagicLink(
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: MagicLinkRequest,
    @Inject() logger: MythWeaverLogger,
  ): Promise<any> {
    const email = request.email.toLowerCase();
    logger.info('Received magic link request for email', email);

    let user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const isNewUser = !user;

    if (!user) {
      logger.info('Creating new user for email', email);

      const earlyAccessEnd = new Date();
      earlyAccessEnd.setHours(new Date().getHours() + 24 * 7);

      const stripeCustomerId = await createCustomer(email);

      user = await prisma.user.create({
        data: {
          email: email,
          earlyAccessCutoffAt: earlyAccessEnd,
          billingCustomerId: stripeCustomerId,
          imageCredits: 25,
        },
      });

      await prisma.campaign.create({
        data: {
          name: 'My Campaign',
          description: '',
          rpgSystemCode: 'Dungeons & Dragons',
          userId: user.id,
          members: {
            create: {
              userId: user.id,
              role: CampaignRole.DM,
              joinedAt: new Date(),
            },
          },
        },
      });

      const response = (await mailchimpClient.lists.batchListMembers(
        process.env.MAILCHIMP_AUDIENCE_ID as string,
        {
          members: [
            {
              email_address: email,
              email_type: 'html' as EmailType,
              status: 'subscribed' as Status,
              ip_opt: trackingInfo?.ip,
              ip_signup: trackingInfo?.ip,
              timestamp_signup: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              timestamp_opt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            },
          ],
        },
      )) as any;

      if (response?.errors?.length > 0) {
        logger.warn('Received errors from Mailchimp', response.errors);
      }

      track(AppEvent.Registered, user.id, trackingInfo, {
        email,
      });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(new Date().getHours() + 1);

    await prisma.magicLink.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        inviteCode: request.inviteCode,
        signupConjurationPrompt: isNewUser
          ? request.conjurationPrompt
          : undefined,
      },
    });

    logger.info('Created magic link', { token, expiresAt, userId: user.id });

    const link = `${urlPrefix}/auth/magic-link?t=${token}`;

    await sendTransactionalEmail('magic-link', `Log into MythWeaver`, email, [
      {
        name: 'LINK',
        content: link,
      },
    ]);
  }

  private async issueTokens(userId: number, logger: MythWeaverLogger) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY || '', {
      algorithm: 'HS256',
      expiresIn: jwtExpirySeconds,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + jwtRefreshExpirySeconds);

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET_KEY || '',
      {
        algorithm: 'HS256',
        expiresIn: jwtRefreshExpirySeconds,
      },
    );

    logger.info('Saving refresh token', { refreshToken, userId });
    await prisma.refreshToken.create({
      data: {
        refreshToken,
        expiresAt,
        userId,
      },
    });

    return {
      access_token: token,
      refresh_token: refreshToken,
    };
  }
}
