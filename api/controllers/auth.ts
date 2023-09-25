import { Body, Inject, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import jwt from 'jsonwebtoken';
import { parentLogger } from '../lib/logger';
import { AppEvent, identify, track, TrackingInfo } from '../lib/tracking';
import CampaignController from './campaigns';
import mailchimpClient from '../lib/mailchimpMarketing';
import { lists, Status } from '@mailchimp/mailchimp_marketing';
import { format } from 'date-fns';
import EmailType = lists.EmailType;
const logger = parentLogger.getSubLogger();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const jwtExpirySeconds = 30 * 60; // 30 minutes
const jwtRefreshExpirySeconds = 14 * 24 * 60 * 60; // 14 days

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface TokenRequest {
  type: 'GOOGLE';
  credential: string;
  inviteCode?: string;
}

interface RefreshRequest {
  refreshToken: string;
}

@Route('auth')
@Tags('Auth')
export default class AuthController {
  @Post('/token')
  @SuccessResponse('200', 'Success')
  public async postToken(
    @Body() request: TokenRequest,
    @Inject() trackingInfo: TrackingInfo
  ): Promise<TokenResponse> {
    const ticket = await client.verifyIdToken({
      idToken: request.credential,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Unable to properly verify provided credentials',
      });
    }

    const { email } = payload;

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
      earlyAccessEnd.setHours(new Date().getHours() + 48);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          earlyAccessCutoffAt: earlyAccessEnd,
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
              ip_opt: trackingInfo.ip,
              ip_signup: trackingInfo.ip,
              timestamp_signup: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              timestamp_opt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            },
          ],
        }
      )) as any;

      if (response?.errors?.length > 0) {
        logger.warn('Received errors from Mailchimp', response.errors);
      }

      track(AppEvent.Registered, user.id, trackingInfo, { email });
    }

    if (new Date() > user.earlyAccessCutoffAt && !user.earlyAccessExempt) {
      logger.info(`User ${user.id} early access has expired`, user);

      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: "User's early access has expired",
      });
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
        request.inviteCode
      );
    }

    track(AppEvent.LoggedIn, user.id, trackingInfo, { email });
    identify(user.id, { $email: email, $name: email.split('@')[0] });

    return await this.issueTokens(user.id);
  }

  @Post('/refresh')
  @SuccessResponse('200', 'Success')
  public async postRefresh(
    @Body() request: RefreshRequest,
    @Inject() trackingInfo: TrackingInfo
  ): Promise<TokenResponse> {
    let userId;

    try {
      const payload = jwt.verify(
        request.refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY || ''
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

      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: "User's early access has expired",
      });
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

    return await this.issueTokens(userId);
  }

  private async issueTokens(userId: number) {
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
      }
    );

    logger.info('Saving refresh token', refreshToken, userId);
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
