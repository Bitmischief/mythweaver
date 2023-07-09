<template>
  <div class="h-full">
    <div class="mb-4 flex justify-between">
      <div class="text-2xl font-bold">Generate something magical</div>
    </div>

    <div v-if="parentGenerator" class="my-8 flex rounded-lg bg-purple-900">
      <div
        class="cursor-pointer rounded-l-lg rounded-r-full bg-purple-600 p-4"
        @click="navigateToGenerator()"
      >
        Generators
      </div>
      <div
        v-for="parent in parentHierarchy"
        :key="parent.name"
        class="cursor-pointer p-4"
        @click="navigateToGenerator(parent.id)"
      >
        {{ parent.name }}
      </div>
      <div
        class="cursor-pointer p-4"
        @click="navigateToGenerator(parentGenerator.id)"
      >
        {{ parentGenerator.name }}
      </div>
    </div>

    <div
      v-if="generators.length"
      class="grid grid-cols-1 gap-8"
      :class="{
        'md:grid-cols-2': !parentGenerator,
        'md:grid-cols-4': !!parentGenerator,
      }"
    >
      <GeneratorItem
        v-for="generator of generators"
        :key="generator.name"
        :generator="generator"
        @click="navigateToGenerator(generator.id)"
      />
    </div>
    <div v-else-if="!!parentGenerator && !generating && !generated">
      <div class="mb-6">Type: {{ parentGenerator.name }}</div>

      <div
        class="h-40 w-60 cursor-pointer flex-col justify-center rounded-2xl bg-cover bg-center"
        :style="backgroundImageInlineStyle"
      >
        <div
          class="flex h-full w-full justify-center rounded-lg bg-green-500/70 p-4 text-2xl font-bold shadow-lg hover:bg-green-500/30"
          @click="generate(parentGenerator.id)"
        >
          <span class="self-center"> Generate </span>
        </div>
      </div>
    </div>
    <div
      v-else-if="generating"
      class="flex w-full flex-col justify-center text-center"
    >
      <div class="text-center text-2xl font-bold text-purple-200">
        {{ loadingSnippet }}
      </div>

      <div class="mt-12 flex w-full justify-center">
        <BoltIcon class="h-64 w-64 animate-pulse text-purple-500" />
      </div>
    </div>
    <div v-else-if="generated" class="flex justify-center">
      <div
        ref="animatedSuccessTextRef"
        class="self-center text-[6rem] text-purple-300 opacity-100 transition-opacity duration-[3000ms] ease-in-out"
      >
        Your hero awaits!
      </div>

      <div v-if="showGeneratedItems" class="grid grid-cols-3 gap-8">
        <div
          v-for="(item, i) of generatedItems"
          :key="i"
          class="flex cursor-pointer flex-col justify-between rounded-xl bg-slate-950/10 p-3 hover:bg-slate-950/25"
        >
          <div>
            <div class="text-2xl font-bold text-purple-200">
              {{ item.name }}
            </div>
            <div class="my-2 text-lg text-purple-200">
              {{ item.background }}
            </div>
            <div class="text-md my-2 text-purple-200">{{ item.looks }}</div>
            <div class="text-md my-2 text-purple-200">
              {{ item.personality }}
            </div>
          </div>

          <div class="mt-8 flex justify-end">
            <button
              class="rounded-lg bg-green-300 p-2 text-surface"
              @click="clickSaveCharacter(item)"
            >
              Save Character
            </button>
          </div>
        </div>
      </div>
    </div>

    <Confetti />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  Generator,
  getGenerator,
  getGenerators,
  postGeneratorGenerate,
} from "@/api/generators.ts";
import GeneratorItem from "@/components/Generators/GeneratorItem.vue";
import { useRoute, useRouter } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";
import { BoltIcon } from "@heroicons/vue/24/outline";
import Confetti from "@/components/Effects/Confetti.vue";
import { useEventBus } from "@/lib/events.ts";
import { patchCharacter, postCharacter } from "@/api/characters.ts";
import { showError, showSuccess } from "@/lib/notifications.ts";
const campaignStore = useCampaignStore();
const eventBus = useEventBus();

const { selectedCampaignId } = storeToRefs(campaignStore);

const route = useRoute();
const router = useRouter();
const generators = ref<Generator[]>([]);
const parentGenerator = ref<Generator | undefined>(undefined);
const parentHierarchy = ref<Generator[]>([]);
const generating = ref(false);
const generated = ref(false);

onMounted(async () => {
  await loadGenerators();
});

