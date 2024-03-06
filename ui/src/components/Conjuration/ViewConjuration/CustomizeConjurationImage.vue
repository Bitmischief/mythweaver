<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import LightboxImage from '@/components/LightboxImage.vue';
import { conjureImage } from '@/api/images.ts';
import { useEventBus } from '@/lib/events.ts';
import {
  ArrowsPointingOutIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/20/solid';
import { showError } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Select from '@/components/Core/Forms/Select.vue';
import Loader from '@/components/Core/Loader.vue';
import { AxiosError } from 'axios';

const props = defineProps<{
  prompt?: string;
  negativePrompt?: string;
  imageUri?: string;
  looks?: string;
  noActions?: boolean;
  cancelButtonTextOverride?: string;
  inModal?: boolean;
}>();

const emit = defineEmits(['cancel']);

const eventBus = useEventBus();
const channel = useWebsocketChannel();

const editablePrompt = ref(props.prompt);
const editableNegativePrompt = ref(props.negativePrompt);
const imagePresetStyles = ref([
  { code: 'fantasy-art', name: 'Fantasy Art' },
  { code: 'digital-art', name: 'Digital Art' },
  { code: 'comic-book', name: 'Comic Book' },
]);
const stylePreset = ref<
  'fantasy-art' | 'digital-art' | 'comic-book' | undefined
>('fantasy-art');
const conjuring = ref(false);
const done = computed(() => {
  return imageUris.value.length > 0;
});
const imageUris = ref<string[]>([]);
const selectedImgUri = ref('');
const imageError = ref(false);
const imageFiltered = ref(false);
const imagePromptRephrased = ref(false);
const rephrasedPrompt = ref('');
const loading = ref(false);
const count = ref(1);

const promptOptions = ref(['Image Count', 'Image Style', 'Negative Prompt']);
const promptOptionsTab = ref(promptOptions.value[0]);

onMounted(async () => {
  eventBus.$on('conjure-image', async () => {
    await conjure();
  });

  eventBus.$on('set-selected-conjuration-image', () => {
    setImage();
  });

  channel.bind(ServerEvent.ImageCreated, function (data: any) {
    imageUris.value.push(data.uri);
    conjuring.value = false;
  });

  channel.bind(ServerEvent.ImageFiltered, function () {
    showError({
      message:
        'The generated image was filtered out by our content moderation system. Please try again.',
    });
    imageFiltered.value = true;
    conjuring.value = false;
  });

  channel.bind(ServerEvent.ImagePromptRephrased, function (prompt: string) {
    imagePromptRephrased.value = true;
    rephrasedPrompt.value = prompt;
  });

  channel.bind(ServerEvent.ImageError, function (data: any) {
    showError({
      message: data.message,
    });
    imageError.value = true;
    conjuring.value = false;
  });

  channel.bind(ServerEvent.ImageGenerationDone, function () {
    loading.value = false;
  });
});

onUnmounted(() => {
  eventBus.$off('conjure-image');
});

async function conjure() {
  try {
    conjuring.value = true;
    imageError.value = false;
    imageFiltered.value = false;
    loading.value = true;

    await conjureImage(
      editablePrompt.value || '',
      editableNegativePrompt.value || '',
      stylePreset.value || 'fantasy-art',
      count.value || 1,
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

function setImage() {
  if (!selectedImgUri.value.length) return;

  eventBus.$emit('updated-conjuration-image', {
    imageUri: selectedImgUri.value,
    prompt: editablePrompt.value,
  });

  if (props.inModal) {
    eventBus.$emit('toggle-customize-image-modal');
  }
}
</script>

<template>
  <template v-if="!conjuring && !done">
    <div v-if="imageUri" class="md:flex mb-4 justify-center mt-4">
      <div class="relative">
        <LightboxImage
          :src="imageUri"
          class="w-72 h-72 mx-auto md:my-auto rounded-[25px]"
        />
        <div class="image-badge">Original</div>
      </div>
    </div>
    <div v-else class="text-neutral-400 text-center mb-2">
      Enter a description of you character below to generate a character
      portrait
    </div>

    <div
      class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow min-w-[90vw] md:min-w-[60vw] lg:max-w-[40vw] max-h-[80vh]"
    >
      <div class="p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
        <FormKit :actions="false" type="form" @submit="conjure">
          <div class="relative pb-1">
            <FormKit
              v-model="editablePrompt"
              :placeholder="`Enter Description`"
              inner-class="border-none"
              input-class="$reset input-secondary border-none focus:ring-fuchsia-500 pr-[8em]"
              help-class="px-1"
              name="prompt"
              type="textarea"
              validation="required|length:0,1000"
              auto-height
              validation-visibility="live"
            />
            <div class="absolute top-1 right-1">
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
              v-model="stylePreset"
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
            />
            <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
              {{ editableNegativePrompt?.length }} / 500
            </div>
          </div>
        </FormKit>
      </div>
    </div>
    <button
      class="px-4 rounded-full absolute right-0 top-0 p-4"
      @click="emit('cancel')"
    >
      <XCircleIcon class="w-6 self-center" />
    </button>
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
  <template v-else-if="done && !conjuring && imageUris.length">
    <button
      class="px-4 rounded-full absolute right-0 top-0 p-4"
      @click="emit('cancel')"
    >
      <XCircleIcon class="w-6 self-center" />
    </button>
    <div class="">
      <div v-if="!noActions" class="mt-6 flex justify-end py-2">
        <button
          class="button-primary mr-2 flex"
          @click="
            imageUris = [];
            conjuring = false;
          "
        >
          <ArrowPathIcon class="w-5 mr-1" />
          Regenerate
        </button>
        <button
          class="button-ghost"
          :class="{
            'opacity-50 cursor-default': !selectedImgUri.length,
            'transition-all hover:scale-110': selectedImgUri.length,
          }"
          @click="setImage"
        >
          <span class="self-center text-center w-full"> Save Image </span>
        </button>
      </div>
    </div>

    <div
      v-if="imagePromptRephrased"
      class="bg-fuchsia-500/10 w-fit mx-auto mb-6 p-4 rounded-md"
    >
      <div class="text-xl text-neutral-400">
        We rephrased your prompt to make it more likely to generate an image.
      </div>
      <div class="mt-2 text-lg text-left text-neutral-100">
        <span class="font-bold text-neutral-400">Original:</span>
        {{ editablePrompt }}
      </div>
      <div class="text-lg text-left text-neutral-100">
        <span class="font-bold text-neutral-400">Rephrased:</span>
        {{ rephrasedPrompt }}
      </div>
    </div>

    <div class="grid gap-8 grid-cols-2">
      <div v-if="imageUri" class="relative">
        <div
          class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
          @click="eventBus.$emit('open-lightbox', imageUri)"
        >
          <ArrowsPointingOutIcon
            class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
          />
        </div>
        <img
          :src="imageUri"
          class="rounded-[25px] cursor-pointer"
          :class="{
            'border-2 border-fuchsia-500': selectedImgUri === imageUri,
          }"
          width="400px"
          @click="
            selectedImgUri === imageUri
              ? (selectedImgUri = '')
              : (selectedImgUri = imageUri)
          "
        />
        <div class="image-badge">Original</div>
      </div>

      <div
        v-for="imgUri of imageUris"
        :key="imgUri"
        class="relative cursor-pointer"
      >
        <div
          class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
          @click="eventBus.$emit('open-lightbox', imgUri)"
        >
          <ArrowsPointingOutIcon
            class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
          />
        </div>

        <img
          :src="imgUri"
          class="rounded-[25px]"
          :class="{ 'border-2 border-fuchsia-500': selectedImgUri === imgUri }"
          width="400px"
          @click="
            selectedImgUri === imgUri
              ? (selectedImgUri = '')
              : (selectedImgUri = imgUri)
          "
        />
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
