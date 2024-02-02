<script lang="ts" setup>
import {
  PencilSquareIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';
import { PlusIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref, watch } from 'vue';
import {
  Campaign,
  CampaignMember,
  deleteCampaignMember,
  getCampaign,
  invitePlayerToCampaign,
  PublicAdventure,
  getCampaignCharacters,
} from '@/api/campaigns.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { getSessions, SessionBase, postSession } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import { getRpgSystems, RpgSystem } from '@/api/rpgSystems.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/lib/notifications';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { Character } from '@/api/characters';
import ModalAlternate from '@/components/ModalAlternate.vue';
import CharacterOverview from '../Characters/CharacterOverview.vue';
import { AxiosError } from 'axios';

const campaignStore = useCampaignStore();
const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();

const campaign = ref<Campaign>({} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);
const characters = ref<Character[]>([]);

const viewingCharacter = ref<Character>();
const viewCharacter = ref(false);
const showInviteModal = ref(false);
const showDeleteModal = ref(false);
const inviteLoading = ref(false);
const inviteEmail = ref('');

const currentUserRole = computed(() => campaignStore.selectedCampaignRole);

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
  sessions.value = [];

  await loadSessions();

  await loadRpgSystems();

  await loadCharacters();
}

watch(
  campaign,
  () => {
    loadAdventures();
  },
  { deep: true },
);

async function loadSessions() {
  const getSessionsResponse = await getSessions({
    ...sessionsSearch.value,
  });

  sessions.value = getSessionsResponse.data.data;
}

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

  return splitEmail(gm[0].user.email);
});

const latestSessionDuration = ref('N/A');
// const sessionAudio = ref(new Audio());

const latestSession = computed(() => {
  if (!sessions.value.length) {
    return null;
  }

  const latestCompleted = sessions.value.filter(
    (s: SessionBase) => s.completed,
  );
  if (!latestCompleted.length) {
    return null;
  }

  const latestSession = latestCompleted[0];

  if (latestSession.audioUri) {
    let audioUri = latestSession.audioUri;
    if (!latestSession.audioUri?.startsWith('https')) {
      audioUri = `https://${latestSession.audioUri}`;
    }
    const sessionAudio = new Audio(audioUri);
    sessionAudio.addEventListener('loadedmetadata', () => {
      var h = Math.floor(sessionAudio.duration / 3600);
      var m = Math.floor((sessionAudio.duration % 3600) / 60);
      latestSessionDuration.value = `${h}h ${m}m`;
    });
  }

  return latestSession;
});

async function handleCreateSession() {
  if (currentUserRole.value !== CampaignRole.DM) {
    alert('Only the GM of this campaign can create new sessions');
    return;
  }

  const createSessionResponse = await postSession({});

  showSuccess({ message: 'Session created!' });
  await router.push(`/sessions/${createSessionResponse.data.id}/planning`);
}

