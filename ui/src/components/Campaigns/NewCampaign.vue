<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/24/outline";
import { Campaign, createCampaign, PublicAdventure } from "@/api/campaigns.ts";
import { onMounted, ref } from "vue";
import { getAdventures, getRpgSystems, RpgSystem } from "@/api/rpgSystems.ts";
import { useRouter } from "vue-router";
import { showSuccess } from "@/lib/notifications.ts";
import { CAMPAIGN_CREATED_EVENT, useEventBus } from "@/lib/events.ts";

const router = useRouter();
const eventBus = useEventBus();

const campaign = ref<Campaign>({} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(4);

onMounted(async () => {
  await loadRpgSystems();
});

async function loadRpgSystems() {
  const rpgSystemsResponse = await getRpgSystems({
    offset: 0,
    limit: systemsLimit.value,
  });
  rpgSystems.value = rpgSystemsResponse.data.data;
}

async function setRpgSystemsLimit(limit: number) {
  systemsLimit.value = limit;
  await loadRpgSystems();
}

async function chooseRpgSystem(id: number) {
  campaign.value.rpgSystemId = id;
  await loadAdventures();
}

async function loadAdventures() {
  const adventuresResponse = await getAdventures({
    rpgSystemId: campaign.value.rpgSystemId,
    offset: 0,
    limit: 7,
  });
  adventures.value = adventuresResponse.data.data;
}

async function chooseAdventure(id: number | null | undefined) {
  campaign.value.publicAdventureId = id;
}

async function handleCreateCampaign() {
  campaign.value.name =
    adventures.value.find((a) => a.id === campaign.value.publicAdventureId)
      ?.name ??
    rpgSystems.value.find((s) => s.id === campaign.value.rpgSystemId)?.name ??
    "";

  eventBus.$emit(CAMPAIGN_CREATED_EVENT, undefined);
  await createCampaign(campaign.value);
  showSuccess({ message: "Campaign created!" });
  await router.push("/characters");
}
</script>

<template>
  <div class="">
    <div class="mt-8 text-xl">Roleplaying System</div>
    <div class="mt-2 text-lg text-gray-400">What system are you using?</div>

    <div class="mt-8 grid grid-cols-3 gap-6 3xl:grid-cols-5">
      <div
        v-for="rpgSystem in rpgSystems"
        :key="rpgSystem.id"
        class="cursor-pointer rounded-xl p-3 hover:bg-slate-800"
        :class="{ 'bg-slate-800': campaign.rpgSystemId === rpgSystem.id }"
        @click="chooseRpgSystem(rpgSystem.id)"
      >
        <div class="flex flex-col items-center">
          <img
            :src="`/images/rpgsystems/${rpgSystem.imageUri}`"
            class="h-60 rounded-lg object-cover"
            alt=""
          />
          <div class="mt-2 text-2xl text-gray-200">{{ rpgSystem.name }}</div>
          <div class="mt-1 text-lg text-gray-400">{{ rpgSystem.version }}</div>
        </div>
      </div>

      <div
        class="cursor-pointer rounded-xl p-3 hover:bg-slate-800"
        @click="chooseRpgSystem(52)"
      >
        <div class="flex flex-col items-center">
          <img
            src="/images/rpgsystems/other.png"
            class="h-60 rounded-lg object-cover"
            alt=""
          />
          <div class="mt-2 text-2xl text-gray-200">Other</div>
        </div>
      </div>
    </div>

    <div
      class="mt-6 w-[22rem] cursor-pointer rounded-xl border-2 border-slate-800 bg-surface-2 p-4 text-center shadow-lg"
      @click="setRpgSystemsLimit(999)"
    >
      Show All Roleplaying Systems
    </div>

    <template v-if="campaign.rpgSystemId">
      <div class="mt-8 text-xl">Adventure</div>
      <div class="mt-2 text-lg text-gray-400">
        Are you playing an official campaign/adventure?
      </div>

      <div class="mt-8 grid grid-cols-4 gap-6 3xl:grid-cols-8">
        <div
          v-for="adventure in adventures"
          :key="adventure.id"
          class="cursor-pointer rounded-xl p-3 hover:bg-slate-800"
          :class="{
            'bg-slate-800': campaign.publicAdventureId === adventure.id,
          }"
          @click="chooseAdventure(adventure.id)"
        >
          <div class="flex flex-col items-center">
            <img
              :src="`/images/rpgsystems/adventures/${adventure.imageUri}`"
              class="h-[20rem] w-[14rem] rounded-lg object-cover"
              alt=""
            />
            <div class="mt-2 text-xl text-gray-200">{{ adventure.name }}</div>
            <div class="text-md mt-1 text-center text-gray-400">
              {{ adventure.description }}
            </div>
          </div>
        </div>

        <div
          class="cursor-pointer rounded-xl p-3 hover:bg-slate-800"
          :class="{
            'bg-slate-800': campaign.publicAdventureId === undefined,
          }"
          @click="chooseAdventure(undefined)"
        >
          <div class="flex flex-col items-center">
            <img
              src="/images/rpgsystems/other.png"
              class="h-[20rem] w-[14rem] rounded-lg object-cover"
              alt=""
            />
            <div class="mt-2 text-2xl text-gray-200">Other</div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="campaign.rpgSystemId" class="mt-12">
      <button
        class="mt-4 rounded-xl bg-purple-500 p-6 text-2xl"
        @click="handleCreateCampaign"
      >
        Start Your Adventure <ArrowRightIcon class="inline-block h-8" />
      </button>
    </div>
  </div>
</template>
