<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  CustomArg,
  getSummoner,
  postSummonerSummon,
  Summoner,
} from "@/api/generators.ts";
import { useRoute, useRouter } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";
import { showError, showSuccess } from "@/lib/notifications.ts";
import SummoningLoader from "@/components/Summoning/SummoningLoader.vue";
import { useEventBus } from "@/lib/events.ts";
import { postCharacter } from "@/api/characters.ts";
import Character from "@/components/Characters/Character.vue";
import { XMarkIcon } from "@heroicons/vue/24/solid";

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const { selectedCampaignId } = storeToRefs(campaignStore);
const summoner = ref<Summoner | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);
const summonedItems = ref<any[]>([]);

const customArgs = ref<CustomArg[]>([{ key: "", value: "" }]);

onMounted(async () => {
  const getGeneratorResponse = await getSummoner(
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

    const generateResponse = await postSummonerSummon(generatorCode, {
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
}

function removeCustomArg(index: number) {
  customArgs.value.splice(index, 1);
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
                  v-model="customArg.key"
                  class="gradient-border-no-opacity relative h-8 w-32 rounded-xl border bg-black px-4 text-left text-white"
                  placeholder="Occupation"
                />
                <input
                  v-model="customArg.value"
                  class="gradient-border-no-opacity relative ml-2 h-8 w-32 rounded-xl border bg-black px-4 text-left text-white"
                  placeholder="Bartender"
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
        <div class="mb-4 flex justify-between">
          <div class="self-center text-xl text-green-200">
            Choose any
            {{ summoner.name.toLowerCase() }}
            you'd like to save!
          </div>

          <button
            class="rounded-xl px-4 py-2"
            :class="{
              'bg-green-500': selectedItems.length,
              'bg-gray-700/50': !selectedItems.length,
            }"
            :disabled="!selectedItems.length"
            @click="clickSaveCharacters"
          >
            Save {{ summoner.name }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div
            v-for="(item, i) of summonedItems"
            :key="i"
            class="cursor-pointer rounded-xl"
            :class="{
              'border-2 border-green-500/50': !!selectedItems.find((a: any) => a.name === item.name),
              'border-2 border-green-500/0': !selectedItems.find((a: any) => a.name === item.name)
            }"
            @click="addToSelectedItems(item)"
          >
            <Character :character="item" full />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
