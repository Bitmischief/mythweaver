<script setup lang="ts">
import { autoGrowTextArea, trimPlural } from '@/lib/util.ts';
import { Conjurer, postConjure } from '@/api/generators.ts';
import { ref } from 'vue';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { BoltIcon } from '@heroicons/vue/20/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';

defineProps<{
  summoner: Conjurer;
}>();

const emit = defineEmits(['begin-conjuring']);

const selectedCampaignId = useSelectedCampaignId();

const prompt = ref('');
const existingConjuration = ref(false);
const showExistinConjurationWarning = ref(false);
const existinConjurationOverride = ref(false);

async function generate(generatorCode: string) {
  if (!selectedCampaignId.value) {
    return;
  }

  if (existingConjuration.value && !existinConjurationOverride.value) {
    showExistinConjurationWarning.value = true;
    return;
  }

  if (existinConjurationOverride.value) {
    existinConjurationOverride.value = false;
  }

  const generateResponse = await postConjure(generatorCode, {
    count: 1,
    campaignId: selectedCampaignId.value || 0,
    customArg:
      prompt.value.length > 500 ? prompt.value.slice(0, 500) : prompt.value,
  });

  emit('begin-conjuring', {
    conjurationRequestId: generateResponse.data.conjurationRequestId,
  });

  existingConjuration.value = true;
}
</script>

<template>
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
        v-model="prompt"
        type="text"
        maxlength="500"
        class="mt-4 gradient-border-no-opacity relative h-[20rem] w-full rounded-xl border bg-black px-4 py-2 text-left text-xl text-white resize-none"
        :placeholder="summoner.customizationHelpPrompt"
        rows="4"
        @keyup="autoGrowTextArea"
      ></textarea>
      <div class="mt-1 ml-2 text-xs">{{ prompt.length }} / 500</div>
    </div>

    <button
      class="w-full md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
      @click="generate(summoner.code)"
    >
      <BoltIcon class="mr-2 h-5 w-5 self-center" />
      <span class="self-center">Conjure </span>
    </button>
  </div>

  <ModalAlternate :show="showExistinConjurationWarning">
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-[20px] text-center">
      <div class="text-4xl">Are you sure?</div>
      <div class="text-2xl mt-4 text-red-300">
        You have an unsaved conjuration, performing a new conjuration will
        remove your existing unsaved conjuration.
      </div>

      <div class="mt-8 flex justify-center">
        <button
          class="bg-gradient-to-r text-lg from-fuchsia-500 flex to-blue-400 h-12 transition-all hover:scale-110 px-4 rounded-md"
          @click="showExistinConjurationWarning = false"
        >
          <span class="self-center">Cancel</span>
        </button>
        <button
          class="ml-2 bg-neutral-800 px-4 text-lg rounded-md flex transition-all h-12 hover:scale-110 border border-red-500"
          @click="
            existinConjurationOverride = true;
            generate(summoner.code);
            showExistinConjurationWarning = false;
          "
        >
          <span class="self-center">Overwrite Existing Conjuration</span>
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
