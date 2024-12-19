import { BillingService } from '@/modules/billing/billing.service';
import { MythWeaverLogger } from '@/modules/core/logging/logger';
import { StripeProvider } from '@/providers/stripe';
import { BillingDataProvider } from '@/modules/billing/billing.dataprovider';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Stripe from 'stripe';
import '@/lib/intercom';
import { EmailProvider } from '@/providers/emailProvider';
import { DiscordProvider } from '@/providers/discordProvider';
import { CreditsProvider } from '@/providers/creditsProvider';

describe('BillingService', () => {
  let billingService: BillingService;
  let mockLogger: jest.Mocked<MythWeaverLogger>;
  let mockStripeProvider: jest.Mocked<StripeProvider>;
  let mockBillingDataProvider: jest.Mocked<BillingDataProvider>;
  let mockEmailProvider: jest.Mocked<EmailProvider>;
  let mockDiscordProvider: jest.Mocked<DiscordProvider>;
  let mockCreditsProvider: jest.Mocked<CreditsProvider>;
  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;
    mockStripeProvider = {
      getSessionLineItems: jest.fn(),
    } as any;
    mockBillingDataProvider = {
      findProcessedStripeEvent: jest.fn(),
      createProcessedStripeEvent: jest.fn(),
      deleteProcessedStripeEvent: jest.fn(),
    } as any;
    mockEmailProvider = {
      sendTransactionalEmail: jest.fn(),
    } as any;
    mockDiscordProvider = {
      postToBillingChannel: jest.fn(),
    } as any;
    mockCreditsProvider = {
      modifyImageCreditCount: jest.fn(),
    } as any;

    billingService = new BillingService(
      mockLogger,
      mockStripeProvider,
      mockBillingDataProvider,
      mockEmailProvider,
      mockDiscordProvider,
      mockCreditsProvider,
    );
  });

  describe('processWebhookEvent', () => {
    it('should ignore already processed events', async () => {
      const mockEvent = { id: 'evt_123' } as Stripe.Event;
      mockBillingDataProvider.findProcessedStripeEvent.mockResolvedValue(
        {} as any,
      );

      await billingService.processWebhookEvent(mockEvent);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Already processed'),
      );
      expect(
        mockBillingDataProvider.createProcessedStripeEvent,
      ).not.toHaveBeenCalled();
    });

    it('should process new checkout.session.completed events', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            amount_total: 10000,
          },
        },
      } as Stripe.CheckoutSessionCompletedEvent;

      mockBillingDataProvider.findProcessedStripeEvent.mockResolvedValue(null);
      mockBillingDataProvider.createProcessedStripeEvent.mockResolvedValue(
        {} as any,
      );
      mockStripeProvider.getSessionLineItems.mockResolvedValue({
        data: [
          {
            price: { product: process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID },
            quantity: 1,
          },
        ],
      } as any);

      const processItemPaidSpy = jest
        .spyOn(billingService as any, 'processItemPaid')
        .mockResolvedValue(undefined);

      await billingService.processWebhookEvent(mockEvent);

      expect(processItemPaidSpy).toHaveBeenCalledWith(
        'cus_123',
        process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID,
        100,
        1,
      );
    });

    it('should handle errors and delete the processed event log', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      } as Stripe.CheckoutSessionCompletedEvent;

      mockBillingDataProvider.findProcessedStripeEvent.mockResolvedValue(null);
      mockBillingDataProvider.createProcessedStripeEvent.mockResolvedValue({
        id: 'log_123',
      } as any);
      mockStripeProvider.getSessionLineItems.mockRejectedValue(
        new Error('API error'),
      );

      await expect(
        billingService.processWebhookEvent(mockEvent),
      ).rejects.toThrow('API error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing stripe event',
        expect.any(Object),
      );
      expect(
        mockBillingDataProvider.deleteProcessedStripeEvent,
      ).toHaveBeenCalledWith('log_123');
    });
  });
});
