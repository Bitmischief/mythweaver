<script setup lang="ts">
import { autoGrowTextArea, trimPlural } from '@/lib/util.ts';
import { Conjurer, postConjure } from '@/api/generators.ts';
import { ref } from 'vue';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { BoltIcon } from '@heroicons/vue/20/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import Accordion from '@/components/Core/Accordion.vue';

defineProps<{
  summoner: Conjurer;
}>();

const emit = defineEmits(['begin-conjuring']);

const selectedCampaignId = useSelectedCampaignId();

const request = ref({
  prompt: '',
  preset: 'fantasy-art',
  imagePrompt: '',
  imageNegativePrompt: '',
  imageReferenceImage: '',
});

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
  <div class="text-xl">
    {{ summoner.name }}
  </div>

  <div class="mt-1 text-gray-400 text-sm">
    {{ summoner.description }}
  </div>

  <FormKit type="form">
    <div class="mt-8 text-gray-200">
      <div class="my-8">
        <div class="text-lg mb-4">
          Describe what kind of
          {{ trimPlural(summoner.name.toLowerCase()) }} you're looking for
        </div>
        <FormKit
          v-model="request.prompt"
          label="Prompt"
          name="prompt"
          help="This is used to generate the text elements of your conjuration."
          type="textarea"
          validation="required|maxlength:500"
          :placeholder="summoner.customizationHelpPrompt"
          auto-height
        />
        <div class="-mt-3 text-xs">{{ request.prompt.length }} / 500</div>
      </div>

      <Accordion title="Image Customization">
        <div class="ml-2">
          <div>
            <FormKit
              v-model="request.preset"
              type="select"
              label="Preset Image Style"
              :options="{
                'fantasy-art': 'Fantasy Art',
                'digital-art': 'Digital Art',
                'comic-book': 'Comic Book',
              }"
              validation="required"
            />
          </div>

          <div>
            <FormKit
              v-model="request.imagePrompt"
              label="Prompt"
              type="text"
              validation="required"
            />
          </div>

          <div>
            <FormKit
              v-model="request.imageNegativePrompt"
              label="Negative Prompt"
              type="text"
              validation="required"
            />
          </div>

          <div>
            <FormKit
              type="file"
              label="Reference Image (optional)"
              accept=".png, .jpg, .jpeg"
            />
          </div>
        </div>
      </Accordion>

      <button
        class="w-full md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="generate(summoner.code)"
      >
        <BoltIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Conjure </span>
      </button>
    </div>
  </FormKit>

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
