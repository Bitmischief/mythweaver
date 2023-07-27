import { useCampaignStore } from "@/store/campaign.store.ts";
import { computed } from "vue";

export function useSelectedCampaignId() {
  const store = useCampaignStore();
  return computed(() => store.selectedCampaignId);
}
