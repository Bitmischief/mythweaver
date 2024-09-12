<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import LightboxImage from '@/components/LightboxImage.vue';
import {
  conjureImage,
  getConjurationImageHistory,
  patchPrimaryImage,
  postImageUpscale,
} from '@/api/images.ts';
import { useEventBus } from '@/lib/events.ts';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  XCircleIcon,
} from '@heroicons/vue/20/solid';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Select from '@/components/Core/Forms/Select.vue';
import Loader from '@/components/Core/Loader.vue';
import { AxiosError } from 'axios';
import ImageCreditCount from '@/components/Core/ImageCreditCount.vue';
import { useAuthStore } from '@/store';
import Inpainting from '@/components/Images/Inpainting.vue';

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
  }>(),
  {
    image: () => ({
      id: undefined,
      prompt: '',
      negativePrompt: '',
      uri: undefined,
      stylePreset: 'fantasy-art',
      seed: undefined,
    }),
    cancelButtonTextOverride: undefined,
    saveButtonTextOverride: undefined,
    linking: undefined,
    showImageCredits: true,
  },
);

const emit = defineEmits(['cancel']);

const eventBus = useEventBus();
const channel = useWebsocketChannel();

const editablePrompt = ref(props.image.prompt);
const editableNegativePrompt = ref(props.image.negativePrompt);
const editableStylePreset = ref(props.image.stylePreset);
const imagePresetStyles = ref([
  { code: 'fantasy-art', name: 'Fantasy Art' },
  { code: 'digital-art', name: 'Digital Art' },
  { code: 'comic-book', name: 'Comic Book' },
]);
const conjuring = ref(false);
const upscaling = ref(false);

const done = computed(() => {
  return images.value.length > 0;
});

const images = ref<any[]>([]);
const selectedImg = ref<any>(null);
const imageError = ref(false);
const imageFiltered = ref(false);
const imagePromptRephrased = ref(false);
const rephrasedPrompt = ref('');
const loading = ref(false);
const count = ref(1);
const useSeed = ref(false);
const edit = ref(false);
const tab = ref(props.image.uri ? 'upscale' : 'customize');
const imageHistory = ref<any[]>([]);

const promptOptions = ref(['Image Count', 'Image Style', 'Negative Prompt']);
const promptOptionsTab = ref(promptOptions.value[0]);

onMounted(async () => {
  eventBus.$on('conjure-image', async () => {
    await conjure();
  });

  channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.bind(ServerEvent.ImagePromptRephrased, imagePromptRephrasedHandler);
  channel.bind(ServerEvent.ImageError, imageErrorHandler);
  channel.bind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.bind(ServerEvent.ImageUpscalingDone, imageUpscalingDoneHandler);

  await fetchImageHistory();
});

function imageCreatedHandler(data: any) {
  if (data.context?.conjurationId === props.linking?.conjurationId) {
    images.value.push(data);
    conjuring.value = false;
    loading.value = false;
    if (selectedImg.value === null) {
      selectedImg.value = data;
    }
  }
}

function imageFilteredHandler(data: any) {
  if (data.context?.conjurationId === props.linking?.conjurationId) {
    showError({
      message:
        'The generated image was filtered out by our content moderation system. Please try again.',
    });
    imageFiltered.value = true;
    conjuring.value = false;
  }
}

onUnmounted(() => {
  eventBus.$off('conjure-image');
  channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.unbind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.unbind(ServerEvent.ImagePromptRephrased, imagePromptRephrasedHandler);
  channel.unbind(ServerEvent.ImageError, imageErrorHandler);
  channel.unbind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.unbind(ServerEvent.ImageUpscalingDone, imageUpscalingDoneHandler);
});

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
  if (data.context?.conjurationId === props.linking?.conjurationId) {
    showError({
      message: data.message,
    });
    imageError.value = true;
    conjuring.value = false;
    upscaling.value = false;
  }
}

function imageUpscaledHandler(data: any) {
  if (data.id === props.image.id) {
    selectedImg.value = data;
    upscaling.value = false;
    if (props.inModal) {
      eventBus.$emit('toggle-customize-image-modal');
    }
  }
}