function campaignMemberName(campaignMemberId: number | undefined) {
  const member = campaign.value.members?.find((m) => m.id === campaignMemberId);
  if (!member) {
    return 'n/a';
  }
  return splitEmail(member.email);
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
    showSuccess({
      message: 'Invite sent successfully',
      context:
        'The invitation has been successfully sent. Once accepted, they will be visible in the list of party members.',
    });
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
</script>

<template>
  <div class="flex justify-between mb-6">
    <div>Overview</div>
    <div v-if="currentUserRole === CampaignRole.DM" class="flex">
      <router-link to="/campaign/edit" class="button-primary flex mr-2">
        <PencilSquareIcon class="h-5 w-5 mr-1" />
        Edit campaign
      </router-link>
      <router-link to="/campaigns/new" class="button-ghost flex">
        <PlusIcon class="h-5 w-5 mr-1" />
        Create new campaign
      </router-link>
    </div>
  </div>
  <div class="grid grid-cols-5 grid-rows-1 gap-4 mb-10">
    <div class="rounded-[18px] bg-surface-3 p-4 lg:h-[16em] col-span-3">
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
    <div class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] col-span-2">
      <div v-if="latestSession">
        <div class="grid grid-cols-4 relative">
          <img
            :src="latestSession?.imageUri"
            class="rounded-[12px] col-span-4 lg:col-span-1"
            alt="session img"
          />
          <div class="col-span-4 lg:col-span-3 lg:pl-4">
            <span
              class="px-2 py-1 bg-zinc-700 rounded-[12px] text-sm absolute top-2 left-2 lg:static"
            >
              Last session
            </span>
            <div class="mt-2 truncate">
              <router-link :to="`/sessions/${latestSession.id}/planning`">
                {{ latestSession.name }}
              </router-link>
            </div>
          </div>
        </div>
        <div class="py-4 text-neutral-400 text-sm flex">
          <div v-if="latestSession.audioUri" class="flex mr-4">
            <ClockIcon class="h-5 mr-1" />
            {{ latestSessionDuration }}
          </div>
          <div class="flex">
            <CalendarDaysIcon class="h-5 mr-1" />
            {{ format(new Date(latestSession.updatedAt), 'MMMM d, yyyy') }}
          </div>
        </div>
        <div class="text-neutral-500 h-[8em] lg:h-[6em] overflow-y-auto">
          {{ latestSession.summary }}
        </div>
      </div>
      <div v-else class="text-neutral-500 text-center py-[5em]">
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
  <div class="grid grid-cols-5 grid-rows-1 gap-4">
    <div class="col-span-2">
      <div class="mb-4">Campaign info</div>
      <div
        class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] text-neutral-500"
      >
        <div class="my-2">Game manager: {{ gm }}</div>
        <div class="my-2">Game system: {{ campaign.rpgSystemCode }}</div>
        <div class="my-2">
          Date started:
          {{
            campaign.createdAt
              ? format(new Date(campaign.createdAt), 'MMMM d, yyyy')
              : 'N/A'
          }}
        </div>
        <div class="my-2">
          Players count: {{ campaign.members?.length || 'N/A' }}
        </div>
        <div class="my-2">
          Last session:
          {{
            latestSession
              ? format(new Date(latestSession.updatedAt), 'MMMM d, yyyy')
              : 'N/A'
          }}
        </div>
      </div>
    </div>
    <div class="col-span-3">
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
            v-if="currentUserRole === CampaignRole.DM || true"
            class="button-primary flex"
            @click="showInviteModal = true"
          >
            <UserGroupIcon class="h-5 mr-1" />
            Add Players
          </button>
        </div>
      </div>
      <div class="rounded-[18px] bg-surface-3 p-4 col-span-2">
        <div
          v-for="member in campaign.members"
          :key="`${member.id}_member`"
          class="flex text-sm p-2 group justify-between min-h-[3.5em] whitespace-nowrap"
        >
          <div class="grid grid-cols-3 grow">
            <div
              class="self-center col-span-1"
              :class="{
                'text-white': member.user,
                'text-neutral-400': !member.user,
              }"
            >
              {{ splitEmail(member.user ? member.user.email : member.email) }}
            </div>
            <div class="text-neutral-400 px-4 self-center col-span-1">
              {{ member.role === 1 ? 'Game Master' : 'Player' }}
            </div>
            <div
              class="text-neutral-400 text-right self-center col-span-1 overflow-hidden"
            >
              {{ member.user ? 'Joined' : 'Invited' }} on
              {{
                format(
                  new Date(member.user ? member.joinedAt : member.createdAt),
                  'MMMM d, yyyy',
                )
              }}
            </div>
          </div>

          <div class="hidden group-hover:block pl-4">
            <button class="button-ghost py-1" @click="showDeleteModal = true">
              Kick Player
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="characters?.length" class="mb-8">
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
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer"
          @click="
            viewingCharacter = char;
            viewCharacter = true;
          "
        >
          <div class="relative">
            <img
              :src="char.imageUri"
              alt="character portrait"
              class="rounded-[20px]"
            />
            <div
              class="absolute top-1 left-1 rounded-full bg-white/50 text-black px-2"
            >
              {{ campaignMemberName(char.campaignMemberId) }}
            </div>
          </div>
          <div class="py-1 px-2 text-center">
            {{ char.name }}
          </div>
        </div>
      </div>
    </div>
    <ModalAlternate :show="viewCharacter" @close="viewCharacter = false">
      <div class="bg-surface-2 rounded-[20px] max-w-[75vw] p-6">
        <CharacterOverview
          v-if="viewingCharacter"
          :character="viewingCharacter"
          @close="viewCharacter = false"
        />
      </div>
    </ModalAlternate>
    <ModalAlternate :show="showInviteModal" @close="showInviteModal = false">
      <div class="md:w-[499px] p-6 bg-surface-2 rounded-[20px]">
        <img
          src="@/assets/icons/addPlayer.svg"
          alt="add player"
          class="h-14 mx-auto"
        />
        <div class="text-center text-white text-2xl my-4">Invite Player</div>
        <div class="text-center text-neutral-500 mb-4">
          Summon a fellow adventurer to join your epic tale!
        </div>

        <input
          v-model="inviteEmail"
          autofocus
          placeholder="Enter player email"
          class="input-primary"
          @keyup.enter="invitePlayer"
        />

        <div class="grid grid-cols-2 gap-4 mt-4">
          <button class="button-primary" @click="showDeleteModal = false">
            <span class="self-center"> Cancel </span>
          </button>

          <button class="button-white" @click="invitePlayer">
            <span v-if="!inviteLoading">Send Invitation</span>
            <span v-else class="self-center text-base animate-pulse"
              >Inviting...</span
            >
          </button>
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
