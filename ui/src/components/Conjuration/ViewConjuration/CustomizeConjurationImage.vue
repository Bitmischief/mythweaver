<script lang="ts" setup>
import { ref } from 'vue';
import LightboxImage from '@/components/LightboxImage.vue';
import { conjureImage } from '@/api/images.ts';
import { useEventBus } from '@/lib/events.ts';
import { ArrowsPointingOutIcon } from '@heroicons/vue/20/solid';

const props = defineProps<{
  prompt: string;
  imageUri: string;
  looks: string;
}>();

const emit = defineEmits(['cancel']);

const eventBus = useEventBus();

const editablePrompt = ref(props.prompt);
const conjuring = ref(false);
const done = ref(false);
const imageUris = ref([] as string[]);
const selectedImgUri = ref('');

async function conjure() {
  conjuring.value = true;
  done.value = false;

  const conjureImageResponse = await conjureImage(editablePrompt.value);
  imageUris.value = conjureImageResponse.data;
  done.value = true;
  conjuring.value = false;
}

function setImage() {
  if (!selectedImgUri.value.length) return;

  eventBus.$emit('updated-conjuration-image', {
    imageUri: selectedImgUri.value,
    prompt: editablePrompt.value,
  });
}
</script>

<template>
  <template v-if="!conjuring && !done">
    <div class="text-4xl">Customize</div>
    <div class="text-2xl mt-4 text-fuchsia-300">
      Modify the prompt for the AI engine to generate a new image
    </div>

    <div class="md:flex md:justify-between mt-8">
      <LightboxImage :src="imageUri" class="w-72 h-72 my-auto rounded-md" />
      <div class="md:ml-4">
        <div class="text-md text-neutral-500">Original Prompt</div>
        <div class="text-lg text-neutral-200">
          {{ props.prompt }}
        </div>

        <div class="text-md text-neutral-500 mt-4">Looks</div>
        <div class="text-lg text-neutral-200">
          {{ props.looks }}
        </div>
      </div>
    </div>

    <textarea
      v-model="editablePrompt"
      class="my-8 md:min-h-[10rem] w-full overflow-hidden rounded-md resize-none text-2xl border border-neutral-800 bg-surface p-3 shadow-lg"
    />

    <div class="flex justify-center">
      <button
        class="ml-2 bg-neutral-800 px-4 text-lg rounded-md flex transition-all h-12 hover:scale-110 mr-2"
        @click="emit('cancel')"
      >
        <span class="self-center">Cancel</span>
      </button>
      <button
        class="bg-gradient-to-r text-lg md:w-52 from-fuchsia-500 flex to-blue-400 h-12 transition-all hover:scale-110 px-4 rounded-md"
        @click="conjure"
      >
        <span class="self-center text-center w-full"> Continue </span>
      </button>
    </div>
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

    <div class="grid grid-cols-2 gap-2">
      <div class="relative">
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
    </div>

    <div class="mt-6 flex justify-between">
      <button
        class="bg-surface-2 w-36 flex rounded-md border border-gray-600/50 p-3"
        @click="
          done = false;
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
