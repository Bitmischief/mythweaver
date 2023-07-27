<template>
  <div class="h-full p-4">
    <div class="mb-4 flex justify-between">
      <div class="text-2xl">Summon something magical</div>
    </div>

    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { postSummonerSummon } from "@/api/generators.ts";
import { storeToRefs } from "pinia";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();
const campaignStore = useCampaignStore();
const { selectedCampaignId } = storeToRefs(campaignStore);

const animatedSuccessTextRef = ref<HTMLElement | null>(null);
const generatedItems = ref<any[]>([]);
const showGeneratedItems = ref(false);
const generated = ref(false);
const generating = ref(false);

async function generate(generatorCode: string) {
  generated.value = false;
  generating.value = true;
  showGeneratedItems.value = false;

  loadingSnippet.value = getRandomLoadingSnippet();
  const intervalId = setInterval(() => {
    loadingSnippet.value = getRandomLoadingSnippet();
  }, 12 * 1000);

  const generateResponse = await postSummonerSummon(generatorCode, {
    campaignId: selectedCampaignId.value || 0,
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

// async function clickSaveCharacter(character: any) {
//   const postCharacterResponse = await postCharacter(character);
//
//   if (postCharacterResponse.status === 201) {
//     await router.push(`/characters/${postCharacterResponse.data.id}`);
//     showSuccess({ message: "Character saved" });
//   } else {
//     showError({ message: "Failed to save character" });
//   }
// }
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
