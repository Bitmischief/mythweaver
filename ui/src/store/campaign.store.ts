import { defineStore } from "pinia";
import { Campaign, getCampaign, getCampaigns } from "@/api/campaigns.ts";
import { NO_CAMPAIGNS_EVENT, useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

interface CampaignStoreState {
  selectedCampaignId: number;
  selectedCampaign: Campaign | undefined;
  campaigns: Campaign[];
}

const SELECTED_CAMPAIGN_ID_KEY_NAME = "selected-campaign-id";

export const useCampaignStore = defineStore({
  id: "campaign",
  state: (): CampaignStoreState => ({
    // initialize state from local storage to enable user to stay logged in
    selectedCampaignId: localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME)
      ? parseInt(localStorage.getItem(SELECTED_CAMPAIGN_ID_KEY_NAME) || "-1")
      : -1,
    selectedCampaign: undefined,
    campaigns: [],
  }),
  actions: {
    async selectCampaign(campaignId: number) {
      this.selectedCampaignId = campaignId;
      localStorage.setItem(SELECTED_CAMPAIGN_ID_KEY_NAME, campaignId.toString());

      const getCampaignResponse = await getCampaign(campaignId);
      this.selectedCampaign = getCampaignResponse.data;
    },
    async loadCampaigns() {
      const campaignsResponse = await getCampaigns({
        offset: 0,
        limit: 100,
      });

      this.campaigns = campaignsResponse.data.data;

      if (!this.campaigns.length) {
        eventBus.$emit(NO_CAMPAIGNS_EVENT, undefined);
      }
    },
  },
});
