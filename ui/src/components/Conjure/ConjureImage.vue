<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import LightboxImage from '@/components/LightboxImage.vue';
import {
  conjureImage,
  getConjurationImageHistory,
  patchPrimaryImage,
  postImageUpscale,
} from '@/api/images.ts';
import { fetchImageModels as getImageModels } from '@/modules/images/api/imageModels.ts';
import { useEventBus } from '@/lib/events.ts';
import {
  ArrowsPointingOutIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  CheckIcon,
  Square3Stack3DIcon,
} from '@heroicons/vue/20/solid';
import { showError } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Select from '@/components/Core/Forms/Select.vue';
import Loader from '@/components/Core/Loader.vue';
import { AxiosError } from 'axios';
import ImageCreditCount from '@/components/Core/ImageCreditCount.vue';
import { useAuthStore } from '@/store';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const authStore = useAuthStore();

const props = withDefaults(
  defineProps<{
    image?: {
      id?: number;
      prompt?: string;
      negativePrompt?: string;
      uri?: string;
      stylePreset?: string;
      seed?: string;
      modelId?: number;
    };
    noActions?: boolean;
    cancelButtonTextOverride?: string;
    saveButtonTextOverride?: string;
    inModal?: boolean;
    linking?: {
      sessionId?: number;
      characterId?: number;
      conjurationId?: number;
    };
    showImageCredits?: boolean;
    showBack?: boolean;
    historyMode?: boolean;
  }>(),
  {
    image: () => ({
      id: undefined,
      prompt: '',
      negativePrompt: '',
      uri: undefined,
      stylePreset: 'fantasy-art',
      seed: undefined,
      modelId: undefined,
    }),
    cancelButtonTextOverride: undefined,
    saveButtonTextOverride: undefined,
    linking: undefined,
    showImageCredits: true,
    showBack: false,
    historyMode: false,
  },
);

const emit = defineEmits(['cancel', 'back']);

const eventBus = useEventBus();
const channel = useWebsocketChannel();

const editablePrompt = ref(props.image.prompt);
const editableNegativePrompt = ref(props.image.negativePrompt);
const editableStylePreset = ref(props.image.stylePreset);
const editableImageModelId = ref(props.image.modelId);
const imagePresetStyles = ref([
  { code: 'fantasy-art', name: 'Fantasy Art (Default)' },
  { code: 'digital-art', name: 'Digital Art' },
  { code: 'comic-book', name: 'Comic Book' },
]);
const imageModels = ref<any[]>([]);
const conjuring = ref(false);
const upscaling = ref(false);

const done = computed(() => {
  return images.value.length > 0;
});

const images = ref<any[]>([]);
const selectedImg = ref<any>(null);
const imageError = ref(false);
const imageErrorMessage = ref('');
const imageFiltered = ref(false);
const imagePromptRephrased = ref(false);
const rephrasedPrompt = ref('');
const loading = ref(false);
const count = ref(1);
const useSeed = ref(false);
const tab = ref(
  props.historyMode ? 'history' : props.image?.uri ? 'upscale' : 'customize',
);
const imageHistory = ref<any[]>([]);

const showAdvancedOptions = ref(false);

onMounted(async () => {
  eventBus.$on('conjure-image', async () => {
    await conjure();
  });

  channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.bind(ServerEvent.ImagePromptRephrased, imagePromptRephrasedHandler);
  channel.bind(ServerEvent.ImageError, imageErrorHandler);
  channel.bind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.bind(
    ServerEvent.ImageGenerationTimeout,
    imageGenerationTimeoutHandler,
  );

  await fetchImageModels();
  if (props.image.uri || props.historyMode) {
    await fetchImageHistory();
  }
});

const timeoutRef = ref();
const timeoutDuration = ref(60000);
const timedOut = ref(false);

function regenerate() {
  images.value = [];
  conjuring.value = false;
  imageTimeouts.value = 0;
  timedOut.value = false;
  clearTimeout(timeoutRef.value);
}

