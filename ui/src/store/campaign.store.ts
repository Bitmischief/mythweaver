import { defineStore } from "pinia";
import {
  Campaign,
  deleteCampaign,
  getCampaign,
  getCampaigns,
  PutCampaignRequest,
  saveCampaign,
} from "@/api/campaigns.ts";
import { NO_CAMPAIGNS_EVENT, useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

interface CampaignStoreState {
  selectedCampaignId: number | undefined;
  selectedCampaign: Campaign | undefined;
  campaigns: Campaign[];
}

const SELECTED_CAMPAIGN_ID_KEY_NAME = "selected-campaign-id";

export const useCampaignStore = defineStore({
  id: "campaign",
  state: (): CampaignStoreState => ({
    selectedCampaignId: localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME)
      ? parseInt(localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME) || "")
      : undefined,
    selectedCampaign: undefined,
    campaigns: [],
  }),
  actions: {
    async selectCampaign(campaignId: number | undefined) {
      if (campaignId === undefined) return;

      this.selectedCampaignId = campaignId;
      localStorage.setItem(SELECTED_CAMPAIGN_ID_KEY_NAME, campaignId.toString());

      const getCampaignResponse = await getCampaign(campaignId);
      this.selectedCampaign = getCampaignResponse.data;

      eventBus.$emit("campaign-selected", this.selectedCampaign);
    },
    async getCampaigns() {
      const campaignsResponse = await getCampaigns({
        offset: 0,
        limit: 100,
      });

      this.campaigns = campaignsResponse.data.data;
    },
    async loadCampaigns() {
      await this.getCampaigns();

      if (!this.campaigns.length) {
        eventBus.$emit(NO_CAMPAIGNS_EVENT, undefined);
        return;
      }

      if (this.selectedCampaignId) {
        const getCampaignResponse = await getCampaign(this.selectedCampaignId);
        this.selectedCampaign = getCampaignResponse.data;
      }
    },
    async saveCampaign(campaign: PutCampaignRequest) {
      const response = await saveCampaign(campaign);
      await this.loadCampaigns();

      return response;
    },
    async deleteCampaign(campaignId: number) {
      await deleteCampaign(campaignId);
      await this.getCampaigns();
      this.selectedCampaignId = this.campaigns[0].id;
      await this.loadCampaigns();
    },
  },
});
