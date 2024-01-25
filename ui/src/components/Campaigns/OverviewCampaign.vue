<script lang="ts" setup>
import { PencilSquareIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { PlusIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref, watch } from 'vue';
import {
  Campaign,
  CampaignMember,
  getCampaign,
  PublicAdventure,
} from '@/api/campaigns.ts';
import { getSessions, SessionBase } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import { getRpgSystems, RpgSystem } from '@/api/rpgSystems.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';


const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();

const campaign = ref<Campaign>({} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);

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

function splitEmail(email: string) {
    return email.substring(0, email.indexOf('@'));
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
})

const latestSessionDuration = ref('N/A');
const sessionAudio = ref(new Audio());

const latestSession = computed(() => {
    if (!sessions.value.length) {
        return null;
    }

    const latestCompleted = sessions.value.filter((s: SessionBase) => s.completed);
    if(!latestCompleted.length) {
        return null;
    }

    const latestSession = latestCompleted[0];

    if (latestSession.audioUri) {
        let audioUri = latestSession.audioUri;
        if (!latestSession.audioUri?.startsWith('https')) {
            audioUri = `https://${latestSession.audioUri}`;
        }
        sessionAudio.value = new Audio(audioUri);
        sessionAudio.value.addEventListener('loadedmetadata', () => {
            var h = Math.floor(sessionAudio.value.duration / 3600);
            var m = Math.floor(sessionAudio.value.duration % 3600 / 60);
            latestSessionDuration.value = `${h}h ${m}m`;
        })
    }

    return latestSession;
})
</script>

<template>
    <div class="flex justify-between mb-6">
        <div>Overview</div>
        <div class="flex">
            <button class="button-primary flex mr-2">
                <PencilSquareIcon class="h-5 w-5 mr-1" />
                Edit campaign
            </button>
            <button class="button-ghost flex">
                <PlusIcon class="h-5 w-5 mr-1" />
                Create new campaign
            </button>
        </div>
    </div>
    <div class="grid grid-cols-5 grid-rows-1 gap-4 mb-10">
        <div class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] col-span-3">
            <div class="text-lg mb-2">
                {{ campaign.name }}
            </div>
            <div v-if="campaign.description" class="text-sm text-neutral-400">
                {{ campaign.description }}
            </div>
            <div v-else class="text-neutral-500 text-center py-[3em]">
                Edit your campaign to add a description
            </div>
        </div>
        <div class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] col-span-2">
            <div v-if="latestSession">
                <div class="flex">
                    <img :src="latestSession?.imageUri" class="h-14 rounded-[12px]" alt="session img" />
                    <div class="px-4">
                        <span class="px-4 py-1 bg-zinc-700 rounded-[12px] text-sm">Last session</span>
                        <div class="mt-2">{{ latestSession.name }}</div>
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
                <div class="text-neutral-500 max-h-[4.5em] overflow-hidden">
                    {{ latestSession.summary }}
                </div>
            </div>
            <div v-else class="text-neutral-500 text-center py-[5em]">
                Looks like you don't have any completed sessions yet
            </div>
        </div>
    </div>
    <div class="grid grid-cols-5 grid-rows-1 gap-4">
        <div class="col-span-2">
            <div class="mb-4">
                Campaign info
            </div>
            <div class="rounded-[18px] bg-surface-3 p-4 min-h-[10em] text-neutral-500">
                <div class="my-2">
                    Game manager: {{ gm }}
                </div>
                <div class="my-2">
                    Game system: {{ campaign.rpgSystemCode }}
                </div>
                <div class="my-2">
                    Date started: {{ campaign.createdAt ? format( new Date(campaign.createdAt), 'MMMM d, yyyy') : 'N/A' }}
                </div>
                <div class="my-2">
                    Players count: {{ campaign.members?.length || 'N/A' }}
                </div>
                <div class="my-2">
                    Last session: {{ latestSession ? format(new Date(latestSession.updatedAt), 'MMMM d, yyyy') : 'N/A' }}
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="flex mb-4">
                <div class="mr-1">
                    Party members
                </div>
                <div class="text-xs bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full px-2 py-1">
                    {{ campaign.members?.length }}
                </div>
            </div>
            <div class="rounded-[18px] bg-surface-3 p-4 col-span-2">
                <div v-for="member in campaign.members" class="grid grid-cols-3 text-sm p-2">
                    <div :class="{
                        'text-white': member.user,
                        'text-neutral-400': !member.user,
                        }">
                        {{ splitEmail(member.user ? member.user.email : member.email) }}
                    </div>
                    <div class="text-neutral-400">
                        {{
                            member.role === 1
                                ? 'Game Master'
                                : 'Player'
                        }}
                    </div>
                    <div class="text-neutral-400 text-right">
                        {{ member.user ? 'Joined' : 'Invited' }} on
                        {{
                            format(
                                new Date(member.user ? member.joinedAt : member.createdAt),
                                'MMMM d, yyyy',
                            )
                        }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>