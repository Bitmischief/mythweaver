<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from "vue";
import {
  getConjurer,
  postConjure,
  Conjurer,
  getConjurationRequest,
} from "@/api/generators.ts";
import { useRoute } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";
import SummoningLoader from "@/components/Conjuration/ConjuringLoader.vue";
import { useEventBus } from "@/lib/events.ts";
import { ArrowLeftIcon } from "@heroicons/vue/24/solid";
import ConjurationQuickView from "@/components/Conjuration/ConjurationListItemView.vue";
import {
  RadioGroup,
  RadioGroupLabel,
  RadioGroupOption,
  RadioGroupDescription,
} from "@headlessui/vue";
import { trimPlural } from "@/lib/util.ts";

const route = useRoute();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const { selectedCampaignId } = storeToRefs(campaignStore);
const summoner = ref<Conjurer | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);
const summonedItems = ref<any[]>([]);

const customizeOptions = ref([
  {
    title: "Surprise Me",
    description: "Our conjurer will choose the best options for you",
  },
  {
    title: "Customize",
    description: "Hand pick the options you want to use",
  },
]);
const selectedCustomizeOption = ref(customizeOptions.value[0]);
const customize = computed(
  () => selectedCustomizeOption.value === customizeOptions.value[1],
);

const conjurationRequestId = ref<number | undefined>(undefined);
const conjurationCount = ref(1);
const customArg = ref<string>("");

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

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  // if (!generating.value && animationDone.value && summonedItems.value.length) {
  //   return "";
  // }

  return `background-image: url("/images/generators/${imageUri}"); min-height: calc(100% - 2.5rem)`;
};

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
  eventBus.$emit("summoningDone", {});

  eventBus.$on("summoningAnimationDone", () => {
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
  <div
    v-if="summoner"
    class="relative flex rounded-xl bg-cover md:bg-contain bg-center"
    :style="backgroundImageInlineStyle(summoner.imageUri)"
  >
    <div class="absolute h-full w-full rounded-xl bg-black/95 p-4"></div>
    <div class="z-10 h-full w-full rounded-xl p-4">
      <template v-if="!generating && !summonedItems.length">
        <div class="text-3xl">
          {{ summoner.name }}
        </div>

        <div class="mt-1 text-gray-400">
          {{ summoner.description }}
        </div>

        <div class="mt-8 text-gray-200">
          <div class="text-xl">How many variations?</div>
          <div class="my-1 text-gray-400">
            This is the number of {{ summoner.name.toLowerCase() }} we will
            conjure
          </div>
          <input
            v-model="conjurationCount"
            type="number"
            class="mt-1 relative h-[3rem] w-[20rem] rounded-xl border bg-black px-4 text-left text-xl text-white"
            :class="{
              'border-red-500': variationCountInvalid,
              'gradient-border-no-opacity': !variationCountInvalid,
            }"
          />
          <div
            v-if="variationCountInvalid"
            class="mt-1 ml-2 text-red-400 text-xs"
          >
            Please enter a number between 1 and 5
          </div>

          <RadioGroup v-model="selectedCustomizeOption">
            <div class="mt-6 md:w-[30rem]">
              <RadioGroupOption
                v-for="option in customizeOptions"
                :key="option.title"
                v-slot="{ active, checked }"
                as="template"
                :value="option"
              >
                <div
                  :class="[
                    active
                      ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-purple-400'
                      : '',
                    checked
                      ? 'bg-purple-400 bg-opacity-75'
                      : 'bg-surface border-2 border-gray-600/50',
                  ]"
                  class="relative flex cursor-pointer rounded-lg px-5 my-2 py-4 shadow-md focus:outline-none"
                >
                  <div class="flex w-full items-center justify-between">
                    <div class="flex items-center">
                      <div class="text-sm">
                        <RadioGroupLabel as="p" class="text-white font-medium">
                          {{ option.title }}
                        </RadioGroupLabel>
                        <RadioGroupDescription
                          as="span"
                          :class="checked ? 'text-sky-100' : 'text-gray-400'"
                          class="inline"
                        >
                          <span> {{ option.description }}</span>
                        </RadioGroupDescription>
                      </div>
                    </div>
                    <div v-show="checked" class="shrink-0 text-white">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="#fff"
                          fill-opacity="0.2"
                        />
                        <path
                          d="M7 13l3 3 7-7"
                          stroke="#fff"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </RadioGroupOption>
            </div>
          </RadioGroup>

          <div v-if="customize" class="my-8">
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
        <button
          class="bg-surface-2 mb-4 flex rounded-xl border-2 border-gray-600/50 p-3"
          @click="
            generating = false;
            animationDone = false;
            summonedItems = [];
          "
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          <span class="self-center">Back</span>
        </button>

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