function imageCreatedHandler(data: any) {
  if (checkWebsocketContext(data)) {
    images.value.push(data.image);
    conjuring.value = false;
    loading.value = false;
    if (selectedImg.value === null) {
      selectedImg.value = data.image;
    }
  }
}

function imageFilteredHandler(data: any) {
  if (checkWebsocketContext(data)) {
    showError({
      message:
        'The returned image did not pass our NSFW content filter. Please rephrase your prompt to avoid NSFW content, and try again.',
    });
    imageFiltered.value = true;
    count.value--;

    if (count.value === 0) {
      conjuring.value = false;
      loading.value = false;
    }
  }
}

onUnmounted(() => {
  eventBus.$off('conjure-image');
  channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.unbind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.unbind(ServerEvent.ImagePromptRephrased, imagePromptRephrasedHandler);
  channel.unbind(ServerEvent.ImageError, imageErrorHandler);
  channel.unbind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.unbind(
    ServerEvent.ImageGenerationTimeout,
    imageGenerationTimeoutHandler,
  );
});

async function fetchImageModels() {
  try {
    const imageModelsResponse = await getImageModels();
    imageModels.value = imageModelsResponse.data.data.map((im: any) => ({
      ...im,
      description: `${im.description}${!im.licensedArt ? ' - artwork NOT licensed by MythWeaver' : ''}`,
    }));

    if (!props.image.modelId) {
      const defaultModel = imageModels.value.find((im) => im.default === true);
      if (defaultModel) {
        editableImageModelId.value = defaultModel.id;
      }
    }
  } catch {
    console.log('Unable to fetch image models');
  }
}

async function fetchImageHistory() {
  try {
    if (props.linking?.conjurationId) {
      const imageHistoryResponse = await getConjurationImageHistory(
        props.linking?.conjurationId,
      );
      imageHistory.value = imageHistoryResponse.data;
    }
  } catch {
    console.log('Unable to fetch image history');
  }
}

function imagePromptRephrasedHandler(prompt: string) {
  imagePromptRephrased.value = true;
  rephrasedPrompt.value = prompt;
}

function imageErrorHandler(data: any) {
  if (checkWebsocketContext(data)) {
    showError({
      message: data.message,
    });
    imageError.value = true;
    conjuring.value = false;
    upscaling.value = false;
  }
}

function imageUpscaledHandler(data: any) {
  if (data.imageId === props.image.id) {
    selectedImg.value = data;
    upscaling.value = false;
    if (props.inModal) {
      eventBus.$emit('toggle-customize-image-modal');
    }
  }
}

const imageTimeouts = ref(0);

function imageGenerationTimeoutHandler(data: any) {
  if (checkWebsocketContext(data)) {
    imageTimeouts.value += 1;
    if (imageTimeouts.value === count.value) {
      imageErrorMessage.value =
        'The image generation was taking longer than normal so the request was cancelled. You have not been charged any credits. This issue could be due to a high traffic or a temporary provider outage. Please try again.';
      imageError.value = true;
      conjuring.value = false;
      upscaling.value = false;
      imageTimeouts.value = 0;
    }
  }
}

function checkWebsocketContext(data: any) {
  if (props.linking?.conjurationId) {
    return data.context?.conjurationId === props.linking?.conjurationId;
  } else if (props.linking?.sessionId) {
    return data.context?.sessionId === props.linking?.sessionId;
  } else if (props.linking?.characterId) {
    return data.context?.characterId === props.linking?.characterId;
  } else {
    return true;
  }
}

