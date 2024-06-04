<script lang="ts" setup>
import {
  PencilSquareIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  Square2StackIcon,
} from '@heroicons/vue/24/outline';
import { PlusIcon, SparklesIcon, XCircleIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref } from 'vue';
import {
  Campaign,
  CampaignMember,
  deleteCampaignMember,
  getCampaign,
  getCampaignCharacters,
} from '@/api/campaigns.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { getSessions, SessionBase, postSession } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/lib/notifications';
import { Character } from '@/api/characters';
import ModalAlternate from '@/components/ModalAlternate.vue';
import CharacterOverview from '../Characters/CharacterOverview.vue';
import { AxiosError } from 'axios';
import { useCurrentUserRole } from '@/lib/hooks.ts';
import { useAuthStore } from '@/store';
import { useClipboard } from '@vueuse/core';
import ViewRelationships from '@/components/Relationships/ViewRelationships.vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';

const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();
const authStore = useAuthStore();

const campaign = ref<Campaign>({} as Campaign);
const characters = ref<Character[]>([]);

const viewingCharacter = ref<Character>();
const viewCharacter = ref(false);
const showInviteModal = ref(false);
const showDeleteModal = ref(false);
const latestSession = ref<SessionBase>();

const currentUserRole = useCurrentUserRole();
const currentUser = computed(() => authStore.user);

const { copy, copied, isSupported } = useClipboard();

const sessionsSearch = ref<{
  offset: number;
  limit: number;
  archived: boolean | undefined;
}>({
  offset: 0,
  limit: 25,
  archived: undefined,
});
const sessions = ref<SessionBase[]>([]);

