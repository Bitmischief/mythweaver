import {
  BillingInterval,
  BillingPlan,
  ImageCreditChangeType,
  User,
} from '@prisma/client';
import { differenceInDays } from 'date-fns';
import { MythWeaverLogger } from '../../lib/logger';
import { GetBillingPortalUrlRequest } from './billing.interface';
import { setIntercomCustomAttributes } from '../../lib/intercom';
import { AppEvent, track } from '../../lib/tracking';
import { AdConversionEvent, reportAdConversionEvent } from '../../lib/ads';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { EmailProvider, EmailTemplates } from '../../providers/emailProvider';
import { StripeProvider } from '../../providers/stripe';
import Stripe from 'stripe';
import { BillingDataProvider } from './billing.dataprovider';
import { DiscordProvider } from '../../providers/discordProvider';
import { CreditsProvider } from '@/providers/creditsProvider';

export class BillingService {
  constructor(
    private logger: MythWeaverLogger,
    private stripeProvider: StripeProvider,
    private billingDataProvider: BillingDataProvider,
    private emailProvider: EmailProvider,
    private discordProvider: DiscordProvider,
    private creditsProvider: CreditsProvider,
  ) {}

  public async getCheckoutUrl(
    billingCustomerId: string,
    priceId: string,
    subscription: boolean,
  ): Promise<string> {
    return this.stripeProvider.getCheckoutUrl(
      billingCustomerId,
      priceId,
      subscription,
    );
  }

  async getPreorderRedemptionSessionUrl(
    customerId: string,
    priceId: string,
    coupon: string,
  ): Promise<string> {
    return this.stripeProvider.getPreorderRedemptionSessionUrl(
      customerId,
      priceId,
      coupon,
    );
  }

  async getBillingPortalUrl(
    billingCustomerId: string,
    request: GetBillingPortalUrlRequest,
  ): Promise<string> {
    return this.stripeProvider.getBillingPortalUrl(billingCustomerId, request);
  }

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    const existingStripeEvent =
      await this.billingDataProvider.findProcessedStripeEvent(event.id);

    if (existingStripeEvent) {
      this.logger.info(`Already processed stripe event ${event.id}, ignoring.`);
      return;
    }

    const stripeEventLog =
      await this.billingDataProvider.createProcessedStripeEvent(
        event.id,
        event as any,
      );

