import { TrackingInfo } from '@/modules/core/analytics/tracking';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { CampaignConjurationsDataProvider } from '@/modules/campaigns/conjurations/campaignConjurations.dataprovider';
import { CampaignDataProvider } from '@/modules/campaigns/campaign.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';

export class CampaignConjurationsService {
  constructor(
    private campaignConjurationsDataProvider: CampaignConjurationsDataProvider,
    private campaignDataProvider: CampaignDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
  ) {}

  async postCampaignConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    conjurationId: number,
  ) {
    const campaign = await this.campaignDataProvider.getUserCampaign(
      userId,
      campaignId,
    );

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration =
      await this.conjurationsDataProvider.getUserConjurationById(
        userId,
        conjurationId,
      );

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    let campaignConjuration =
      await this.campaignConjurationsDataProvider.getCampaignConjuration(
        campaignId,
        conjurationId,
      );

    if (!campaignConjuration) {
      campaignConjuration =
        await this.campaignConjurationsDataProvider.createCampaignConjuration({
          campaignId,
          conjurationId,
        });
    }

    return campaignConjuration;
  }
}
