import { defineStore } from 'pinia';
import {
  Campaign,
  CampaignRole,
  deleteCampaign,
  getCampaign,
  getCampaigns,
  PutCampaignRequest,
  saveCampaign,
} from '@/api/campaigns.ts';
import { NO_CAMPAIGNS_EVENT, useEventBus } from '@/lib/events.ts';
import { useCurrentUserId } from '@/lib/hooks.ts';

const eventBus = useEventBus();

interface CampaignStoreState {
  selectedCampaignId: number | undefined;
  selectedCampaign: Campaign | undefined;
  selectedCampaignRole: CampaignRole | undefined;
  campaigns: Campaign[];
}

const SELECTED_CAMPAIGN_ID_KEY_NAME = 'selected-campaign-id';

export const useCampaignStore = defineStore({
  id: 'campaign',
  state: (): CampaignStoreState => ({
    selectedCampaignId: localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME)
      ? parseInt(localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME) || '')
      : undefined,
    selectedCampaign: undefined,
    selectedCampaignRole: undefined,
    campaigns: [],
  }),
  actions: {
    async selectCampaign(campaignId: number | undefined) {
      if (campaignId === undefined) return;

      this.selectedCampaignId = campaignId;
      localStorage.setItem(SELECTED_CAMPAIGN_ID_KEY_NAME, campaignId.toString());

      const getCampaignResponse = await getCampaign(campaignId);
      this.selectedCampaign = getCampaignResponse.data;

      this.setCampaignRole();

      eventBus.$emit('campaign-selected', this.selectedCampaign);
    },
    async getCampaigns() {
      const campaignsResponse = await getCampaigns({
        offset: 0,
        limit: 100,
      });

      this.campaigns = campaignsResponse.data.data;

      if (this.selectedCampaignId === undefined && this.campaigns.length) {
        await this.selectCampaign(this.campaigns[0].id);
      }
    },
    setCampaignRole() {
      const currentUserId = useCurrentUserId();
      this.selectedCampaignRole = this.selectedCampaign?.members?.find(
        (m) => m.user?.id === currentUserId.value,
      )?.role;
    },
    async loadCampaigns() {
      await this.getCampaigns();

      if (!this.campaigns.length) {
        eventBus.$emit(NO_CAMPAIGNS_EVENT, undefined);
        return;
      }

      if (this.selectedCampaignId) {
        try {
          const getCampaignResponse = await getCampaign(this.selectedCampaignId);
          this.selectedCampaign = getCampaignResponse.data;
        } catch (err) {
          await this.selectCampaign(this.campaigns[0].id);
        }
      }

      this.setCampaignRole();
    },
    async saveCampaign(campaign: PutCampaignRequest) {
      const response = await saveCampaign(campaign);
      await this.loadCampaigns();

      return response;
    },
    async deleteCampaign(campaignId: number) {
      await deleteCampaign(campaignId);
      await this.loadCampaigns();
    },
  },
});
