<script lang="ts" setup>
import { useAuthStore } from '@/store/auth.store.ts';
import {
  BillingPlan,
  getCurrentSubscription,
  patchCurrentUser,
  Subscription,
} from '@/api/users.ts';
import {
  CreditCardIcon,
  UserCircleIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline';
import { computed, onMounted, ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications';
import { getBillingPortalUrl } from '@/api/billing.ts';
import Loader from '@/components/Core/Loader.vue';
import { format } from 'date-fns';
import PricingPlan from '@/components/Core/PricingPlan.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import PlanBadge from '@/components/Core/PlanBadge.vue';
import { AxiosError } from 'axios';
import { useEventBus } from '@/lib/events.ts';
import { connectToDiscord, disconnectFromDiscord } from '@/api/integrations';
import { useRoute } from 'vue-router';

defineEmits(['show-subscription-modal']);

const eventBus = useEventBus();
const store = useAuthStore();
const user = computed(() => store.user);
const tab = ref('billing');
const route = useRoute();

const username = ref('');
const billingLoading = ref(false);
const showBuyImageCreditsModal = ref(false);
const imageCredit100PackPriceId = computed(
  () => import.meta.env.VITE_STRIPE_100_IMAGE_CREDITS_ID,
);

const subscription = ref<Subscription | null>(null);

async function clickBilling() {
  if (
    user.value?.plan === BillingPlan.Trial ||
    user.value?.plan === BillingPlan.Free
  ) {
    eventBus.$emit('show-subscription-modal');
  } else {
    billingLoading.value = true;
    const portalUrlResponse = await getBillingPortalUrl();
    location.href = portalUrlResponse.data;
  }
}

onMounted(async () => {
  username.value = user.value?.username ?? '';

  const { tab: tabParam } = route.query;

  if (tabParam) {
    tab.value = tabParam as string;
  }

  const discordConnected = route.query.discordConnected === 'true';

  if (discordConnected) {
    showSuccess({ message: 'Discord account connected successfully!' });
  }

  const subscriptionResponse = await getCurrentSubscription();
  subscription.value = subscriptionResponse.data;
});

const saveChangesLoading = ref(false);

async function saveChanges() {
  if (!store.user) {
    return;
  }

  try {
    saveChangesLoading.value = true;

    await patchCurrentUser({
      username: username.value,
    });

    await store.loadCurrentUser();

    showSuccess({ message: 'Your username has been updated!' });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
  } finally {
    saveChangesLoading.value = false;
  }
}

async function connectDiscord() {
  try {
    const response = await connectToDiscord();
    window.location.href = response.data.redirectUri;
  } catch (error) {
    showError({
      message: 'Failed to connect Discord account. Please try again.',
    });
  }
}

async function disconnectDiscord() {
  try {
    await disconnectFromDiscord();
    await store.loadCurrentUser();
    showSuccess({ message: 'Discord account disconnected successfully.' });
  } catch (error) {
    showError({
      message: 'Failed to disconnect Discord account. Please try again.',
    });
  }
}
</script>

<template>
  <div v-if="user" class="flex flex-col">
    <div class="text-lg text-neutral-200">Settings</div>
    <div class="py-4 flex flex-wrap md:flex-nowrap">
      <div class="min-w-[14em] grow mb-4 md:mb-0">
        <div class="rounded-[12px] bg-surface-2 border-surface-3 border p-2">
          <div
            class="text-sm flex mb-2 py-1 px-2 rounded-[8px]"
            :class="{
              'bg-surface-3 text-neutral-300': tab === 'billing',
              'hover:bg-purple-800/20 text-neutral-500 cursor-pointer':
                tab !== 'billing',
            }"
            @click="tab = 'billing'"
          >
            <CreditCardIcon class="h-6 mr-1" />
            <div class="self-center text-sm">Billing & Subscription</div>
          </div>
          <div
            class="text-sm flex mb-2 py-1 px-2 rounded-[8px]"
            :class="{
              'bg-surface-3 text-neutral-300': tab === 'profile',
              'hover:bg-purple-800/20 text-neutral-500 cursor-pointer':
                tab !== 'profile',
            }"
            @click="tab = 'profile'"
          >
            <UserCircleIcon class="h-6 mr-1" />
            <div class="self-center text-sm">Profile Settings</div>
          </div>
          <div
            class="text-sm flex mb-2 py-1 px-2 rounded-[8px]"
            :class="{
              'bg-surface-3 text-neutral-300': tab === 'connections',
              'hover:bg-purple-800/20 text-neutral-500 cursor-pointer':
                tab !== 'connections',
            }"
            @click="tab = 'connections'"
          >
            <LinkIcon class="h-6 mr-1" />
            <div class="self-center text-sm">Connected Accounts</div>
          </div>
        </div>
      </div>
      <div class="md:mx-8 text-neutral-200 grow">
        <div v-if="tab === 'profile'">
          <div class="text-lg mb-2">Profile Settings</div>
          <FormKit :actions="false" type="form" @submit="saveChanges">
            <div
              class="p-6 rounded-[12px] bg-surface-2 border border-surface-3"
            >
              <div class="text-md">User Information</div>
              <div class="grid grid-cols-2 mt-8 gap-8">
                <div>
                  <FormKit
                    :value="user?.email"
                    label="Email"
                    type="text"
                    inner-class="$reset border-none w-full"
                    input-class="$reset input-secondary"
                    disabled
                  />
                </div>

                <div>
                  <FormKit
                    v-model="username"
                    label="Username"
                    type="text"
                    inner-class="$reset border-none w-full"
                    input-class="$reset input-secondary"
                  />
                </div>
              </div>
              <FormKit
                v-if="username !== user?.username"
                label="Save"
                type="submit"
                input-class="$reset button-ghost"
              />
            </div>
          </FormKit>
        </div>
        <div v-if="tab === 'billing'">
          <div class="text-lg mb-2">Billing & Subscription</div>
          <div class="p-4 rounded-[12px] bg-surface-2 border border-surface-3">
            <div class="text-lg">Subscription Information</div>
            <div class="text-sm text-neutral-500 mt-2 mb-4">
              Here are your active subscriptions. They will be automatically
              billed according to your billing cycle. You have the flexibility
              to modify or update any subscription at your convenience.
            </div>
            <div class="flex flex-wrap lg:flex-nowrap">
              <div
                class="bg-surface border border-surface-3 rounded-[12px] grow m-2 p-4 w-full md:w-[50%]"
              >
                <div class="text-sm text-neutral-400">Current Subscription</div>
                <div class="text-3xl my-2 flex">
                  <div>Mythweaver</div>
                  <PlanBadge />
                </div>
                <div class="mt-6 w-full">
                  <button
                    v-if="user.plan && user.plan !== 'FREE'"
                    class="button-ghost-white mr-2"
                    :disabled="billingLoading"
                    @click="clickBilling"
                  >
                    Manage Subscription
                  </button>
                  <button
                    v-if="user.plan && user.plan !== 'PRO'"
                    class="button-gradient"
                    :disabled="billingLoading"
                    @click="clickBilling"
                  >
                    Upgrade Subscription
                  </button>
                </div>
              </div>
              <div
                class="bg-surface border border-surface-3 rounded-[12px] grow m-2 p-4 w-full md:w-[50%]"
              >
                <div class="text-sm text-neutral-400">Image Credit Count</div>
                <div class="text-3xl flex">
                  <span class="text-bold text-4xl">
                    {{ user.imageCredits }}
                  </span>
                  <span class="text-lg text-neutral-400 pt-1 px-1 self-center">
                    images
                  </span>
                </div>

                <div class="mt-6 w-full">
                  <button
                    v-if="user.plan"
                    class="button-ghost-white mr-2"
                    @click="showBuyImageCreditsModal = true"
                  >
                    Add more credits
                  </button>
                </div>
              </div>
            </div>
          </div>

          <template v-if="subscription">
            <div
              v-if="!subscription.isPreOrder && user.subscriptionPaidThrough"
              class="p-4 rounded-[12px] bg-surface-2 border border-surface-3 mt-6"
            >
              <div class="text-lg">Billing Information</div>
              <div
                v-if="user.subscriptionPaidThrough"
                class="flex justify-between"
              >
                <div
                  v-if="
                    !!user.pendingPlanChange &&
                    user.pendingPlanChange !== BillingPlan.Free
                  "
                  class="text-sm text-neutral-500 my-2"
                >
                  Your
                  <span class="text-neutral-200">
                    {{ user.plan }}
                  </span>
                  plan will be downgraded to
                  <span class="text-neutral-200">
                    {{ user.pendingPlanChange }}
                  </span>
                  on
                  <span
                    v-if="user.pendingPlanChangeEffectiveDate"
                    class="text-neutral-200"
                  >
                    {{
                      format(
                        user.pendingPlanChangeEffectiveDate,
                        'MMM dd, yyyy',
                      )
                    }}
                  </span>
                </div>
                <div
                  v-else-if="
                    !!user.pendingPlanChange &&
                    user.pendingPlanChange === BillingPlan.Free
                  "
                  class="text-sm text-neutral-500 my-2"
                >
                  Your
                  <span class="text-neutral-200">
                    {{ user.plan }}
                  </span>
                  plan will cancelled on
                  <span
                    v-if="user.pendingPlanChangeEffectiveDate"
                    class="text-neutral-200"
                  >
                    {{
                      format(
                        user.pendingPlanChangeEffectiveDate,
                        'MMM dd, yyyy',
                      )
                    }}
                  </span>
                </div>
                <div v-else class="text-sm text-neutral-500 my-2">
                  Your
                  <span class="text-neutral-200">
                    {{ user.plan }}
                  </span>
                  subscription will automatically be renewed on
                  <span class="text-neutral-200">
                    {{ format(user.subscriptionPaidThrough, 'MMM dd, yyyy') }}
                  </span>
                </div>
                <div>
                  <button
                    class="button-primary"
                    :disabled="billingLoading"
                    @click="clickBilling"
                  >
                    Manage Billing
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else-if="subscription.isPreOrder"
              class="p-4 rounded-[12px] bg-surface-2 border border-surface-3 mt-6 flex justify-between"
            >
              <div>
                <div class="text-lg">Pre-Order Information</div>
                <div
                  v-if="!subscription.isLifetimePreOrder"
                  class="text-sm text-neutral-500 my-2"
                >
                  Your
                  <span class="text-neutral-200">
                    {{ user.plan }}
                  </span>
                  plan pre-order coupon expires on
                  <span class="text-neutral-200">
                    {{
                      format(subscription.preOrderValidUntil, 'MMM dd, yyyy')
                    }}
                  </span>
                </div>
                <div v-else class="text-sm text-neutral-500 my-2">
                  You have a
                  <span class="text-neutral-200"> lifetime </span> pre-order
                  coupon for the
                  <span class="text-neutral-200">
                    {{ user.plan }}
                  </span>
                  plan
                </div>
              </div>

              <div class="self-center">
                <button
                  class="button-primary"
                  :disabled="billingLoading"
                  @click="clickBilling"
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </template>
        </div>
        <div v-if="tab === 'connections'">
          <div class="text-lg mb-2">Connected Accounts</div>
          <div class="p-4 rounded-[12px] bg-surface-2 border border-surface-3">
            <div class="text-lg">Discord Connection</div>
            <div class="text-sm text-neutral-500 mt-2 mb-4">
              Connect your Discord account to access additional features and
              integrations.
            </div>
            <div class="flex items-center">
              <img
                src="@/assets/icons/discord_icon.svg"
                alt="Discord"
                class="w-8 h-8 mr-2"
              />
              <span v-if="user.discordHandle" class="text-green-500">
                Connected: {{ user.discordHandle }}
              </span>
              <span v-else class="text-yellow-500">Not connected</span>
            </div>
            <button
              v-if="!user.discordHandle"
              class="button-primary mt-4"
              @click="connectDiscord"
            >
              Connect Discord
            </button>
            <button
              v-else
              class="button-ghost-white mt-4"
              @click="disconnectDiscord"
            >
              Disconnect Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center my-auto">
    <div>
      <Loader />
      <div class="mt-4">Loading user settings...</div>
    </div>
  </div>
  <ModalAlternate
    :show="showBuyImageCreditsModal"
    extra-dark
    @close="showBuyImageCreditsModal = false"
  >
    <div
      class="md:w-[800px] p-6 bg-surface-2 rounded-[20px] border border-surface-3"
    >
      <div class="flex justify-between text-neutral-300">
        <div class="text-xl mb-6">Buy More credits</div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showBuyImageCreditsModal = false"
        />
      </div>

      <PricingPlan
        name="100 Image Credit Pack"
        :price="5"
        :features="['Generate 100 more images', 'No subscription required']"
        :price-id="imageCredit100PackPriceId"
      />
    </div>
  </ModalAlternate>
</template>
