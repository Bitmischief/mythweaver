import { useCampaignStore } from "@/store/campaign.store.ts";
import { computed } from "vue";
import { useAuthStore } from "@/store";

export function useSelectedCampaignId() {
  const store = useCampaignStore();
  return computed(() => store.selectedCampaignId);
}

export function useCurrentUserId() {
  const store = useAuthStore();
  return computed(() => store.user?.id);
}