async function conjure() {
  try {
    conjuring.value = true;
    imageError.value = false;
    imageFiltered.value = false;
    loading.value = true;
    selectedImg.value = null;

    await conjureImage(
      editablePrompt.value || '',
      editableNegativePrompt.value || '',
      editableStylePreset.value || 'fantasy-art',
      count.value || 1,
      useSeed.value ? props.image.seed : undefined,
      props.linking,
      editableImageModelId.value || undefined,
    );
    timeoutRef.value = setTimeout(
      (d) => {
        d.value = true;
      },
      timeoutDuration.value,
      timedOut,
    );
    eventBus.$emit('conjure-image-done', {});
  } catch (e) {
    const err = e as AxiosError;

    imageError.value = true;
    conjuring.value = false;

    if (err.response?.status === 400) {
      showError({
        message: (err.response?.data as any)?.message,
      });
      return;
    }

    showError({ message: 'We encountered an error conjuring this image.' });
    return;
  }
}

const retryConjure = async () => {
  timedOut.value = false;
  const retryCount = count.value - images.value.length;
  if (retryCount >= 1) {
    await conjureImage(
      editablePrompt.value || '',
      editableNegativePrompt.value || '',
      editableStylePreset.value || 'fantasy-art',
      retryCount,
      useSeed.value ? props.image.seed : undefined,
      props.linking,
      editableImageModelId.value || undefined,
    );
  }
};

async function setImage() {
  if (!selectedImg?.value) return;
  await patchPrimaryImage(selectedImg.value.id);
  if (props.inModal) {
    eventBus.$emit('toggle-customize-image-modal');
  }
}

async function upscale() {
  try {
    if (props.image.id) {
      upscaling.value = true;
      await postImageUpscale(props.image.id);
    }
  } catch (e: any) {
    showError({
      message: 'Something went wrong upscaling the image, please try again.',
    });
    upscaling.value = false;
  }
}

const alreadyUpscaled = computed(() => {
  if (!props.image.uri) return false;
  const img = new Image();
  img.src = props.image.uri;
  return img.width > 1024 || img.height > 1024;
});

const savePrimaryImage = async (image: any) => {
  selectedImg.value = image;
  await setImage();
};

const editsViewing = ref<any[]>([]);

const viewEditHistory = async (image: any) => {
  editsViewing.value = image.edits;
};

const selectedImageModel = computed(() => {
  if (!editableImageModelId.value || !imageModels.value.length) return;
  return imageModels.value.find((im) => im.id === editableImageModelId.value);
});

const selectedModelIsMythWeaverV1 = computed(() => {
  if (!selectedImageModel.value) return false;

  const v1Model = imageModels.value.find((im) =>
    im.description.includes('MythWeaver v1'),
  );
  return selectedImageModel.value?.id === v1Model?.id;
});
</script>

