<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import {
  CustomArg,
  getConjurer,
  postConjure,
  Conjurer,
} from "@/api/generators.ts";
import { useRoute, useRouter } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";
import { showError, showSuccess } from "@/lib/notifications.ts";
import SummoningLoader from "@/components/Conjuration/ConjuringLoader.vue";
import { useEventBus } from "@/lib/events.ts";
import { postCharacter } from "@/api/characters.ts";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/vue/24/solid";
import ConjurationQuickView from "@/components/Conjuration/ConjurationQuickView.vue";

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const { selectedCampaignId } = storeToRefs(campaignStore);
const summoner = ref<Conjurer | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);
const summonedItems = ref<any[]>([]);

const customArgs = ref<CustomArg[]>([{ key: "", value: "" }]);

onMounted(async () => {
  const getGeneratorResponse = await getConjurer(
    route.params.summonerCode.toString()
  );
  summoner.value = getGeneratorResponse.data;
});

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  if (!generating.value && animationDone.value && summonedItems.value.length) {
    return "";
  }

  return `background-image: url("/images/generators/${imageUri}");`;
};

async function generate(generatorCode: string) {
  if (!selectedCampaignId.value) {
    return;
  }

  try {
    animationDone.value = false;
    generating.value = true;

    const generateResponse = await postConjure(generatorCode, {
      campaignId: selectedCampaignId.value || 0,
      customArgs: customArgs.value.filter((a) => a.key && a.value),
    });

    summonedItems.value = generateResponse.data;
  } catch (err) {
    showError({ message: "Failed to summon... please try again!" });
  } finally {
    generating.value = false;

    eventBus.$emit("summoningDone", {});

    eventBus.$on("summoningAnimationDone", () => {
      animationDone.value = true;
    });
  }
}

async function clickSaveCharacters() {
  for (const item of selectedItems.value) {
    const postCharacterResponse = await postCharacter(item);

    if (postCharacterResponse.status !== 201) {
      showError({ message: "Failed to save character" });
    }
  }

  showSuccess({
    message: "You can now browse to Characters to see the saved characters!",
  });

  await router.push("/characters");
}

const selectedItems = ref<any[]>([]);
function addToSelectedItems(item: any) {
  if (selectedItems.value.find((i) => i.name === item.name)) {
    selectedItems.value = selectedItems.value.filter(
      (i) => i.name !== item.name
    );
    return;
  }

  selectedItems.value.push(item);
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
    class="relative flex h-full rounded-xl bg-cover bg-center"
    :style="backgroundImageInlineStyle(summoner.imageUri)"
  >
    <div class="absolute h-full w-full rounded-xl bg-black/75 p-4"></div>
    <div class="z-10 h-full w-full rounded-xl p-4">
      <template v-if="!generating && !summonedItems.length">
        <div class="text-3xl">
          {{ summoner.name }}
        </div>

        <div class="mt-1 text-gray-400">
          {{ summoner.description }}
        </div>

        <div class="mt-8 text-gray-200">
          <div class="text-xl">Customize</div>
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
                  class="gradient-border-no-opacity relative h-8 w-32 rounded-xl border bg-black px-4 text-left text-white"
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
                  class="gradient-border-no-opacity relative ml-2 h-8 w-32 rounded-xl border bg-black px-4 text-left text-white"
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
            v-for="conjuration of summonedItems"
            :key="conjuration.name"
            :conjuration="conjuration"
          />
        </div>
      </div>
    </div>
  </div>
</template>
