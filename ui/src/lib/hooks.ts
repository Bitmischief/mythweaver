import { useCampaignStore } from "@/store/campaign.store.ts";
import { computed } from "vue";
import { useAuthStore } from "@/store";
import { postQuickConjure } from "@/api/generators.ts";
import { useRouter } from "vue-router";

export function useSelectedCampaignId() {
  const store = useCampaignStore();
  return computed(() => store.selectedCampaignId);
}

export function useCurrentUserId() {
  const store = useAuthStore();
  return computed(() => store.user?.id);
}

export function useQuickConjure() {
  const router = useRouter();

  return async (generatorCode: string) => {
    const quickConjureResponse = await postQuickConjure(generatorCode);
    await router.push(`/conjurations/view/${quickConjureResponse.data.id}?quick=true`);
  };
}
