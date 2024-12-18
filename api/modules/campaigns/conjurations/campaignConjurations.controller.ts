import {
  Path,
  Tags,
  Security,
  OperationId,
  Post,
  Delete,
  Inject,
  Route,
} from 'tsoa';
import { TrackingInfo, AppEvent, track } from '@/lib/tracking';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { CampaignConjurationsService } from '@/modules/campaigns/conjurations/campaignConjurations.service';
import { CampaignConjurationsDataProvider } from '@/modules/campaigns/conjurations/campaignConjurations.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';

@Route('campaigns/:campaignId/conjurations')
@Tags('Campaign Conjurations')
export class CampaignConjurationsController {
  constructor(
    private campaignConjurationsDataProvider: CampaignConjurationsDataProvider,
    private campaignConjurationsService: CampaignConjurationsService,
    private campaignsDataProvider: CampaignsDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
  ) {}

  @Security('jwt')
  @OperationId('postCampaignConjuration')
  @Post('/:campaignId/conjurations/:conjurationId')
  public async postCampaignConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId: number,
    @Path() conjurationId: number,
  ) {
    track(AppEvent.PostCampaignCampaign, userId, trackingInfo);

    return this.campaignConjurationsService.postCampaignConjuration(
      userId,
      trackingInfo,
      campaignId,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('deleteCampaignConjuration')
  @Delete('/:campaignId/conjurations/:conjurationId')
  public async deleteCampaignConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId: number,
    @Path() conjurationId: number,
  ) {
    track(AppEvent.DeleteCampaignCampaign, userId, trackingInfo);

    const campaign = await this.campaignsDataProvider.getUserCampaign(
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
      await this.conjurationsDataProvider.getConjurationById(conjurationId);

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignConjuration =
      await this.campaignConjurationsDataProvider.getCampaignConjuration(
        campaignId,
        conjurationId,
      );

    if (campaignConjuration) {
      await this.campaignConjurationsDataProvider.deleteCampaignConjuration(
        campaignId,
        conjurationId,
      );
    }
  }
}