async function loadGenerators() {
  let parentId = undefined;
  parentHierarchy.value = [];
  parentGenerator.value = undefined;

  if (route.query.parentId) {
    parentId = parseInt(route.query.parentId.toString());
  }

  const getGeneratorsResponse = await getGenerators(parentId);
  generators.value = getGeneratorsResponse.data.data;

  if (parentId) {
    const parentGeneratorResponse = await getGenerator(parentId);
    parentGenerator.value = parentGeneratorResponse.data;

    if (parentGenerator.value) {
      document.title = `${parentGenerator.value?.name} | Generators`;
    }

    let iteratingParent = parentGenerator.value;
    while (iteratingParent?.parent) {
      parentHierarchy.value.push(iteratingParent?.parent || ({} as Generator));
      iteratingParent = iteratingParent?.parent;
    }

    parentHierarchy.value.reverse();
  } else {
    generating.value = false;
    generated.value = false;
  }
}

async function navigateToGenerator(
  generatorId: number | undefined = undefined
) {
  let url = "/generators";

  if (generatorId) {
    url += `?parentId=${generatorId}`;
  }

  await router.push(url);
  await loadGenerators();
}

const backgroundImageInlineStyle = computed(() => {
  return parentGenerator.value
    ? `background-image: url("/images/generators/${parentGenerator.value?.imageUri}");`
    : "";
});

const animatedSuccessTextRef = ref<HTMLElement | null>(null);
const generatedItems = ref<any[]>([]);
const showGeneratedItems = ref(false);

async function generate(generatorId: number) {
  generated.value = false;
  generating.value = true;
  showGeneratedItems.value = false;

  loadingSnippet.value = getRandomLoadingSnippet();
  const intervalId = setInterval(() => {
    loadingSnippet.value = getRandomLoadingSnippet();
  }, 12 * 1000);

  const generateResponse = await postGeneratorGenerate(generatorId, {
    campaignId: selectedCampaignId.value,
    customData: undefined,
  });
  generatedItems.value = generateResponse.data;

  clearInterval(intervalId);
  generating.value = false;
  generated.value = true;

  eventBus.$emit("fireConfetti", {});

  setTimeout(() => {
    animatedSuccessTextRef.value?.classList.remove("opacity-100");
    animatedSuccessTextRef.value?.classList.add("opacity-0");

    setTimeout(() => {
      animatedSuccessTextRef.value?.classList.add("hidden");
      showGeneratedItems.value = true;
    }, 3050);
  }, 1000);
}

function getRandomLoadingSnippet() {
  return loadingSnippets.value[
    Math.floor(Math.random() * loadingSnippets.value.length)
  ];
}

const loadingSnippet = ref("");

const loadingSnippets = ref([
  "Conjuring the character cauldron...",
  "Rummaging through the wizard's hat...",
  "Summoning the spirits of character creation...",
  "Spinning up the fantasy wheel...",
  "Brewing a batch of character essence...",
  "Consulting the ancient character scrolls...",
  "Decoding the runes of roleplay...",
  "Gathering the magical pixie dust...",
  "Harnessing the power of the character gods...",
  "Weaving together strands of epic destiny...",
  "Taming a wild imagination unicorn...",
  "Deciphering the storyteller's enigma...",
  "Cranking the gears of the fantasy machine...",
  "Polishing the hero's legendary armor...",
  "Feeding the creation dragons...",
  "Waking the bard for inspirational tunes...",
  "Turning the pages of the endless spellbook...",
  "Talking to the wise character owls...",
  "Dancing with the character sprites...",
  "Rolling the dice of fate...",
  "Invoking the creative spirits...",
  "Juggling the elements of a great tale...",
  "Spinning the loom of character destiny...",
  "Questing for the perfect backstory...",
  "Crossing the bridge of character creation...",
  "Peering into the crystal ball...",
  "Awakening the mystical creation phoenix...",
  "Blending a potion of personality...",
  "Carving an epic tale from the story tree...",
  "Scaling the cliff of imagination...",
  "Unlocking the chest of endless possibilities...",
  "Poring over ancient character tomes...",
  "Sailing the sea of adventure...",
  "Deciding your fate in the stars...",
  "Beaming down creativity from the moon...",
  "Catching creativity fireflies...",
  "Rolling in a meadow of imagination...",
  "Donning the thinking cap...",
  "Collecting character gems...",
  "Sewing the fabric of a new identity...",
  "Stepping through the creation portal...",
  "Charging the orb of creativity...",
  "Tuning the character harp...",
  "Wrangling character plot bunnies...",
  "Unfurling the character creation scroll...",
  "Winding the clock of creation...",
  "Adjusting the character compass...",
  "Filling the quill with magic ink...",
  "Peeking into the adventurer's knapsack...",
  "Crafting the legendary character amulet...",
  "Igniting the spark of a new adventure...",
]);

async function clickSaveCharacter(character: any) {
  const postCharacterResponse = await postCharacter(character);

  if (postCharacterResponse.status === 201) {
    await router.push(`/characters/${postCharacterResponse.data.id}`);
    showSuccess({ message: "Character saved" });
  } else {
    showError({ message: "Failed to save character" });
  }
}
</script>

<style scoped lang="css">
.loading {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}
</style>