<template>
  <div v-if="imageError && imageErrorMessage" class="text-sm text-red-500">
    {{ imageErrorMessage }}
  </div>
  <template v-if="!conjuring && !upscaling && !done">
    <div
      v-if="showImageCredits || inModal"
      class="md:pb-4"
      :class="{ 'absolute right-2 top-0 p-4': image.uri }"
    >
      <div class="flex justify-end">
        <div class="self-center">
          <ImageCreditCount v-if="authStore.user && showImageCredits" />
        </div>
        <button
          v-if="inModal"
          class="px-4 rounded-full"
          @click="emit('cancel')"
        >
          <XCircleIcon class="w-6 self-center" />
        </button>
      </div>
    </div>
    <div v-if="image.uri" class="md:flex mb-4 justify-center mt-10">
      <div class="relative">
        <LightboxImage
          :src="image.uri"
          class="max-w-[85vw] md:max-w-[25vw] mx-auto md:my-auto rounded-[25px]"
        />
        <div class="image-badge">Original</div>
      </div>
    </div>
    <div
      v-else-if="linking?.characterId"
      class="text-neutral-400 text-center mb-2 mt-10"
    >
      Enter a description of you character below to generate a character
      portrait
    </div>
    <div
      v-else-if="linking?.sessionId"
      class="text-neutral-400 text-center mb-2 mt-10"
    >
      Enter a description of you session below to generate a session cover image
    </div>
    <div v-if="props.image.uri || historyMode" class="flex justify-center mb-2">
      <div
        class="flex flex-wrap md:flex-nowrap gap-1 text-neutral-500 rounded-[18px] bg-surface-2 p-1 border border-surface-3 text-sm"
      >
        <button
          v-if="!historyMode"
          class="grow w-[12em]"
          :class="{
            'button-primary': tab === 'upscale',
            'button-surface-2': tab !== 'upscale',
          }"
          @click="tab = 'upscale'"
        >
          Upscale Image
        </button>
        <button
          class="grow w-[12em]"
          :class="{
            'button-primary': tab === 'history',
            'button-surface-2': tab !== 'history',
          }"
          @click="tab = 'history'"
        >
          Image History
        </button>
      </div>
    </div>
    <FormKit
      v-if="tab === 'customize'"
      :actions="false"
      type="form"
      @submit="conjure"
    >
      <div class="flex justify-between mb-4 mt-3">
        <div v-if="showBack">
          <button class="button-primary flex gap-2 z-10" @click="emit('back')">
            <ArrowLeftIcon class="h-5 w-5 self-center" />
            <span class="self-center">Back</span>
          </button>
        </div>
        <div class="grow flex justify-end px-2">
          <button
            class="flex button-gradient py-2 px-3 disabled:opacity-75"
            type="submit"
          >
            <img src="@/assets/icons/wand.svg" alt="wand" class="h-4 mr-1" />
            Conjure
            <ArrowRightIcon class="h-5 ml-1 self-center" />
          </button>
        </div>
      </div>
      <div
        class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow min-w-[90vw] md:min-w-[60vw]"
      >
        <div class="p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
          <div class="flex content-stretch">
            <div class="relative pb-1 grow">
              <FormKit
                v-model="editablePrompt"
                :placeholder="`Enter Description`"
                inner-class="border-none"
                input-class="$reset input-secondary border-none focus:ring-fuchsia-500"
                help-class="px-1"
                name="prompt"
                type="textarea"
                validation="required|length:0,1000"
                auto-height
                validation-visibility="live"
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ editablePrompt?.length }} / 1000
              </div>
            </div>
          </div>
          <div class="flex flex-wrap md:flex-nowrap gap-6 mt-4 px-4 relative">
            <div class="grow max-w-full">
              <div class="text-neutral-300 text-xs mb-1">Image Model</div>
              <div class="flex grow gap-2">
                <Select
                  v-model="editableImageModelId"
                  :options="imageModels"
                  placeholder="Image Model"
                  value-prop="id"
                  display-prop="description"
                  secondary
                  class="w-full min-w-[10em]"
                />
              </div>
            </div>
            <div class="flex gap-6">
              <div>
                <div class="text-neutral-300 text-xs mb-1">Image Count</div>
                <div class="flex grow gap-2 py-1">
                  <button
                    :class="{
                      'button-ghost': count === 1,
                      'button-ghost-primary': count !== 1,
                    }"
                    @click.prevent="count = 1"
                  >
                    1
                  </button>
                  <button
                    :class="{
                      'button-ghost': count === 2,
                      'button-ghost-primary': count !== 2,
                    }"
                    @click.prevent="count = 2"
                  >
                    2
                  </button>
                  <button
                    :class="{
                      'button-ghost': count === 3,
                      'button-ghost-primary': count !== 3,
                    }"
                    @click.prevent="count = 3"
                  >
                    3
                  </button>
                </div>
              </div>
              <div v-if="image.seed" class="group">
                <div class="text-neutral-300 text-xs mb-1">
                  Use Same Image Seed?
                </div>
                <div class="flex grow gap-2 py-1 justify-around">
                  <button
                    :class="{
                      'button-ghost': useSeed,
                      'button-ghost-primary': !useSeed,
                    }"
                    @click.prevent="useSeed = true"
                  >
                    Yes
                  </button>
                  <button
                    :class="{
                      'button-ghost': !useSeed,
                      'button-ghost-primary': useSeed,
                    }"
                    @click.prevent="useSeed = false"
                  >
                    No
                  </button>
                </div>
                <div
                  class="absolute text-left px-2 py-2 bottom-[calc(100%+10px)] right-0 bg-surface-3 rounded-[12px] z-30 invisible group-hover:visible"
                >
                  <div>
                    Choosing 'Yes' will allow you to make alterations to your
                    prompt while keeping the overall image the same.
                  </div>
                  <div>
                    We recommend leaving this as 'No' if you are unfamiliar with
                    image seeds.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="editableImageModelId && selectedImageModel" class="p-4">
            <div
              v-if="selectedImageModel.licensedArt"
              class="px-1 mb-2 text-sm text-fuchsia-500"
            >
              This is a brand new model that is still development. You may
              experience longer image generation times and sometimes may get
              weird results. We welcome any feedback in Discord or via our
              support center. We expect these models to improve over time as we
              refine them.
            </div>
            <div
              v-if="selectedImageModel.licensedArt"
              class="bg-green-500 w-fit text-white p-3 rounded-xl mb-4"
            >
              <div class="flex">
                <div class="self-center">
                  <CheckIcon class="h-5 w-5 mr-2" aria-hidden="true" />
                </div>
                <div>
                  This model uses artwork licensed by MythWeaver directly from
                  the listed "Featured Artists".
                </div>
              </div>

              <div v-if="selectedImageModel.paysRoyalties" class="flex">
                <CheckIcon class="h-5 w-5 mr-2" aria-hidden="true" />
                <div>
                  This model pays royalties to the artist(s) for each image
                  generated.
                </div>
              </div>
            </div>
            <div
              v-else
              class="bg-orange-500 w-fit text-white p-3 rounded-xl mb-4"
            >
              <div class="text-xl">
                MythWeaver has not licensed the art in this model.
              </div>
              This model will eventually be deprecated and removed from
              MythWeaver.
              <div>
                Please consider using a licensed model and supporting our
                amazing partner artists.
              </div>
              <div>
                You can read more about Stable Diffusion (the model powering
                MythWeaver v1)
                <a href="https://stability.ai/stable-image" class="underline">
                  here </a
                >.
              </div>
            </div>

            <div class="mb-4">
              <div class="text-neutral-400">Model Strengths</div>
              <div class="text-neutral-200">
                {{ selectedImageModel.strengths?.join(', ') }}
              </div>
            </div>
            <div class="flex flex-wrap lg:flex-nowrap gap-6">
              <div class="lg:basis-2/3">
                <div class="text-neutral-400">Sample Output</div>
                <div
                  :key="`sample_${selectedImageModel.id}`"
                  class="flex flex-wrap md:flex-nowrap gap-6"
                >
                  <div
                    v-for="(sampleUri, i) in selectedImageModel.sampleImageUris"
                    :key="`sample_${i}`"
                  >
                    <img :src="sampleUri" alt="sample" class="rounded-[12px]" />
                  </div>
                </div>
              </div>
              <div class="lg:basis-1/3">
                <div class="text-neutral-400">Featured Artists</div>
                <div
                  v-if="!selectedImageModel.artists.length"
                  class="h-full flex flex-col justify-center"
                >
                  <div class="text-neutral-500 text-center">
                    None For This Model
                  </div>
                </div>
                <div
                  v-for="(artist, i) in selectedImageModel.artists"
                  :key="`artist_${i}`"
                  class="flex gap-2 my-2"
                >
                  <img
                    :src="artist.artist.profilePicUri"
                    alt="sample"
                    width="75"
                    height="75"
                    class="self-center rounded-full"
                  />
                  <div class="basis-2/3 self-center">
                    <div class="text-lg text-neutral-200">
                      {{ artist.artist.name }}
                    </div>
                    <div>
                      <a
                        :href="artist.artist.callToActionUri"
                        target="_blank"
                        class="text-sm text-fuchsia-500"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex text-sm text-neutral-300 cursor-pointer p-2 rounded-[12px] hover:bg-surface-3/50 my-2"
            @click="showAdvancedOptions = !showAdvancedOptions"
          >
            <div class="self-center">Advanced Options</div>
            <ChevronRightIcon
              class="h-6 transition-all"
              :class="{ 'rotate-90': showAdvancedOptions }"
            />
          </div>
          <div v-if="showAdvancedOptions">
            <div v-if="selectedModelIsMythWeaverV1" class="my-2">
              <Select
                v-model="editableStylePreset"
                :options="imagePresetStyles"
                placeholder="Image Style"
                value-prop="code"
                display-prop="name"
                secondary
              />
            </div>
            <div class="relative pb-1">
              <FormKit
                v-model="editableNegativePrompt"
                placeholder="Negative image prompt (optional)"
                inner-class="border-none"
                input-class="$reset input-secondary border-none focus:ring-fuchsia-500"
                help-class="px-1"
                type="textarea"
                name="negative_prompt"
                validation="length:0,500"
                auto-height
                help="The negative prompt is used to tell the AI what you DON'T want in your image. This is not a magic bullet, and can't guarantee anything, but does help to guide your output in the direction you want."
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ editableNegativePrompt?.length }} / 500
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormKit>
    <div
      v-if="tab === 'upscale'"
      class="p-6 border border-neutral-800 rounded-[20px]"
    >
      <div v-if="alreadyUpscaled">This image has already been upscaled.</div>
      <div v-else>
        <div class="text-center text-neutral-400 mt-4">
          Upscale your image to a higher resolution (2048&#215;2048)
        </div>
        <div class="flex justify-center mt-4">
          <button class="button-gradient" @click="upscale">
            Upscale Image
          </button>
        </div>
      </div>
    </div>
    <div v-if="tab === 'history'">
      <div v-if="editsViewing.length" class="flex gap-2 mb-4">
        <div>
          <button
            class="button-gradient-blue flex gap-2"
            @click="editsViewing = []"
          >
            <ArrowLeftIcon class="h-5 w-5" />
            Back to history
          </button>
        </div>
      </div>
      <div
        v-if="editsViewing.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="(edit, i) in editsViewing"
          :key="`edit_history_${i}`"
          class="relative group/image mx-4 md:mx-0"
        >
          <img
            :src="edit.uri"
            alt="image"
            class="rounded-[20px] group-hover/image:opacity-50"
          />
          <div
            v-if="edit.imageModel?.description"
            class="absolute flex bottom-2 right-2 cursor-pointer bg-neutral-500/50 rounded-[8px]"
          >
            <div class="text-neutral-300 text-sm px-2">
              {{ edit.imageModel?.description }}
            </div>
          </div>
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/image:block"
          >
            <div class="flex flex-col justify-center gap-2">
              <button class="button-gradient" @click="savePrimaryImage(edit)">
                Set as image
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="(img, i) in imageHistory"
          :key="`img_history_${i}`"
          class="relative group/image mx-4 md:mx-0"
        >
          <img
            :src="img.uri"
            alt="image"
            class="rounded-[20px] group-hover/image:opacity-50"
          />
          <div
            v-if="img.imageModel?.description"
            class="absolute flex bottom-2 right-2 cursor-pointer bg-neutral-500/50 rounded-[8px]"
          >
            <div class="text-neutral-300 text-sm px-2">
              {{ img.imageModel?.description }}
            </div>
          </div>
          <div v-if="img.edits" class="absolute top-5 right-5">
            <Square3Stack3DIcon class="h-8 w-8" />
          </div>
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/image:block"
          >
            <div class="flex flex-col justify-center gap-2">
              <button class="button-gradient" @click="savePrimaryImage(img)">
                Set as image
              </button>
              <button
                v-if="img.edits?.length"
                class="button-gradient-blue"
                @click="viewEditHistory(img)"
              >
                View Edit History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  <template v-else-if="upscaling && !done">
    <div class="p-12 text-center">
      <Loader />
      <div class="text-3xl m-4">Upscaling</div>
      <div class="text-lg text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
  </template>
  <template v-else>
    <div v-if="showImageCredits || inModal" class="absolute right-2 top-0 p-4">
      <div class="flex justify-end">
        <div class="self-center">
          <ImageCreditCount v-if="authStore.user && showImageCredits" />
        </div>
        <button class="px-4 rounded-full" @click="emit('cancel')">
          <XCircleIcon class="w-6 self-center" />
        </button>
      </div>
    </div>
    <div
      v-if="!noActions"
      class="mx-4 md:mx-0 actions"
      :class="{ 'mt-10': showImageCredits || inModal }"
    >
      <div>
        <div class="text-sm text-neutral-500">
          {{ editablePrompt }}
        </div>
      </div>
      <div class="flex gap-2 px-4 md:px-0 justify-end py-2">
        <div class="self-center">
          <button
            v-if="timedOut && images.length < count"
            class="button-gradient"
            @click.prevent="retryConjure"
          >
            Retry Failed Images ({{ count - images.length }})
          </button>
        </div>
        <div class="self-center">
          <button class="button-primary flex" @click="regenerate">
            <ArrowPathIcon class="w-5 mr-1" />
            Regenerate
          </button>
        </div>
        <div class="self-center">
          <button
            class="button-ghost"
            :class="{
              'opacity-50 cursor-default': !selectedImg,
              'transition-all hover:scale-110': selectedImg,
            }"
            @click="setImage"
          >
            <span class="self-center text-center w-full">
              {{
                saveButtonTextOverride ? saveButtonTextOverride : 'Save Image'
              }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div
      class="flex flex-wrap lg:flex-nowrap gap-8 mt-4 justify-center place-items-stretch"
    >
      <div v-if="image.uri" class="w-full max-w-[90%] md:max-w-[45%]">
        <div class="relative w-full">
          <div
            class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
            @click="eventBus.$emit('open-lightbox', image.uri)"
          >
            <ArrowsPointingOutIcon
              class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
            />
          </div>
          <img
            :src="image.uri"
            alt="conjurationImg"
            class="rounded-[25px] cursor-pointer w-full"
            :class="{
              'border-2 border-fuchsia-500': selectedImg === null,
            }"
            @click="selectedImg = null"
          />
          <div class="image-badge">Original</div>
        </div>
      </div>

      <div
        v-for="img of images"
        :key="img.uri"
        class="relative cursor-pointer w-full max-w-[90%] md:max-w-[45%]"
        :class="{ 'md:col-span-2': !img.uri && images.length === 1 }"
      >
        <div class="relative w-full">
          <div
            class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
            @click="eventBus.$emit('open-lightbox', img.uri)"
          >
            <ArrowsPointingOutIcon
              class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
            />
          </div>

          <img
            :src="img.uri"
            alt="conjuration image"
            class="rounded-[25px]"
            :class="{
              'border-2 border-fuchsia-500': selectedImg?.id === img.id,
            }"
            @click="
              selectedImg?.id === img.id
                ? (selectedImg = null)
                : (selectedImg = img)
            "
          />
        </div>
      </div>
      <div
        v-for="placeholder of count - images.length"
        :key="`placeholder_${placeholder}`"
        class="relative aspect-square w-full max-w-[90%] md:max-w-[45%]"
        :class="{ 'md:col-span-2': images.length === 1 }"
      >
        <div
          v-if="!timedOut"
          class="flex flex-col h-full justify-center text-center bg-surface-2 rounded-[25px]"
        >
          <Loader />
          <div class="text-xl gradient-text my-4 animate-pulse">
            Conjuring...
          </div>
        </div>
        <div
          v-else
          class="flex flex-col h-full justify-center text-center bg-surface-2 rounded-[25px]"
        >
          <Loader />
          <div class="my-4 text-neutral-200">
            This Image Is Taking Longer Than Usual
          </div>
          <div class="text-neutral-500 text-xs px-6">
            This image is taking longer than expected to generate. You can retry
            the image generation or continue to wait. You will not be charged
            credits for images that fail to generate.
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
