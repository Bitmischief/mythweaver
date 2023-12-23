<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import LightboxImage from '@/components/LightboxImage.vue';
import { conjureImage } from '@/api/images.ts';
import { useEventBus } from '@/lib/events.ts';
import { ArrowsPointingOutIcon } from '@heroicons/vue/20/solid';
import { showError } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';

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

onMounted(() => {
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
    );

    eventBus.$emit('conjure-image-done', {});
  } catch {
    showError({ message: 'We encountered an error conjuring this image.' });
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
    <div class="mt-4 bg-fuchsia-200/5 rounded-md py-3 pb-6 p-6">
      <div class="text-2xl 3xl:text-4xl">
        {{ prompt?.length ? 'Customize' : "Let's build a character" }}
      </div>
      <div class="mt-2 text-lg 3xl:text-2xl text-fuchsia-300">
        {{
          prompt?.length
            ? 'Modify the prompt for the AI engine to generate a new image'
            : 'What do they look like?'
        }}
      </div>
      <div class="mt-6 text-neutral-400">Example prompts:</div>
      <ul class="mt-4">
        <li class="mb-3 text-neutral-500 text-lg">
          - a male human wizard with a staff and a spellbook
        </li>
        <li class="mb-3 text-neutral-500 text-lg">
          - battle scene with futuristic robots and a golden palace in the
          background
        </li>
        <li class="text-neutral-500 text-lg">
          - ancient castle at night, with a full moon, gargoyles, and shadows
        </li>
      </ul>
    </div>

    <div class="md:flex mb-4 md:justify-between mt-4">
      <LightboxImage
        v-if="imageUri"
        :src="imageUri"
        class="w-72 h-72 mx-auto md:my-auto rounded-md"
      />
      <div :class="{ 'md:ml-4': prompt?.length }">
        <template v-if="prompt?.length">
          <div class="mt-2 md:mt-0 text-md text-neutral-500">
            Original Prompt
          </div>
          <div class="md:text-lg text-neutral-200">
            {{ props.prompt }}
          </div>
        </template>

        <template v-if="props.looks">
          <div class="text-md text-neutral-500 mt-4">Looks</div>
          <div class="text-lg text-neutral-200">
            {{ props.looks }}
          </div>
        </template>
      </div>
    </div>

    <FormKit
      v-slot="{ disabled }"
      type="form"
      :actions="false"
      @submit="conjure"
    >
      <FormKit
        v-model="editablePrompt"
        type="textarea"
        label="Prompt"
        validation="length:0,500"
        placeholder="a male human paladin with a longsword and shield"
        auto-height
      />

      <FormKit
        v-model="editableNegativePrompt"
        type="textarea"
        label="Negative prompt"
        validation="length:0,500"
        placeholder="hands, low-resolution"
        auto-height
      />

      <FormKit
        v-model="stylePreset"
        type="select"
        label="Preset Image Style"
        :options="{
          'fantasy-art': 'Fantasy Art',
          'digital-art': 'Digital Art',
          'comic-book': 'Comic Book',
        }"
      />

      <div v-if="!noActions" class="flex">
        <button
          class="ml-2 bg-neutral-800 px-4 text-lg rounded-md flex transition-all h-12 hover:scale-110 mr-2"
          @click="emit('cancel')"
        >
          <span class="self-center">{{
            cancelButtonTextOverride ? cancelButtonTextOverride : 'Cancel'
          }}</span>
        </button>
        <FormKit
          type="submit"
          :disabled="disabled as boolean"
          label="Conjure"
        />
      </div>
    </FormKit>
  </template>
  <template v-else-if="conjuring && !done">
    <div class="text-4xl text-neutral-500 mb-2">Conjuring...</div>
    <div class="text-lg text-neutral-500">
      This can take a minute or two to fully load
    </div>
    <svg
      class="animate-spin mx-auto my-8 h-16 w-16 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </template>
  <template v-else-if="done && !conjuring && imageUris.length">
    <div class="text-4xl text-neutral-500 mb-8">Voila!</div>

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

    <div
      class="grid gap-2"
      :class="{
        '3xl:grid-cols-3 grid-cols-2': !imageUri,
        '3xl:grid-cols-4 grid-cols-2': imageUri,
      }"
    >
      <div v-if="imageUri" class="relative">
        <div class="absolute w-full h-full bg-black/50 flex justify-center">
          <span class="self-center uppercase font-bold text-neutral-300"
            >Original</span
          >
        </div>
        <img :src="imageUri" />
      </div>

      <div
        v-for="imgUri of imageUris"
        :key="imgUri"
        class="relative cursor-pointer"
      >
        <div
          class="absolute flex bottom-2 right-2 cursor-pointer"
          @click="eventBus.$emit('open-lightbox', imgUri)"
        >
          <ArrowsPointingOutIcon
            class="w-8 h-8 self-center transition-all hover:scale-125"
          />
        </div>

        <img
          :src="imgUri"
          :class="{ 'border-2 border-fuchsia-500': selectedImgUri === imgUri }"
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

    <div v-if="!noActions" class="mt-6 flex justify-between">
      <button
        class="bg-surface-2 w-36 rounded-md border text-center border-gray-600/50 p-3"
        @click="
          imageUris = [];
          conjuring = false;
        "
      >
        Retry
      </button>
      <button
        class="bg-gradient-to-r text-lg md:w-52 from-fuchsia-500 flex to-blue-400 h-12 px-4 rounded-md"
        :class="{
          'opacity-50 cursor-default': !selectedImgUri.length,
          'transition-all hover:scale-110': selectedImgUri.length,
        }"
        @click="setImage"
      >
        <span class="self-center text-center w-full"> Continue </span>
      </button>
    </div>
  </template>
</template>
