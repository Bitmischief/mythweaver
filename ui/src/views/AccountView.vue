<script lang="ts" setup>
import { useAuthStore } from '@/store/auth.store.ts';
import { patchCurrentUser } from '@/api/users.ts';
import { UserCircleIcon, CreditCardIcon } from '@heroicons/vue/24/outline';
import { ref, onMounted, computed } from 'vue';
import { showSuccess, showError } from '@/lib/notifications';
import { getBillingPortalUrl } from '@/api/billing.ts';
import Loader from '@/components/Core/Loader.vue';
import { format } from 'date-fns';
import PricingPlan from '@/components/Core/PricingPlan.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';

const store = useAuthStore();
const user = computed(() => store.user);
const tab = ref('billing');

const username = ref('');
const billingLoading = ref(false);
const showBuyImageCreditsModal = ref(false);
const imageCredit100PackPriceId = computed(
  () => import.meta.env.VITE_STRIPE_100_IMAGE_CREDITS_ID,
);

async function clickBilling() {
  billingLoading.value = true;
  const portalUrlResponse = await getBillingPortalUrl();
  location.href = portalUrlResponse.data;
}

onMounted(() => {
  username.value = user.value?.username ?? '';
});

const saveChangesLoading = ref(false);

async function saveChanges() {
  if (!store.user) {
    return;
  }

  try {
    saveChangesLoading.value = true;

    const req = {
      ...store.user,
      username: username.value,
    };

    await patchCurrentUser(req);
    await store.loadCurrentUser();

    showSuccess({ message: 'Your username has been updated!' });
  } catch (e) {
    showError({
      message: 'Something went wrong',
      context: 'Try again, or contact support if the problem persists.',
    });
  } finally {
    saveChangesLoading.value = false;
  }
}
</script>

<template>
  <div v-if="user" class="flex flex-col">
    <div class="text-lg text-neutral-200">Settings</div>
    <div class="py-4 flex">
      <div class="min-w-[14em]">
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
        </div>
      </div>
      <div class="mx-8 text-neutral-200 grow">
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
              </div>
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
            <div class="flex">
              <div
                class="bg-surface border border-surface-3 rounded-[12px] grow m-2 p-4 w-full md:w-[50%]"
              >
                <div class="text-sm text-neutral-400">Current Subscription</div>
                <div class="text-3xl my-2 flex">
                  <div>Mythweaver</div>
                  <div
                    class="self-center mx-2 px-2 skew-x-[-20deg] rounded-tl-[5px] rounded-br-[5px]"
                    :class="{
                      'bg-gradient-to-r from-orange-500 to-orange-600 ':
                        user.earlyAccessExempt,
                      'bg-slate-500': user.plan === 'FREE',
                      'bg-fuchsia-500': user.plan === 'BASIC',
                      'bg-gradient-to-r from-fuchsia-500 to-violet-500':
                        user.plan === 'PRO',
                    }"
                  >
                    {{
                      user.earlyAccessExempt
                        ? 'EA'
                        : !user.plan
                          ? 'FREE'
                          : user.plan
                    }}
                  </div>
                </div>
                <div v-if="!user.earlyAccessExempt" class="mt-6 w-full">
                  <button
                    v-if="user.plan && user.plan !== 'FREE'"
                    class="button-ghost-white mr-2"
                    :disabled="billingLoading"
                    @click="clickBilling"
                  >
                    Manage Subscription
                  </button>
                  <button
                    v-if="user.plan"
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
                  <span
                    v-if="user.earlyAccessExempt"
                    class="text-bold self-center mr-2"
                  >
                    <img
                      src="@/assets/icons/infinity-lg.png"
                      alt="infinity"
                      class="h-14"
                    />
                  </span>
                  <span v-else class="text-bold text-4xl">
                    {{ user.imageCredits }}
                  </span>
                  <span class="text-lg text-neutral-400 pt-1 px-1 self-center">
                    images
                  </span>
                </div>

                <div v-if="!user.earlyAccessExempt" class="mt-6 w-full">
                  <button
                    v-if="user.plan"
                    class="button-ghost-white mr-2"
                    @click="showBuyImageCreditsModal = true"
                  >
                    Add more image credits
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="user.subscriptionPaidThrough || user.earlyAccessExempt"
            class="p-4 rounded-[12px] bg-surface-2 border border-surface-3 mt-6"
          >
            <div class="text-lg">Billing Information</div>
            <div
              v-if="user.earlyAccessExempt"
              class="text-sm text-neutral-500 my-2"
            >
              You are currently in early access
            </div>
            <div
              v-else-if="user.subscriptionPaidThrough"
              class="flex justify-between"
            >
              <div class="text-sm text-neutral-500 my-2">
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
        <div class="text-xl mb-6">Buy More Image Credits</div>
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