    try {
      await this.handleStripeEvent(event);
    } catch (err) {
      this.logger.error('Error processing stripe event', { error: err });
      await this.billingDataProvider.deleteProcessedStripeEvent(
        stripeEventLog.id,
      );
      throw err;
    }
  }

  private async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.processCheckoutSessionCompletedEvent(
          event as Stripe.CheckoutSessionCompletedEvent,
        );
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.resumed':
        await this.processSubscriptionDeletedOrResumedEvent(
          event as
            | Stripe.CustomerSubscriptionDeletedEvent
            | Stripe.CustomerSubscriptionResumedEvent,
        );
        break;
      case 'customer.subscription.updated':
        await this.processSubscriptionUpdatedEvent(
          event as Stripe.CustomerSubscriptionUpdatedEvent,
        );
        break;
      case 'invoice.paid':
        await this.processInvoicePaidEvent(event as Stripe.InvoicePaidEvent);
        break;
      default:
        this.logger.info(`Unhandled event type: ${event.type}`);
    }
  }

  private async processCheckoutSessionCompletedEvent(
    event: Stripe.CheckoutSessionCompletedEvent,
  ): Promise<void> {
    const session = event.data.object;
    const lineItems = await this.stripeProvider.getSessionLineItems(session.id);

    if (!lineItems) {
      throw new AppError({
        description: 'Unable to fetch session line items, aborting!',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    const imageCreditPack100 = this.findImageCreditPack(lineItems);

    if (imageCreditPack100) {
      await this.processItemPaid(
        session.customer as string,
        imageCreditPack100.price?.product as string,
        this.calculateAmountInDollars(session.amount_total),
        imageCreditPack100.quantity || 0,
      );
    }
  }

  private findImageCreditPack(
    lineItems: Stripe.ApiList<Stripe.LineItem>,
  ): Stripe.LineItem | undefined {
    return lineItems.data.find(
      (d) => d.price?.product === process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID,
    );
  }

  private calculateAmountInDollars(amountInCents: number | null): number {
    return (amountInCents || 0) / 100;
  }

  private async processSubscriptionDeletedOrResumedEvent(
    event:
      | Stripe.CustomerSubscriptionDeletedEvent
      | Stripe.CustomerSubscriptionResumedEvent,
  ): Promise<void> {
    const user = await this.billingDataProvider.getUserByBillingCustomerId(
      event.data.object.customer as string,
    );
    const periodEnd = new Date(event.data.object.current_period_end * 1000);

    await this.billingDataProvider.updateUserSubscription(user.id, {
      subscriptionPaidThrough: periodEnd,
      pendingPlanChange: BillingPlan.FREE,
      pendingPlanChangeEffectiveDate: periodEnd,
    });

    await setIntercomCustomAttributes(user.id, {
      'Plan Renewal Date': periodEnd,
    });
  }

  private async processSubscriptionUpdatedEvent(
    event: Stripe.CustomerSubscriptionUpdatedEvent,
  ): Promise<void> {
    const user = await this.billingDataProvider.getUserByBillingCustomerId(
      event.data.object.customer as string,
    );

    if (event.data.object.status !== 'active') {
      this.logger.info(
        'Subscription status is not active, ignoring this webhook.',
        {
          status: event.data.object.status,
        },
      );
      return;
    }

    const subscriptionEnd = new Date(
      event.data.object.current_period_end * 1000,
    );
    const plan = this.getPlanForProductId(
      event.data.object.items.data[0].price.product as string,
    );
    const subscriptionAmount =
      (event.data.object.items.data[0].price.unit_amount || 0) / 100;
    const daysSinceRegistration = differenceInDays(
      new Date(),
      user.createdAt || new Date(),
    );

    if (
      user.plan === BillingPlan.PRO &&
      (plan === BillingPlan.BASIC || plan === BillingPlan.FREE)
    ) {
      await this.handleDowngrade(user, plan, subscriptionEnd);
    } else {
      await this.handleUpgradeOrNewSubscription(
        user,
        plan,
        subscriptionEnd,
        subscriptionAmount,
        daysSinceRegistration,
      );
    }

    await setIntercomCustomAttributes(user.id, {
      'Plan Renewal Date': subscriptionEnd,
      Plan: plan,
    });
  }

  private async processInvoicePaidEvent(
    event: Stripe.InvoicePaidEvent,
  ): Promise<void> {
    if (event.data.object.status === 'paid') {
      const lines = event.data.object.lines.data;
      const subscriptionLines = lines.filter((l) => l.subscription !== null);

      if (subscriptionLines.length) {
        const prevSubscription = subscriptionLines.find((sl) => sl.amount < 0);
        const curSubscription = subscriptionLines.find((sl) => sl.amount > 0);

        const subscriptionProductId = curSubscription?.plan?.product as string;

        if (subscriptionProductId) {
          const user =
            await this.billingDataProvider.getUserByBillingCustomerId(
              event.data.object.customer as string,
            );

          if (
            event.data.object.discount?.coupon.id ===
            user.preorderRedemptionCoupon
          ) {
            await this.processPreorderRedemption(
              user,
              event.data.object.subscription as string,
              curSubscription?.plan?.product as string,
            );
          } else {
            await this.processSubscriptionPaid(
              user,
              subscriptionProductId,
              curSubscription?.plan as Stripe.Plan,
              event.data.object.amount_paid / 100,
              (prevSubscription?.plan?.product as string) ?? null,
              (prevSubscription?.plan as Stripe.Plan) ?? null,
              event.data.object.discount?.coupon,
            );
          }
        }
      }
    }
  }

  private async processItemPaid(
    billingCustomerId: string,
    productId: string,
    amountPaid: number,
    qty: number,
  ): Promise<void> {
    const user =
      await this.billingDataProvider.getUserByBillingCustomerId(
        billingCustomerId,
      );
    const creditCount = this.getImageCreditCountForProductId(productId);

    await this.creditsProvider.modifyImageCreditCount(
      user.id,
      creditCount * qty,
      ImageCreditChangeType.PURCHASE,
      `Purchased ${qty} of ${creditCount} image credit packs`,
    );

    track(AppEvent.PaidImageCreditPack, user.id, undefined, {
      amount: amountPaid,
      quantity: creditCount,
    });

    track(AppEvent.RevenueReceived, user.id, undefined, {
      amount: amountPaid,
      plan: 'CREDIT_PACK',
    });
  }

  private async processSubscriptionPaid(
    user: User,
    productId: string,
    stripePlan: Stripe.Plan,
    amountPaid: number,
    prevProductId: string | null,
    prevStripePlan: Stripe.Plan | null,
    coupon: Stripe.Coupon | undefined,
  ): Promise<void> {
    const plan = this.getPlanForProductId(productId);
    const prevPlan = prevProductId
      ? this.getPlanForProductId(prevProductId)
      : null;
    const interval = this.getBillingIntervalForStripePlan(stripePlan);
    const prevInterval = prevStripePlan
      ? this.getBillingIntervalForStripePlan(prevStripePlan)
      : null;

    const curCreditCount = this.getCreditCountForPlan(plan, interval);
    const prevCreditCount =
      prevPlan && amountPaid > 0
        ? this.getCreditCountForPlan(
            prevPlan,
            prevInterval || BillingInterval.MONTHLY,
          )
        : 0;

    await this.billingDataProvider.updateUserSubscription(user.id, {
      planInterval: interval,
      trialEndsAt: null,
    });

    const incrementCreditCount =
      amountPaid > 0 || coupon?.percent_off === 100
        ? curCreditCount - prevCreditCount
        : 0;

    await this.creditsProvider.modifyImageCreditCount(
      user.id,
      incrementCreditCount,
      ImageCreditChangeType.SUBSCRIPTION,
      `${plan} plan`,
    );

    await setIntercomCustomAttributes(user.id, {
      'Plan Interval': interval,
      Plan: plan,
    });

    track(AppEvent.PaidSubscription, user.id, undefined, {
      amount: amountPaid,
      interval,
      plan: plan,
    });

    track(AppEvent.RevenueReceived, user.id, undefined, {
      amount: amountPaid,
      interval,
      plan: plan,
    });
  }

  private async handleDowngrade(
    user: User,
    plan: BillingPlan,
    subscriptionEnd: Date,
  ): Promise<void> {
    await this.billingDataProvider.updateUserSubscription(user.id, {
      pendingPlanChange: plan,
      pendingPlanChangeEffectiveDate: subscriptionEnd,
      subscriptionPaidThrough: subscriptionEnd,
    });
  }

  private async handleUpgradeOrNewSubscription(
    user: User,
    plan: BillingPlan,
    subscriptionEnd: Date,
    subscriptionAmount: number,
    daysSinceRegistration: number,
  ): Promise<void> {
    if (user.plan === BillingPlan.FREE || user.plan === BillingPlan.TRIAL) {
      await this.handleNewSubscription(
        user,
        plan,
        subscriptionEnd,
        subscriptionAmount,
        daysSinceRegistration,
      );
    } else if (user.plan === BillingPlan.BASIC && plan === BillingPlan.PRO) {
      await this.handleUpgrade(
        user,
        plan,
        subscriptionEnd,
        subscriptionAmount,
        daysSinceRegistration,
      );
    }

    await this.billingDataProvider.updateUserSubscription(user.id, {
      subscriptionPaidThrough: subscriptionEnd,
      plan,
    });
  }

  private async handleNewSubscription(
    user: User,
    plan: BillingPlan,
    subscriptionEnd: Date,
    subscriptionAmount: number,
    daysSinceRegistration: number,
  ): Promise<void> {
    track(AppEvent.NewSubscription, user.id, undefined, {
      amount: subscriptionAmount,
      plan,
      daysSinceRegistration,
    });

    await this.sendNewSubscriptionNotifications(
      user,
      subscriptionAmount,
      daysSinceRegistration,
    );

    await reportAdConversionEvent(AdConversionEvent.Purchase, user, {
      purchase: { currency: 'USD', value: subscriptionAmount },
    });

    await this.sendSubscriberWelcomeEmail(user, plan);
  }

  private async handleUpgrade(
    user: User,
    plan: BillingPlan,
    subscriptionEnd: Date,
    subscriptionAmount: number,
    daysSinceRegistration: number,
  ): Promise<void> {
    await this.discordProvider.postToBillingChannel(
      `New Upgrade: ${user.email}! Amount: $${subscriptionAmount}. Days since registration: ${daysSinceRegistration}. ${
        user.initialTrackingData
          ? `Source: ${this.getTrackingString(user.initialTrackingData)}`
          : ''
      }`,
    );

    track(AppEvent.UpgradeSubscription, user.id, undefined, {
      amount: subscriptionAmount,
      plan,
      daysSinceRegistration,
    });
  }

  private async processPreorderRedemption(
    user: User,
    subscriptionId: string,
    productId: string,
  ): Promise<void> {
    const subscription =
      await this.stripeProvider.getSubscription(subscriptionId);
    const subscriptionEnd = new Date(subscription.current_period_end * 1000);
    const plan = this.stripeProvider.getPlanForProductId(productId);

    await this.billingDataProvider.updateUserSubscription(user.id, {
      preorderRedemptionCoupon: null,
      preorderRedemptionStripePriceId: null,
      trialEndsAt: null,
      plan,
      subscriptionPaidThrough: subscriptionEnd,
    });

    track(AppEvent.PreorderSubscriptionRedemption, user.id);
  }

  private getPlanForProductId(productId: string): BillingPlan {
    return this.stripeProvider.getPlanForProductId(productId);
  }

  private getBillingIntervalForStripePlan(plan: Stripe.Plan): BillingInterval {
    return plan.interval === 'month'
      ? BillingInterval.MONTHLY
      : BillingInterval.YEARLY;
  }

  private getImageCreditCountForProductId(productId: string): number {
    return this.stripeProvider.getImageCreditCountForProductId(productId);
  }

  private getCreditCountForPlan(
    plan: BillingPlan,
    interval: BillingInterval,
  ): number {
    let creditCount = plan === BillingPlan.PRO ? 300 : 100;
    if (interval === BillingInterval.YEARLY) {
      creditCount *= 12;
    }
    return creditCount;
  }

  private getTrackingString(initialTrackingData: any): string {
    return Object.entries(initialTrackingData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  private async sendNewSubscriptionNotifications(
    user: User,
    subscriptionAmount: number,
    daysSinceRegistration: number,
  ): Promise<void> {
    const trackingString = this.getTrackingString(
      user.initialTrackingData || {},
    );
    await this.discordProvider.postToBillingChannel(
      `New subscription: ${user.email}! Amount: $${subscriptionAmount}. Days since registration: ${daysSinceRegistration}. ${
        user.initialTrackingData ? `Source: ${trackingString}` : ''
      }`,
    );
  }

  private async sendSubscriberWelcomeEmail(
    user: User,
    plan: BillingPlan,
  ): Promise<void> {
    const latestCampaignForUser =
      await this.billingDataProvider.getLatestCampaignForUser(user.id);

    try {
      await this.emailProvider.sendTransactionalEmail(
        user.email,
        EmailTemplates.SUBSCRIBER_WELCOME,
        [
          { key: 'PLAN', value: plan },
          { key: 'CAMPAIGN', value: latestCampaignForUser?.name || 'awesome' },
        ],
      );
    } catch (err) {
      this.logger.error('Error sending subscriber welcome email', {}, err);
    }
  }
}
