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
import { useEventBus } from '@/lib/events.ts';
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
      if (campaignId === undefined) {
        this.selectedCampaignId = undefined;
        this.selectedCampaign = undefined;
        localStorage.removeItem(SELECTED_CAMPAIGN_ID_KEY_NAME);
        return;
      }

      this.selectedCampaignId = campaignId;
      localStorage.setItem(SELECTED_CAMPAIGN_ID_KEY_NAME, campaignId.toString());

      if (!this.selectedCampaign || this.selectedCampaign.id !== campaignId) {
        const getCampaignResponse = await getCampaign(campaignId);
        this.selectedCampaign = getCampaignResponse.data;
      }

      this.setCampaignRole();

      eventBus.$emit('campaign-selected', this.selectedCampaign);
    },
    async getCampaigns() {
      const campaignsResponse = await getCampaigns({
        offset: 0,
        limit: 100,
      });

      this.campaigns = campaignsResponse.data.data;

      if (this.campaigns.length) {
        try {
          if (this.selectedCampaignId) {
            await this.selectCampaign(this.selectedCampaignId);
          } else {
            await this.selectCampaign(this.campaigns[0].id);
          }
        } catch (err) {
          await this.selectCampaign(this.campaigns[0].id);
        }
      } else {
        await this.selectCampaign(undefined);
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
      this.setCampaignRole();
    },
    async saveCampaign(campaign: PutCampaignRequest) {
      await saveCampaign(campaign);
    },
    async deleteCampaign(campaignId: number) {
      await deleteCampaign(campaignId);
      if (this.selectedCampaignId === campaignId) {
        await this.selectCampaign(undefined);
      }
      await this.getCampaigns();
    },
  },
});
