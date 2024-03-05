<template>
  <MeteorShower />
  <div
    v-if="generators.length && !generating"
    class="flex justify-center my-auto"
  >
    <div class="w-full md:w-[80%] xl:w-[70%] 2xl:w-[60%] 3xl:w-[50%]">
      <img
        src="@/assets/icons/gradient-wand.svg"
        alt="wand"
        class="w-12 mx-auto"
      />
      <div class="text-[48px] font-bold text-center">Mythweaver AI</div>
      <div class="text-neutral-600 mb-12 text-center">
        Generate captivating visuals & conjurations
      </div>
      <div class="flex mb-6 justify-center">
        <div
          class="flex gap-1 text-neutral-500 rounded-[10px] bg-surface-2 p-1 border border-surface-3 text-sm"
        >
          <button
            v-for="(gens, i) in generators"
            :key="`generator_${i}`"
            class="w-[8em] md:w-[12em] text-center py-2 px-4"
            :class="{
              'text-white rounded-[10px] bg-surface-3':
                generator?.code === gens.code,
            }"
            @click="generatorChanged(gens)"
          >
            {{ gens.name }}
          </button>
        </div>
      </div>
      <div
        class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow"
      >
        <FormKit
          v-slot="{ disabled }"
          :actions="false"
          type="form"
          @submit="generate"
        >
          <div class="p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
            <div class="relative pb-1 grow">
              <FormKit
                v-model="request.prompt"
                :placeholder="`Enter ${generator?.name} Description`"
                inner-class="border-none"
                input-class="$reset input-secondary border-none focus:ring-fuchsia-500 resize-none pr-[8em]"
                help-class="px-1"
                name="prompt"
                type="textarea"
                validation="length:0,1000"
                auto-height
              />
              <div class="absolute top-1 right-1">
                <button
                  v-if="!request.prompt"
                  class="button-gradient py-2 px-3 flex"
                  :disabled="!generator"
                  @click.prevent="quickConjure(generator?.code || 'characters')"
                >
                  <img
                    src="@/assets/icons/wand.svg"
                    alt="wand"
                    class="h-4 mr-1"
                  />
                  Surprise Me
                </button>
                <!-- prettier-ignore -->
                <button
                  v-else
                  class="button-gradient py-2 px-3 flex"
                  :disabled="(disabled as boolean)"
                  type="submit"
                >
                  <img
                    src="@/assets/icons/wand.svg"
                    alt="wand"
                    class="h-4 mr-1"
                  />
                  Conjure
                </button>
              </div>
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.prompt.length }} / 1000
              </div>
            </div>

            <div class="flex mt-4 mb-2 justify-center">
              <div
                class="flex gap-1 text-neutral-500 rounded-[10px] bg-surface-2 p-1 border border-surface-3 text-sm grow"
              >
                <button
                  v-for="(opt, i) in promptOptions"
                  :key="`prompt_option_${i}`"
                  class="grow text-center py-2 px-4"
                  :class="{
                    'text-white rounded-[10px] bg-surface-3':
                      promptOptionsTab === opt,
                  }"
                  @click.prevent="promptOptionsTab = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <div v-if="promptOptionsTab === 'Image Style'">
              <Select
                v-model="request.imageStylePreset"
                :options="imagePresetStyles"
                value-prop="code"
                display-prop="name"
                secondary
              />
            </div>
            <div
              v-if="promptOptionsTab === 'Image Prompt'"
              class="relative pb-1"
            >
              <FormKit
                v-model="request.imagePrompt"
                placeholder="Image prompt (optional)"
                inner-class="border-none"
                input-class="$reset input-secondary border-none rounded-[8px] focus:ring-fuchsia-500"
                help-class="px-1"
                type="textarea"
                name="image_prompt"
                validation="length:0,1000"
                auto-height
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.imagePrompt.length }} / 1000
              </div>
            </div>
            <div
              v-if="promptOptionsTab === 'Negative Prompt'"
              class="relative pb-1"
            >
              <FormKit
                v-model="request.imageNegativePrompt"
                placeholder="Negative image prompt (optional)"
                inner-class="border-none"
                input-class="$reset input-secondary border-none rounded-[8px] focus:ring-fuchsia-500"
                help-class="px-1"
                type="textarea"
                name="negative_prompt"
                validation="length:0,1000"
                auto-height
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.imageNegativePrompt.length }} / 1000
              </div>
            </div>
          </div>
        </FormKit>
      </div>
      <div class="text-lg mt-12 text-center">Sample Prompts</div>
      <div
        class="grid grid-cols-1 xl:grid-cols-3 text-neutral-500 mx-auto gap-4 mt-4"
      >
        <div
          v-for="(gens, i) in generators"
          :key="`sample_prompt_${i}`"
          class="rounded-[20px] bg-surface-2 p-4"
        >
          {{ gens.customizationHelpPrompt }}
        </div>
      </div>
    </div>
  </div>
  <div v-if="generating" class="flex justify-center items-center h-full">
    <div class="text-center">
      <Loader />
      <div class="text-2xl my-4">Conjuring</div>
      <div class="text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Conjurer, getConjurers, postConjure } from '@/api/generators.ts';
