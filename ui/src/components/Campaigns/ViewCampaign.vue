<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  Campaign,
  CampaignRole,
  deleteCampaignMember,
  getCampaign,
  invitePlayerToCampaign,
  PublicAdventure,
} from '@/api/campaigns.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { getRpgSystems, RpgSystem } from '@/api/rpgSystems.ts';
import Select from '@/components/Core/Forms/Select.vue';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { format } from 'date-fns';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosError } from 'axios';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const campaignStore = useCampaignStore();
const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();

const campaign = ref<Campaign>({} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);
const showInviteModal = ref(false);
const inviteLoading = ref(false);
const inviteEmail = ref('');
const showDeleteModal = ref(false);

const currentUserRole = computed(() => campaignStore.selectedCampaignRole);

onMounted(async () => {
  if (!selectedCampaignId.value) {
    router.push('/campaigns/new');
  }

  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

async function init() {
  const getCampaignResponse = await getCampaign(selectedCampaignId.value || 0);
  campaign.value = getCampaignResponse.data;

  await loadRpgSystems();
}

watch(
  campaign,
  () => {
    loadAdventures();
  },
  { deep: true },
);

function loadAdventures() {
  const rpgSystem = rpgSystems.value.find(
    (s) => s.code === campaign.value?.rpgSystemCode,
  );

  if (rpgSystem) {
    adventures.value = rpgSystem.publicAdventures ?? [];
  }
}

async function loadRpgSystems() {
  const rpgSystemsResponse = await getRpgSystems({
    offset: 0,
    limit: systemsLimit.value,
  });
  rpgSystems.value = rpgSystemsResponse.data.data;

  loadAdventures();
}

async function handleSaveCampaign() {
  if (!campaign.value) {
    return;
  }

  try {
    await campaignStore.saveCampaign({
      campaignId: selectedCampaignId.value || 0,
      name: campaign.value.name,
      description: campaign.value.description,
      imageUri: campaign.value.imageUri,
      rpgSystemCode: campaign.value.rpgSystemCode,
      publicAdventureCode: campaign.value.publicAdventureCode,
    });

    showSuccess({ message: 'Campaign saved!' });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }
}

async function handleDeleteCampaign() {
  if (!campaign.value) {
    return;
  }

  try {
    await campaignStore.deleteCampaign(selectedCampaignId.value || 0);
    showSuccess({ message: 'Campaign deleted!' });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }
}

async function invitePlayer() {
  if (!inviteEmail.value) {
    return;
  }

  try {
    inviteLoading.value = true;
    await invitePlayerToCampaign(
      inviteEmail.value,
      selectedCampaignId.value || 0,
    );
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }

  await init();
  inviteLoading.value = false;
  showInviteModal.value = false;
}

async function handleRemoveMember() {
  try {
    removeMemberLoading.value = true;
    await deleteCampaignMember(
      selectedCampaignId.value || 0,
      requestedRemovedMemberId.value || 0,
    );
    await init();
    showDeleteModal.value = false;
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  } finally {
    removeMemberLoading.value = false;
  }
}

const requestedRemovedMemberId = ref<number | null>(null);
const removeMemberLoading = ref(false);
function handleRequestRemoveMember(memberId: number) {
  showDeleteModal.value = true;
  requestedRemovedMemberId.value = memberId;
}
</script>

<template>
  <div v-if="campaign">
    <div class="flex w-full justify-between rounded-xl py-4">
      <div class="w-full flex justify-between">
        <div>
          <router-link class="flex button-primary mr-2" to="/campaign/overview">
            <ArrowLeftIcon class="h-4 mr-1" />
            <span class="self-center">Back to overview</span>
          </router-link>
        </div>

        <div class="mt-2 self-center md:mt-0 flex justify-between">
          <button
            v-if="currentUserRole === CampaignRole.DM"
            class="button-ghost mr-2"
            @click="handleSaveCampaign"
          >
            <span class="self-center">Save</span>
          </button>

          <button
            v-if="currentUserRole === CampaignRole.DM"
            class="button-primary"
            @click="handleDeleteCampaign"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">Campaign Name</div>

    <input
      v-model="campaign.name"
      :readonly="currentUserRole !== CampaignRole.DM"
      class="input-primary"
      placeholder="Flight of the Valkyries"
    />

    <div class="mt-8 text-gray-400 text-sm ml-1 mb-1">Roleplaying System</div>

    <Select
      v-model="campaign.rpgSystemCode"
      :readonly="currentUserRole !== CampaignRole.DM"
      :options="rpgSystems"
      value-prop="code"
      display-prop="name"
    />

    <template v-if="campaign.rpgSystemCode === 'other'">
      <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">
        Please describe your campaign's universe and atmosphere in a few words?
      </div>

      <div class="text-xs mt-2 p-2 text-gray-400">
        We use this information to help generating contextually appropriate
        content for your campaign.

        <div class="mt-1 text-xs text-gray-400">
          For example, a sci-fi campaign might have the keywords
          <div class="mt-1 flex">
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">sci-fi</div>
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">space</div>
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">futuristic</div>
          </div>
        </div>
      </div>
    </template>

    <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">Campaign Source</div>

    <Select
      v-model="campaign.publicAdventureCode"
      :readonly="currentUserRole !== CampaignRole.DM"
      :options="adventures"
      value-prop="code"
      display-prop="name"
      allow-none
    />

    <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">Campaign Description</div>

    <textarea
      v-model="campaign.description"
      :readonly="currentUserRole !== CampaignRole.DM"
      class="input-primary"
      placeholder="As ancient evils awaken and long-buried secrets resurface, heroes must rise to restore balance in a world on the brink of chaos..."
      rows="8"
    />

    <div class="mt-12 border-t border-gray-500/25 py-4">
      <div class="flex justify-between">
        <div class="text-2xl">Party Members</div>
        <button
          v-if="currentUserRole === CampaignRole.DM"
          class="border-purple-300 border p-2 rounded-xl transition-all hover:scale-110"
          @click="showInviteModal = true"
        >
          Invite
        </button>

        <ModalAlternate
          :show="showInviteModal"
          @close="showInviteModal = false"
        >
          <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
            <div class="text-center text-white text-[26px] font-bold">
              Invite Player
            </div>
            <div
              class="text-center w-full text-zinc-500 text-sm font-normal leading-[25px]"
            >
              Summon a fellow adventurer to join your epic tale!
            </div>

            <div
              class="mt-6 text-white text-[17px] w-full text-center font-medium leading-[29px]"
            >
              What email address should we use to invite them?
            </div>

            <input
              v-model="inviteEmail"
              autofocus
              placeholder="email@email.com"
              class="mt-2 w-full px-4 h-[60px] bg-zinc-950 rounded-[10px] border border-neutral-800"
              @keyup.enter="invitePlayer"
            />
            <button
              class="mt-4 mx-auto w-full h-[60px] px-[13px] py-[20.50px] bg-gradient-to-r from-fuchsia-500 to-blue-400 rounded-lg justify-center items-start gap-[5px] inline-flex"
              @click="invitePlayer"
            >
              <span v-if="!inviteLoading" class="text-white text-base font-bold"
                >Send Invite</span
              >
              <span v-else class="text-white text-base font-bold animate-pulse"
                >Inviting...</span
              >
            </button>
          </div>
        </ModalAlternate>
      </div>

      <div class="mt-6">
        <div
          v-for="member of campaign.members"
          :key="member.id"
          class="bg-surface-2 mb-2 rounded-xl p-3"
        >
          <div class="flex justify-between group">
            <div>
              <div
                class="text-lg"
                :class="{
                  'text-gray-300': member.user,
                  'text-blue-300': !member.user,
                }"
              >
                {{ member.user ? member.user.email : member.email }}
              </div>

              <div
                class="text-sm"
                :class="{
                  'text-gray-500': member.user,
                  'text-blue-300': !member.user,
                }"
              >
                {{
                  member.user
                    ? member.role === 1
                      ? 'Dungeon Master'
                      : 'Player'
                    : 'Invited'
                }}
              </div>
            </div>

            <div class="flex">
              <div
                class="text-sm text-gray-500 self-center"
                :class="{
                  'text-gray-300': member.user,
                  'text-blue-300': !member.user,
                }"
              >
                {{ member.user ? 'Joined' : 'Invited' }} on
                {{
                  format(
                    new Date(member.user ? member.joinedAt : member.createdAt),
                    'MMMM d, yyyy',
                  )
                }}
              </div>

              <div
                v-if="member.role !== 1 && currentUserRole === CampaignRole.DM"
                class="w-[0] group-hover:w-20 transition-all duration-200 self-center group-hover:ml-2 group-hover:delay-0 delay-100 ease-in overflow-x-hidden"
              >
                <button
                  class="rounded-xl bg-red-500 p-2"
                  @click="handleRequestRemoveMember(member.id)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ModalAlternate :show="showDeleteModal" @close="showDeleteModal = false">
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="text-center text-white text-[26px] font-bold">
        Are you sure?
      </div>

      <div class="text-center text-xl text-gray-500 mb-4">
        This will remove this player from your campaign. You can always
        re-invite them.
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          class="mx-auto flex w-full h-[60px] px-[13px] py-[20.50px] bg-gradient-to-r from-fuchsia-500 to-blue-400 rounded-lg justify-center items-start gap-[5px] inline-flex"
          @click="showDeleteModal = false"
        >
          <span class="self-center"> Nevermind </span>
        </button>

        <button
          class="mx-auto w-full h-[60px] flex px-[13px] py-[20.50px] bg-none border border-red-500 rounded-lg justify-center items-start gap-[5px] inline-flex"
          @click="handleRemoveMember"
        >
          <span
            v-if="!removeMemberLoading"
            class="text-white text-base self-center"
            >Remove Player</span
          >
          <span v-else class="text-white self-center text-base animate-pulse"
            >Removing...</span
          >
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
