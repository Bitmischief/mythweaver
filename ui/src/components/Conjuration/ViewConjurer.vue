<script setup lang="ts">
import { onMounted, ref, nextTick, onUnmounted } from "vue";
import {
  CustomArg,
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
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/vue/24/solid";
import ConjurationQuickView from "@/components/Conjuration/ConjurationListItemView.vue";

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
const customArgs = ref<CustomArg[]>([{ key: "", value: "" }]);

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
    customArgs: customArgs.value.filter((a) => a.key && a.value),
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

function addCustomArg() {
  customArgs.value.push({ key: "", value: "" });
  return true;
}

function removeCustomArg(index: number) {
  customArgs.value.splice(index, 1);
}

const keyInputs = ref<any[]>([]);
const valueInputs = ref<any[]>([]);
function setKeyFocus(index: number) {
  nextTick(() => {
    keyInputs.value[index].focus();
  });
  return true;
}
function setValueFocus(index: number) {
  valueInputs.value[index].focus();
  return true;
}
function isFirst(index: number) {
  return index + 1 === 1;
}
function isLast(index: number) {
  return index + 1 === customArgs.value.length;
}
function isKeyEmpty(index: number) {
  return keyInputs.value[index].value === "";
}
function isValueEmpty(index: number) {
  return valueInputs.value[index].value === "";
}
function cursorStart(e: any) {
  return e.target.selectionStart === 0;
}
function cursorEnd(e: any) {
  return e.target.selectionStart === e.target.value.length;
}
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
            class="mt-1 gradient-border-no-opacity relative h-[3rem] w-[20rem] rounded-xl border bg-black px-4 text-left text-xl text-white"
          />

          <div class="mt-6 text-xl">Customize</div>
          <div class="mt-2">
            <div class="text-sm text-gray-400">
              Add parameters to help refine your summoning
            </div>
            <div class="mt-2">
              <div
                v-for="(customArg, i) in customArgs"
                :key="i"
                class="mb-2 flex"
              >
                <input
                  :ref="
                    (el) => {
                      keyInputs[i] = el;
                    }
                  "
                  v-model="customArg.key"
                  class="gradient-border-no-opacity relative h-[3rem] w-[20rem] rounded-xl border bg-black px-4 text-left text-xl text-white"
                  autofocus
                  placeholder="Occupation"
                  @keydown.enter="setValueFocus(i)"
                  @keydown.escape="
                    !isFirst(i) && removeCustomArg(i);
                    setKeyFocus(i - 1);
                  "
                  @keydown.backspace="
                    isKeyEmpty(i) &&
                      !isFirst(i) &&
                      setValueFocus(i - 1) &&
                      $event.preventDefault();
                    isKeyEmpty(i) && isValueEmpty(i) && removeCustomArg(i);
                  "
                  @keydown.right="
                    cursorEnd($event) &&
                      setValueFocus(i) &&
                      $event.preventDefault()
                  "
                  @keydown.left="
                    cursorStart($event) &&
                      !isFirst(i) &&
                      setValueFocus(i - 1) &&
                      $event.preventDefault()
                  "
                  @keydown.down="!isLast(i) && setKeyFocus(i + 1)"
                  @keydown.up="!isFirst(i) && setKeyFocus(i - 1)"
                />
                <input
                  :ref="
                    (el) => {
                      valueInputs[i] = el;
                    }
                  "
                  v-model="customArg.value"
                  class="gradient-border-no-opacity relative ml-2 h-[3rem] w-[20rem] text-xl rounded-xl border bg-black px-4 text-left text-white"
                  placeholder="Bartender"
                  @keydown.enter="
                    i + 1 === customArgs.length && addCustomArg();
                    setKeyFocus(i + 1);
                  "
                  @keydown.backspace="
                    customArg.value === '' &&
                      setKeyFocus(i) &&
                      $event.preventDefault()
                  "
                  @keydown.tab="
                    i + 1 === customArgs.length && addCustomArg();
                    setKeyFocus(i + 1) && $event.preventDefault();
                  "
                  @keydown.right="
                    cursorEnd($event) &&
                      !isLast(i) &&
                      setKeyFocus(i + 1) &&
                      $event.preventDefault()
                  "
                  @keydown.left="
                    cursorStart($event) &&
                      setKeyFocus(i) &&
                      $event.preventDefault()
                  "
                  @keydown.down="!isLast(i) && setValueFocus(i + 1)"
                  @keydown.up="!isFirst(i) && setValueFocus(i - 1)"
                />
                <button
                  class="ml-2 rounded border border-red-500 p-1 px-2 text-sm"
                  @click="removeCustomArg(i)"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
              <button
                class="rounded border border-green-500 p-1 px-4 text-sm"
                @click="addCustomArg"
              >
                Add parameter
              </button>
            </div>
          </div>
        </div>

        <button
          class="mt-8 flex cursor-pointer rounded-xl bg-black bg-gradient px-4 py-2 text-lg font-bold text-white"
          @click="generate(summoner.code)"
        >
          <span class="self-center"> Begin Summoning </span>
        </button>
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