import { useRouter } from 'vue-router';
import { useQuickConjure, useSelectedCampaignId } from '@/lib/hooks.ts';
import Select from '../Core/Forms/Select.vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showError, showInfo } from '@/lib/notifications.ts';
import Loader from '../Core/Loader.vue';
import MeteorShower from '../Core/MeteorShower.vue';
import { AxiosError } from 'axios';

const router = useRouter();
const quickConjure = useQuickConjure();
const generators = ref<Conjurer[]>([]);
const promptOptions = ref(['Image Style', 'Image Prompt', 'Negative Prompt']);
const promptOptionsTab = ref(promptOptions.value[0]);
const generator = ref<Conjurer>();
const channel = useWebsocketChannel();

onMounted(async () => {
  await loadGenerators();
});

async function loadGenerators() {
  const generatorsReponse = await getConjurers();
  generators.value = generatorsReponse.data.data;
  generator.value = generatorsReponse.data.data[0];
  imagePresetStyles.value =
    generator.value?.supportedImageStylePresets?.map((style) => ({
      code: style,
      name: toTitleCase(style),
    })) || [];
}

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
const showExistinConjurationWarning = ref(false);
const existinConjurationOverride = ref(false);
const imagePresetStyles = ref<any[]>([]);

function generatorChanged(gen: Conjurer) {
  generator.value = gen;
  imagePresetStyles.value =
    generator.value.supportedImageStylePresets?.map((style) => ({
      code: style,
      name: toTitleCase(style),
    })) || [];
}

function toTitleCase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

async function generate() {
  if (!generator.value) {
    return;
  }

  if (!selectedCampaignId.value) {
    showInfo({ message: 'Please select a campaign first.' });
    return;
  }

  if (existingConjuration.value && !existinConjurationOverride.value) {
    showExistinConjurationWarning.value = true;
    return;
  }

  if (existinConjurationOverride.value) {
    existinConjurationOverride.value = false;
  }

  let generateResponse;
  try {
    generateResponse = await postConjure(generator.value.code, {
      count: 1,
      campaignId: selectedCampaignId.value || 0,
      ...request.value,
    });
  } catch (e) {
    const err = e as AxiosError;
    if (err.response?.status === 400) {
      showError({
        message: (err.response?.data as any)?.message,
      });
      return;
    }

    showError({ message: 'We encountered an error conjuring this image.' });
    return;
  }

  handleBeginConjuring(generateResponse.data);

  existingConjuration.value = true;
}

const animationDone = ref(false);
const generating = ref(false);
const imageGenerationFailed = ref(false);
const imageGenerationFailureReason = ref('');
const conjurationRequestId = ref<number | undefined>(undefined);
const createdConjuration = ref<any>(undefined);

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  animationDone.value = false;
  generating.value = true;

  conjurationRequestId.value = data.conjurationRequestId;

  channel.bind(ServerEvent.ConjurationCreated, function (data: any) {
    generating.value = false;
    createdConjuration.value = data;
    router.push(`/conjurations/view/${createdConjuration.value.id}`);
  });

  channel.bind(ServerEvent.ConjurationError, function () {
    generating.value = false;
    showError({
      message:
        'There was a server error creating your conjuration. Reach out to support for help resolving this issue.',
    });
  });

  channel.bind(ServerEvent.ImageCreated, function (data: any) {
    createdConjuration.value.imageUri = data.uri;
  });

  channel.bind(ServerEvent.ImageFiltered, function () {
    const message =
      'The generated image was filtered out by our content moderation system. Please try again.';
    showError({
      message,
    });
    imageGenerationFailed.value = true;
    imageGenerationFailureReason.value = message;
  });

  channel.bind(ServerEvent.ImageError, function (data: any) {
    showError({
      message: data.message,
    });
    imageGenerationFailed.value = true;
    imageGenerationFailureReason.value = data.message;
  });
}

onUnmounted(() => {
  channel.unbind(ServerEvent.ConjurationCreated);
  channel.unbind(ServerEvent.ConjurationError);
  channel.unbind(ServerEvent.ImageCreated);
  channel.unbind(ServerEvent.ImageFiltered);
  channel.unbind(ServerEvent.ImageError);
});
</script>

<style lang="scss">
.purple-shadow {
  box-shadow:
    0px 0px 35px -5px rgba(#c952e9, 0.2),
    0px 0px 20px -6px rgba(#c952e9, 0.2);
}
</style>
