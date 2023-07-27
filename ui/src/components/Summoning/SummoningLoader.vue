<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
  animateDone,
  animateLoading,
  init,
} from "@/lib/summoningLoadingAnimation.ts";
import { useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

const intervalId = ref(0);
const loadingSnippet = ref("");

onMounted(() => {
  loadingSnippet.value = getRandomLoadingSnippet();
  init("#summoning_anim_wrapper");
  const loadingTimeline = animateLoading();

  eventBus.$on("summoningDone", () => {
    loadingSnippet.value = "";
    animateDone(loadingTimeline);

    setTimeout(function () {
      eventBus.$emit("summoningAnimationDone", {});
      document.querySelector(".animation_wrapper")?.classList.add("done");
    }, 2 * 1000);
  });

  const iid = setInterval(() => {
    loadingSnippet.value = getRandomLoadingSnippet();
  }, 10 * 1000);
  intervalId.value = iid;
});

onUnmounted(() => {
  clearInterval(intervalId.value);
});

function getRandomLoadingSnippet() {
  return loadingSnippets.value[
    Math.floor(Math.random() * loadingSnippets.value.length)
  ];
}

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
</script>

<template>
  <div class="-mb-36 mt-12 animate-pulse text-center text-3xl text-purple-300">
    {{ loadingSnippet }}
  </div>
  <div
    id="summoning_anim_wrapper"
    class="animation_wrapper"
    style="opacity: 0"
  ></div>
</template>

<style scoped>
.animation_wrapper {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.animation_wrapper svg {
  width: 100%;
  height: 100%;
}

.done {
  transition: 1s all;
  opacity: 0;
  visibility: hidden;
}
</style>
