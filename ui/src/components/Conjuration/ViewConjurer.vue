<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import {
  getConjurer,
  postConjure,
  Conjurer,
  getConjurationRequest,
} from '@/api/generators.ts';
import { useRoute } from 'vue-router';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { storeToRefs } from 'pinia';
import SummoningLoader from '@/components/Conjuration/ConjuringLoader.vue';
import { useEventBus } from '@/lib/events.ts';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import ConjurationQuickView from '@/components/Conjuration/ConjurationListItemView.vue';
import { trimPlural } from '@/lib/util.ts';

const route = useRoute();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const { selectedCampaignId } = storeToRefs(campaignStore);
const summoner = ref<Conjurer | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);
const summonedItems = ref<any[]>([]);

const conjurationRequestId = ref<number | undefined>(undefined);
const conjurationCount = ref(1);
const customArg = ref<string>('');

const pollingIntervalId = ref<number | undefined>(undefined);

onMounted(async () => {
  const getGeneratorResponse = await getConjurer(
    route.params.summonerCode.toString(),
  );
  summoner.value = getGeneratorResponse.data;
});

onUnmounted(() => {
  if (pollingIntervalId.value) {
    clearInterval(pollingIntervalId.value);
  }
});

async function generate(generatorCode: string) {
  if (!selectedCampaignId.value) {
    return;
  }

  animationDone.value = false;
  generating.value = true;

  const generateResponse = await postConjure(generatorCode, {
    count: conjurationCount.value,
    campaignId: selectedCampaignId.value || 0,
    customArg:
      customArg.value.length > 500
        ? customArg.value.slice(0, 500)
        : customArg.value,
  });
  conjurationRequestId.value = generateResponse.data.conjurationRequestId;

  pollingIntervalId.value = setInterval(async () => {
    await loadConjurationRequest();

    if (summonedItems.value.length > 0) {
      processConjuringPartiallyComplete();
    }
    if (
      conjurationCount.value === summonedItems.value.length &&
      summonedItems.value.every((c: any) => c.imageUri)
    ) {
      processConjuringComplete();
    }
  }, 5 * 1000) as unknown as number;
}

async function loadConjurationRequest() {
  if (!conjurationRequestId.value) return;

  const conjurationRequestResponse = await getConjurationRequest(
    conjurationRequestId.value,
  );

  summonedItems.value = conjurationRequestResponse.data.conjurations;
}

function processConjuringPartiallyComplete() {
  generating.value = false;
  eventBus.$emit('summoningDone', {});

  eventBus.$on('summoningAnimationDone', () => {
    animationDone.value = true;
  });
}

function processConjuringComplete() {
  clearInterval(pollingIntervalId.value);
}

const variationCountInvalid = computed(
  () => conjurationCount.value < 1 || conjurationCount.value > 5,
);
</script>

<template>
  <div v-if="summoner" class="relative flex">
    <div class="z-10 h-full w-full rounded-xl p-4">
      <router-link
        :to="`/conjurations/new`"
        class="bg-surface-2 w-36 mb-6 flex rounded-xl border border-gray-600/50 p-3"
      >
        <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
      </router-link>

      <template v-if="!generating && !summonedItems.length">
        <div class="text-3xl">
          {{ summoner.name }}
        </div>

        <div class="mt-1 text-gray-400 text-sm">
          {{ summoner.description }}
        </div>

        <div class="mt-8 text-gray-200">
          <div class="my-8">
            <div class="text-xl">
              Describe what kind of
              {{ trimPlural(summoner.name.toLowerCase()) }} you're looking for
            </div>
            <textarea
              v-model="customArg"
              type="text"
              maxlength="500"
              class="mt-1 gradient-border-no-opacity relative w-[50rem] rounded-xl border bg-black px-4 py-2 text-left text-xl text-white resize-none"
              :placeholder="summoner.customizationHelpPrompt"
              rows="4"
            ></textarea>
            <div class="mt-1 ml-2 text-xs">{{ customArg.length }} / 500</div>
          </div>

          <button
            class="mt-8 flex cursor-pointer rounded-xl bg-black bg-gradient px-4 py-2 text-lg text-white"
            :disabled="variationCountInvalid"
            @click="generate(summoner.code)"
          >
            <span class="self-center"> Begin Summoning </span>
          </button>
        </div>
      </template>
      <template v-else-if="generating || (!generating && !animationDone)">
        <SummoningLoader class="h-[10rem] w-[15rem]" />
      </template>
      <div v-else-if="!generating && animationDone && summonedItems.length">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <ConjurationQuickView
            v-for="n in conjurationCount"
            :key="`conjuration-${n}`"
            :skeleton="!summonedItems[n - 1]"
            :conjuration="summonedItems[n - 1]"
            @add-conjuration="loadConjurationRequest"
          />
        </div>
      </div>
    </div>
  </div>
</template>
