import {
  Body,
  Get,
  Inject,
  Post,
  Query,
  SuccessResponse,
  Tags,
  Route,
} from 'tsoa';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { TrackingInfo } from '@/lib/tracking';
import { MythWeaverLogger } from '@/lib/logger';
import {
  CheckoutUrlRequest,
  GetBillingPortalUrlRequest,
} from '@/modules/billing/billing.interface';
import Stripe from 'stripe';
import { BillingService } from '@/modules/billing/billing.service';
import { prisma } from '@/lib/providers/prisma';

@Route('billing')
@Tags('Billing')
export default class BillingController {
  constructor(
    private billingService: BillingService,
    private logger: MythWeaverLogger,
  ) {}

  @Post('/checkout-url')
  @SuccessResponse('200', 'Success')
  public async getCheckoutUrl(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() body: CheckoutUrlRequest,
  ): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new AppError({
          description: `Unable to find user for id ${userId}`,
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }

      return await this.billingService.getCheckoutUrl(
        user.billingCustomerId,
        body.priceId,
        body.subscription,
      );
    } catch (error) {
      this.logger.error(
        'Error getting checkout URL',
        { error, userId, trackingInfo },
        error,
      );
      throw new AppError({
        description: 'Error getting checkout URL',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Get('/redeem-preorder-url')
  @SuccessResponse('200', 'Success')
  public async getRedeemPreOrderUrl(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
  ): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new AppError({
          description: `Unable to find user for id ${userId}`,
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }

      return await this.billingService.getPreorderRedemptionSessionUrl(
        user.billingCustomerId,
        user.preorderRedemptionStripePriceId || '',
        user.preorderRedemptionCoupon || '',
      );
    } catch (error) {
      this.logger.error(
        'Error getting redeem preorder URL',
        { error, userId, trackingInfo },
        error,
      );
      throw new AppError({
        description: 'Error getting redeem preorder URL',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Get('/portal-url')
  @SuccessResponse('200', 'Success')
  public async getPortalUrl(
    @Inject() userId: number,
    @Query() upgrade?: boolean,
    @Query() newPlanPriceId?: string,
    @Query() redirectUri?: string,
  ): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new AppError({
          description: `Unable to find user for id ${userId}`,
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }

      const request: GetBillingPortalUrlRequest = {
        upgrade,
        newPlanPriceId,
        redirectUri,
      };

      return await this.billingService.getBillingPortalUrl(
        user.billingCustomerId,
        request,
      );
    } catch (error) {
      this.logger.error('Error getting portal URL', { error, userId }, error);
      throw new AppError({
        description: 'Error getting portal URL',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  public async processWebhook(event: Stripe.Event): Promise<void> {
    this.logger.info('Processing Stripe webhook event', { event });

    try {
      await this.billingService.processWebhookEvent(event);
    } catch (error) {
      this.logger.error(
        'Error processing stripe event',
        { error, eventId: event.id },
        error,
      );
      throw new AppError({
        description: 'Error processing webhook event',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
