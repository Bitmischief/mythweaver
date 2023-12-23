<script setup lang="ts">
import { trimPlural } from '@/lib/util.ts';
import { Conjurer, postConjure } from '@/api/generators.ts';
import { computed, ref } from 'vue';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import Accordion from '@/components/Core/Accordion.vue';
import axios from 'axios';

const props = defineProps<{
  summoner: Conjurer;
}>();

const emit = defineEmits(['begin-conjuring']);

const selectedCampaignId = useSelectedCampaignId();

const request = ref<{
  prompt: string;
  imageStylePreset: 'fantasy-art' | 'digital-art' | 'comic-book';
  imagePrompt: string;
  imageNegativePrompt: string;
  imageReferenceImage: string;
}>({
  prompt: '',
  imageStylePreset: 'fantasy-art',
  imagePrompt: '',
  imageNegativePrompt: '',
  imageReferenceImage: '',
});

const existingConjuration = ref(false);
const showExistingConjurationWarning = ref(false);
const existingConjurationOverride = ref(false);
const isErrored = ref(false);

const imagePresetStyles = computed(() => {
  return props.summoner.supportedImageStylePresets?.reduce(
    (a, v) => ({ ...a, [v]: toTitleCase(v) }),
    {},
  );
});

function toTitleCase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

async function generate(generatorCode: string) {
  if (!selectedCampaignId.value) {
    return;
  }

  if (existingConjuration.value && !existingConjurationOverride.value) {
    showExistingConjurationWarning.value = true;
    return;
  }

  if (existingConjurationOverride.value) {
    existingConjurationOverride.value = false;
  }

  const generateResponse = await postConjure(generatorCode, {
    count: 1,
    campaignId: selectedCampaignId.value || 0,
    ...request.value,
  });

  if (axios.isAxiosError(generateResponse)) {
    isErrored.value = true;
    return;
  }
  isErrored.value = false;

  emit('begin-conjuring', {
    conjurationRequestId: generateResponse?.data.conjurationRequestId,
  });

  existingConjuration.value = true;
}
</script>

<template>
  <div class="text-xl">
    {{ summoner.name }}
  </div>

  <div class="mt-1 text-sm text-gray-400">
    {{ summoner.description }}
  </div>

  <FormKit
    v-slot="{ disabled }"
    :actions="false"
    type="form"
    @submit="generate(summoner.code)"
  >
    <div class="mt-8 text-gray-200">
      <div class="my-8">
        <div class="mb-4 text-lg">
          Describe what kind of
          {{ trimPlural(summoner.name.toLowerCase()) }} you're looking for
        </div>
        <FormKit
          v-model="request.prompt"
          label="Backstory Prompt"
          name="prompt"
          help="This is used to generate the text elements of your conjuration."
          type="textarea"
          validation="length:0,1000"
          :placeholder="summoner.customizationHelpPrompt"
          auto-height
        />
        <div class="-mt-3 text-xs">{{ request.prompt.length }} / 1000</div>
      </div>

      <Accordion title="Image Customization" subtitle="(optional)">
        <div class="px-0.5">
          <div>
            <FormKit
              v-model="request.imageStylePreset"
              type="select"
              label="Preset Image Style"
              :options="imagePresetStyles"
            />
          </div>

          <div>
            <FormKit
              v-model="request.imagePrompt"
              label="Image Prompt"
              help="This is used to generate the image for your conjuration."
              type="textarea"
              validation="length:0,1000"
              placeholder="a male human with gleaming silver armor and a fiery sword"
              auto-height
            />
          </div>

          <div>
            <FormKit
              v-model="request.imageNegativePrompt"
              label="Negative Prompt"
              type="textarea"
              validation="length:0,1000"
              placeholder="horns, mountains"
              auto-height
            />
          </div>
        </div>
      </Accordion>

      <div class="mt-8 md:mt-2">
        <FormKit
          type="submit"
          :disabled="disabled as boolean"
          label="Conjure"
        />
        <p v-show="isErrored" class="text-right text-red-500">
          An error occurred, please try again
        </p>
      </div>
    </div>
  </FormKit>

  <ModalAlternate :show="showExistingConjurationWarning">
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-[20px] text-center">
      <div class="text-4xl">Are you sure?</div>
      <div class="mt-4 text-2xl text-red-300">
        You have an unsaved conjuration, performing a new conjuration will
        remove your existing unsaved conjuration.
      </div>

      <div class="flex justify-center mt-8">
        <button
          class="flex h-12 px-4 text-lg transition-all rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 hover:scale-110"
          @click="showExistingConjurationWarning = false"
        >
          <span class="self-center">Cancel</span>
        </button>
        <button
          class="flex h-12 px-4 ml-2 text-lg transition-all border border-red-500 rounded-md bg-neutral-800 hover:scale-110"
          @click="
            existingConjurationOverride = true;
            generate(summoner.code);
            showExistingConjurationWarning = false;
          "
        >
          <span class="self-center">Overwrite Existing Conjuration</span>
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