onMounted(async () => {
  if (!selectedCampaignId.value) {
    await router.push('/campaigns/new');
  }

  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

async function init() {
  if (selectedCampaignId.value) {
    const getCampaignResponse = await getCampaign(selectedCampaignId.value);
    campaign.value = getCampaignResponse.data;
    sessions.value = [];

    await loadSessions();
    await loadCharacters();
  }
}

async function loadSessions() {
  const getSessionsResponse = await getSessions({
    ...sessionsSearch.value,
  });

  sessions.value = getSessionsResponse.data.data;

  loadLatestSession();
}

async function loadCharacters() {
  const response = await getCampaignCharacters(campaign?.value.id || 0);
  characters.value = response.data;
}

function splitEmail(email: string) {
  return email?.substring(0, email.indexOf('@')) || 'N/A';
}

const gm = computed(() => {
  const members = campaign.value.members;
  if (!members) {
    return 'N/A';
  }

  const gm = members.filter((m: CampaignMember) => m.role === 1);
  if (!gm.length) {
    return 'N/A';
  }

  if (gm[0].user.username) {
    return gm[0].user.username;
  }

  return splitEmail(gm[0].user.email);
});

const latestSessionDuration = ref('N/A');
const latestSessionDate = ref('');

const loadLatestSession = () => {
  if (!sessions.value.length) {
    return null;
  }

  const completed = sessions.value.filter((s: SessionBase) => s.completed);

  if (!completed.length) {
    return null;
  }

  const latestCompleted = completed.sort(function (a, b) {
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  })[0];

  if (latestCompleted.audioUri) {
    let audioUri = latestCompleted.audioUri;
    if (!latestCompleted.audioUri?.startsWith('https')) {
      audioUri = `https://${latestCompleted.audioUri}`;
    }
    const sessionAudio = new Audio(audioUri);
    sessionAudio.addEventListener('loadedmetadata', () => {
      var h = Math.floor(sessionAudio.duration / 3600);
      var m = Math.floor((sessionAudio.duration % 3600) / 60);
      latestSessionDuration.value = `${h}h ${m}m`;
    });
  }
  if (latestCompleted.date) {
    latestSessionDate.value = format(
      latestCompleted.date,
      'MMM d, yyyy @ h:mm a',
    );
  }

  latestSession.value = latestCompleted;
};

async function handleCreateSession() {
  if (currentUserRole.value !== CampaignRole.DM) {
    alert('Only the GM of this campaign can create new sessions');
    return;
  }

  const createSessionResponse = await postSession({});

  showSuccess({ message: 'Session created!' });
  await router.push(`/sessions/${createSessionResponse.data.id}`);
}

function campaignMemberName(campaignMemberId: number | undefined) {
  const member = campaign.value.members?.find((m) => m.id === campaignMemberId);
  if (!member) {
    return 'n/a';
  }

  if (member.user?.username) {
    return member.user?.username;
  }

  const email = member.user?.email ? member.user.email : member.email;
  return splitEmail(email);
}

function campaignMemberEmail(campaignMemberId: number | undefined) {
  const member = campaign.value.members?.find((m) => m.id === campaignMemberId);
  if (!member) {
    return;
  }
  return member.user?.email;
}

const requestedRemovedMemberId = ref<number | null>(null);
const removeMemberLoading = ref(false);

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

const inviteLink = computed(() => {
  return `${window.location.origin}/invite?code=${campaign.value.inviteCode}`;
});

async function handleCreateRelationship() {
  eventBus.$emit('create-relationship', {
    relationshipType: ConjurationRelationshipType.CONJURATION,
    nodeId: selectedCampaignId.value,
    nodeType: ConjurationRelationshipType.CAMPAIGN,
  });
}
</script>

<template>
  <div class="flex justify-between mb-6">
    <div class="self-center text-xl">Overview</div>
    <div v-if="currentUserRole === CampaignRole.DM" class="flex">
      <router-link to="/campaign/edit" class="button-ghost flex mr-2">
        <PencilSquareIcon class="h-5 w-5 mr-1" />
        Edit campaign
      </router-link>
    </div>
  </div>
  <div
    class="grid grid-cols-1 lg:grid-cols-6 grid-rows-1 gap-y-4 lg:gap-4 mb-4"
  >
    <div class="rounded-[18px] bg-surface-3 p-4 col-span-3 h-full mt-4">
      <div class="text-lg mb-2">
        {{ campaign.name }}
      </div>
      <div
        v-if="campaign.description"
        class="text-sm text-neutral-400 lg:max-h-[14em] overflow-y-auto"
      >
        {{ campaign.description }}
      </div>
      <div v-else class="text-neutral-500 text-center py-[3em]">
        This campaign does not have a description
        <div
          v-if="currentUserRole === CampaignRole.DM"
          class="flex justify-around mt-4"
        >
          <router-link to="/campaign/edit" class="button-ghost flex mr-2">
            <PencilSquareIcon class="h-5 w-5 mr-1" />
            Edit campaign
          </router-link>
        </div>
      </div>
    </div>
    <div class="flex rounded-[18px] bg-surface-3 p-4 col-span-3 h-full mt-4">
      <div v-if="latestSession" class="flex flex-col">
        <div class="text-lg mb-2 flex gap-2">
          <div>Last Session</div>
          <div class="text-neutral-500 text-sm md:text-lg self-center">
            | {{ latestSessionDate }}
          </div>
        </div>
        <div class="flex gap-2 relative grow">
          <div class="basis-1/3 flex flex-col justify-center">
            <img
              :src="
                latestSession?.images?.find((i) => i.primary)?.uri ||
                '/images/session_bg_square.png'
              "
              class="rounded-[12px]"
              alt="session img"
            />
          </div>
          <div class="basis-2/3 lg:pl-4 flex flex-col">
            <div class="text-neutral-200 group/sessionName flex gap-2">
              <div class="text-lg truncate underline">
                <router-link :to="`/sessions/${latestSession.id}`">
                  {{ latestSession.name }}
                </router-link>
              </div>
              <div class="hidden group-hover/sessionName:block self-center">
                <ArrowRightIcon class="h-5" />
              </div>
            </div>
            <div
              v-if="latestSession.audioUri"
              class="text-neutral-400 text-sm flex py-2 mr-4"
            >
              <ClockIcon class="h-5 mr-1" />
              {{ latestSessionDuration }}
            </div>
            <div
              class="text-neutral-400 text-sm grow max-h-[12em] overflow-y-auto"
            >
              {{ latestSession.recap }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-neutral-500 text-center w-full my-auto">
        This campaign has no completed sessions
        <div
          v-if="currentUserRole === CampaignRole.DM"
          class="flex justify-around mt-4"
        >
          <button class="button-ghost flex mr-2" @click="handleCreateSession">
            <PlusIcon class="h-5 w-5 mr-1" />
            Create Session
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="lg:grid lg:grid-cols-5 grid-rows-1 lg:gap-4 mb-10">
    <div class="lg:col-span-2 mt-4">
      <div class="flex flex-col">
        <div class="flex justify-between mb-4">
          <div class="flex">
            <div class="mr-1 self-center leading-9">Campaign Info</div>
          </div>
        </div>
        <div
          class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] text-neutral-500 grow"
        >
          <div class="my-2">
            Game manager: <span class="text-neutral-300">{{ gm }}</span>
          </div>
          <div class="my-2">
            Game system:
            <span class="text-neutral-300">{{ campaign.rpgSystemCode }}</span>
          </div>
          <div class="my-2">
            Date started:
            <span class="text-neutral-300">
              {{
                campaign.createdAt
                  ? format(
                      new Date(campaign.createdAt.toString()),
                      'MMM d, yyyy',
                    )
                  : 'No Start Date'
              }}
            </span>
          </div>
          <div class="my-2">
            Players count:
            <span class="text-neutral-300">{{
              campaign.members?.length || 'No Members'
            }}</span>
          </div>
          <div class="my-2">
            Last session:
            <span class="text-neutral-300">
              {{ latestSessionDate }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-3 mt-4">
      <div class="flex flex-col">
        <div class="flex justify-between mb-4">
          <div class="flex">
            <div class="mr-1 self-center">Party members</div>
            <div
              class="text-xs bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full px-2 py-1 h-6 self-center"
            >
              {{ campaign.members?.length }}
            </div>
          </div>
          <div>
            <button
              v-if="currentUserRole === CampaignRole.DM"
              class="button-primary flex"
              @click="showInviteModal = true"
            >
              <UserGroupIcon class="h-5 mr-1" />
              Invite Players
            </button>
          </div>
        </div>
        <div class="rounded-[18px] bg-surface-3 p-4 col-span-2 grow">
          <div
            v-for="member in campaign.members"
            :key="`${member.id}_member`"
            class="md:flex text-sm p-2 group justify-between min-h-[3.5em] whitespace-nowrap border-b border-neutral-700"
            :class="{
              'bg-fuchsia-500/10 rounded-[12px]':
                currentUser?.email === member.user?.email,
            }"
          >
            <div class="grid md:grid-cols-3 grow">
              <div
                class="self-center col-span-1 truncate flex gap-1"
                :class="{
                  'text-white': member.user,
                  'text-neutral-400': !member.user,
                }"
              >
                <SparklesIcon
                  v-if="currentUser?.email === member.user?.email"
                  class="h-5 text-fuchsia-500/50"
                />
                {{
                  member.user?.username ??
                  splitEmail(member.user ? member.user.email : member.email)
                }}
              </div>
              <div class="text-neutral-400 md:px-4 self-center col-span-1">
                <span class="text-white md:hidden">Role: </span>
                {{ member.role === 1 ? 'GM' : 'Player' }}
              </div>
              <div
                class="text-neutral-400 text-left md:text-right self-center col-span-1 truncate"
              >
                <span class="text-white">{{
                  member.user ? 'Joined ' : 'Invited '
                }}</span>
                {{
                  format(
                    new Date(member.user ? member.joinedAt : member.createdAt),
                    'MMMM dd, yyyy',
                  )
                }}
              </div>
            </div>
            <div
              v-if="
                currentUserRole === CampaignRole.DM &&
                member.role != CampaignRole.DM
              "
              class="md:hidden md:pl-4 mt-4 md:mt-0 group-hover:block"
            >
              <button
                class="button-ghost py-1"
                @click="
                  requestedRemovedMemberId = member.id;
                  showDeleteModal = true;
                "
              >
                Kick Player
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="characters?.length" class="mb-8 mt-4 col-span-5">
      <div class="flex mb-4">
        <div class="mr-1">Characters</div>
        <div
          class="text-xs bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full px-2 py-1"
        >
          {{ characters.length }}
        </div>
      </div>
      <div class="flex overflow-x-auto">
        <div
          v-for="(char, i) in characters"
          :key="`char_${i}`"
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer min-w-[10em] max-w-[15em] mr-6 overflow-hidden"
          @click="
            viewingCharacter = char;
            viewCharacter = true;
          "
        >
          <div class="relative">
            <img
              :src="char.images?.find((i) => i.primary)?.uri"
              alt="character portrait"
              class="rounded-[20px]"
            />
            <div
              class="absolute top-1 left-1 max-w-[95%] rounded-full bg-white/50 text-black px-1 truncate flex"
            >
              <SparklesIcon
                v-if="
                  currentUser?.email ===
                  campaignMemberEmail(char.campaignMemberId)
                "
                class="h-5 text-fuchsia-500/75 self-center"
              />
              {{ campaignMemberName(char.campaignMemberId) }}
            </div>
          </div>
          <div class="py-1 px-2 text-center truncate">
            {{ char.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-5">
      <div class="flex gap-2 justify-between mb-2">
        <div class="text-xl">Campaign Relationships</div>
        <button class="button-gradient" @click="handleCreateRelationship">
          Add Relationships
        </button>
      </div>
      <ViewRelationships
        :start-node-id="selectedCampaignId"
        :start-node-type="ConjurationRelationshipType.CAMPAIGN"
      />
    </div>
    <ModalAlternate :show="viewCharacter" @close="viewCharacter = false">
      <div class="bg-surface-2 rounded-[20px] md:max-w-[75vw]">
        <CharacterOverview
          v-if="viewingCharacter"
          :character="viewingCharacter"
          @close="viewCharacter = false"
        />
      </div>
    </ModalAlternate>
    <ModalAlternate :show="showInviteModal" @close="showInviteModal = false">
      <div class="w-[95vw] md:w-[50vw] p-6 bg-surface-2 rounded-[20px]">
        <div class="flex justify-end">
          <button @click="showInviteModal = false">
            <span class="self-center">
              <XCircleIcon class="h-5 w-5" />
            </span>
          </button>
        </div>
        <img
          src="@/assets/icons/addPlayer.svg"
          alt="add player"
          class="h-14 mx-auto"
        />
        <div class="text-center text-white text-2xl my-4">Invite Players</div>

        <div class="text-center border rounded-[20px] p-4 border-neutral-700">
          <div class="text-sm text-neutral-500 mb-2">
            Your players can join this campaign using this invite link
          </div>
          <div class="text-lg text-neutral-200 flex justify-center gap-2">
            <div class="self-center">
              {{ inviteLink }}
            </div>
            <div
              v-if="isSupported"
              class="relative group/copy-link hover:cursor-pointer"
              @click="copy(inviteLink)"
            >
              <Square2StackIcon
                class="w-8 h-8 self-center text-neutral-500 group-active/copy-link:text-fuchsia-500 group-active/copy-link:fill-fuchsia-600"
              />
              <div
                class="tooltip-top hidden group-hover/copy-link:block"
                :class="{ 'bg-fuchsia-800': copied }"
              >
                <span v-if="copied">Link Copied!</span>
                <span v-else>Copy link</span>
                <div class="tooltip-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalAlternate>
    <ModalAlternate :show="showDeleteModal" @close="showDeleteModal = false">
      <div class="md:w-[499px] p-6 bg-surface-2 rounded-[20px]">
        <img
          src="@/assets/icons/kickPlayer.svg"
          alt="kick player"
          class="h-14 mx-auto"
        />
        <div class="text-center text-white text-2xl my-4">Kick Player?</div>

        <div class="text-center text-neutral-500 mb-4">
          This will remove this player from your campaign. You can always
          re-invite them.
        </div>

        <div class="grid grid-cols-2 gap-4">
          <button class="button-primary" @click="showDeleteModal = false">
            <span class="self-center"> Cancel </span>
          </button>

          <button class="button-white" @click="handleRemoveMember">
            <span v-if="!removeMemberLoading">Kick Player</span>
            <span v-else class="self-center text-base animate-pulse"
              >Removing...</span
            >
          </button>
        </div>
      </div>
    </ModalAlternate>
  </div>
</template>
