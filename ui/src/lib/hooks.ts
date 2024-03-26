import { useCampaignStore } from '@/store/campaign.store.ts';
import { computed, onMounted, Ref } from 'vue';
import { useAuthStore } from '@/store';
import { postQuickConjure } from '@/api/generators.ts';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { pusher } from '@/lib/serverEvents.ts';
import { BillingPlan } from '@/api/users.ts';
import { useEventBus } from '@/lib/events.ts';

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

export function useEarlyAccessCutoff() {
  const store = useAuthStore();
  return computed(() => store.user?.trialEndsAt);
}

export function useSubscriptionPaidThrough() {
  const store = useAuthStore();
  return computed(() => store.user?.subscriptionPaidThrough);
}

export function useEarlyAccessExempt() {
  const store = useAuthStore();
  return computed(() => store.user?.earlyAccessExempt || false);
}

export function useWebsocketChannel() {
  const userId = useCurrentUserId();

  if (!userId.value) {
    throw new Error('No userId to bind server events to!');
  }

  return pusher.subscribe(userId.value.toString());
}

export function useUnsavedChangesWarning(originalValue: Ref<any>, currentValue: Ref<any>) {
  onMounted(() => {
    onBeforeRouteLeave(() => {
      if (JSON.stringify(originalValue.value) === JSON.stringify(currentValue.value)) {
        return true;
      }

      return window.confirm('Do you really want to leave? you have unsaved changes!');
    });
  });
}

export function useCurrentUserRole() {
  const campaignStore = useCampaignStore();
  return computed(() => campaignStore.selectedCampaignRole);
}

export function useCurrentUserPlan() {
  const authStore = useAuthStore();
  return computed(() => authStore.user?.plan || BillingPlan.Free);
}

export interface UpgradeRequest {
  feature: string;
  requiredPlan: BillingPlan;
  redirectUri?: string;
}

export function showUpgradeModal(request: UpgradeRequest) {
  const eventBus = useEventBus();
  eventBus.$emit('request-upgrade', request);
}