function imageUpscalingDoneHandler(data: any) {
  if (data.id === props.image.id) {
    loading.value = true;
    showSuccess({ message: 'Image successfully upscaled!' });
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

async function setImage() {
  if (!selectedImg?.value) return;
  await patchPrimaryImage(selectedImg.value.id);
  if (props.inModal) {
    eventBus.$emit('toggle-customize-image-modal');
  }
}

async function upscale() {
  try {
    if (props.image.id && props.image.uri) {
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
</script>

<template>
  <template v-if="!conjuring && !upscaling && !done">
    <div
      v-if="showImageCredits || inModal"
      class="py-4"
      :class="{ 'absolute right-2 top-0': image?.uri }"
    >
      <div class="flex justify-between">
        <div v-if="!props.image?.uri" class="text-lg self-center">
          Conjure New Image
        </div>
        <div class="flex gap-2">
          <div class="self-center">
            <ImageCreditCount v-if="authStore?.user && showImageCredits" />
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
    </div>
    <div v-if="image.uri" class="md:flex mb-4 justify-center mt-10">
      <div class="relative">
        <LightboxImage
          :src="image.uri"
          class="w-72 h-72 mx-auto md:my-auto rounded-[25px]"
        />
        <div class="image-badge">Current</div>
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
    <div v-if="props.image.uri" class="flex justify-center mb-2">
      <div class="min-w-[50%]">
        <div
          class="flex flex-wrap gap-1 w-full text-neutral-500 rounded-[18px] bg-surface-2 p-1 border border-surface-3 text-sm"
        >
          <button
            class="grow"
            :class="{ 'button-primary': tab === 'upscale' }"
            @click="tab = 'upscale'"
          >
            Upscale Image
          </button>
          <button
            class="grow"
            :class="{ 'button-primary': tab === 'history' }"
            @click="tab = 'history'"
          >
            Image History
          </button>
        </div>
      </div>
    </div>
    <FormKit
      v-if="tab === 'customize'"
      :actions="false"
      type="form"
      @submit="conjure"
    >
      <div
        class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow min-w-[90vw] md:min-w-[60vw] max-h-[80vh]"
      >
        <div class="p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
          <div class="relative pb-1">
            <FormKit
              v-model="editablePrompt"
              :placeholder="`Enter Description`"
              inner-class="border-none"
              input-class="$reset input-secondary border-none focus:ring-fuchsia-500 md:pr-[8em]"
              help-class="px-1"
              name="prompt"
              type="textarea"
              validation="required|length:0,1000"
              auto-height
              validation-visibility="live"
            />
            <div class="hidden md:block absolute top-1 right-1">
              <button
                class="flex button-gradient py-2 px-3 disabled:opacity-75"
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
              {{ editablePrompt?.length }} / 1000
            </div>
          </div>
          <div class="flex px-2 relative">
            <div class="group">
              <FormKit
                v-if="image.seed"
                v-model="useSeed"
                type="checkbox"
                label="Use same image seed"
                wrapper-class="cursor-pointer"
              />
              <div
                class="absolute text-left px-2 py-2 bottom-[calc(100%+10px)] left-0 bg-surface-3 rounded-[12px] z-30 invisible group-hover:visible"
              >
                <div>
                  Checking this will allow you to make alterations to your
                  prompt while keeping the overall image the same.
                </div>
                <div>
                  Leave this unchecked if you want to create a new image not
                  inspired by the original.
                </div>
              </div>
            </div>
          </div>
          <div class="flex mb-2 justify-center">
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

          <div v-if="promptOptionsTab === 'Image Count'">
            <Select
              v-model="count"
              :options="[
                {
                  code: 1,
                  name: '1 image',
                },
                {
                  code: 2,
                  name: '2 image',
                },
                {
                  code: 3,
                  name: '3 image',
                },
              ]"
              value-prop="code"
              display-prop="name"
              secondary
            />
          </div>
          <div v-if="promptOptionsTab === 'Image Style'">
            <Select
              v-model="editableStylePreset"
              :options="imagePresetStyles"
              value-prop="code"
              display-prop="name"
              secondary
            />
          </div>
          <div
            v-if="promptOptionsTab === 'Negative Prompt'"
            class="relative pb-1"
          >
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
        <button
          class="md:hidden flex button-gradient py-4 px-3 disabled:opacity-75 w-full justify-center rounded-[20px]"
          type="submit"
        >
          <img src="@/assets/icons/wand.svg" alt="wand" class="h-4 mr-1" />
          Conjure
        </button>
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
      <div
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
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/image:block"
          >
            <button class="button-gradient" @click="savePrimaryImage(img)">
              Set as image
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  <template v-else-if="conjuring && !done && !imageError">
    <div class="p-12 text-center">
      <Loader />
      <div class="text-3xl m-4">Conjuring</div>
      <div class="text-lg text-neutral-500">
        This can take a minute or two to fully load
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
  <template v-else-if="done && !conjuring && images.length">
    <div v-if="showImageCredits || inModal" class="absolute right-2 top-0 p-4">
      <div class="flex justify-end">
        <div class="self-center">
          <ImageCreditCount v-if="authStore?.user && showImageCredits" />
        </div>
        <button class="px-4 rounded-full" @click="emit('cancel')">
          <XCircleIcon class="w-6 self-center" />
        </button>
      </div>
    </div>
    <div v-if="!noActions" class="mx-4 md:mx-0 mt-10 actions">
      <div class="flex justify-end py-2">
        <button
          class="button-primary mr-2 flex"
          @click="
            images = [];
            conjuring = false;
          "
        >
          <ArrowPathIcon class="w-5 mr-1" />
          Regenerate
        </button>
        <button class="button-primary mr-2 flex" @click="edit = true">
          Edit
        </button>
        <button
          class="button-ghost"
          :class="{
            'opacity-50 cursor-default': !selectedImg,
            'transition-all hover:scale-110': selectedImg,
          }"
          @click="setImage"
        >
          <span class="self-center text-center w-full">
            {{ saveButtonTextOverride ? saveButtonTextOverride : 'Save Image' }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap lg:flex-nowrap gap-8 justify-center">
      <div v-if="image?.uri" class="relative max-w-full">
        <div
          class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
          @click="eventBus.$emit('open-lightbox', image?.uri)"
        >
          <ArrowsPointingOutIcon
            class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
          />
        </div>
        <img
          :src="image?.uri"
          alt="conjurationImg"
          class="rounded-[25px] cursor-pointer w-full max-w-[500px]"
          :class="{
            'border-2 border-fuchsia-500': selectedImg === null,
          }"
          @click="selectedImg = null"
        />
        <div class="image-badge">Original</div>
      </div>

      <div
        v-for="img of images"
        :key="img.uri"
        class="relative cursor-pointer w-full max-w-[500px]"
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
      <div v-if="edit">
        <Inpainting image-src="image.uri" />
      </div>

      <div
        v-if="loading"
        class="flex justify-center min-h-[20rem] text-fuchsia-200 animate-pulse text-2xl"
      >
        <div class="self-center">Generating image....</div>
      </div>
    </div>
  </template>
</template>
