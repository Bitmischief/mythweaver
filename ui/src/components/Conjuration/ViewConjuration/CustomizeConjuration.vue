<script setup lang="ts">
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed, onMounted, onUpdated, ref } from 'vue';
import {
  CheckIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  PlusIcon,
} from '@heroicons/vue/20/solid';
import { remove } from 'lodash';
import LightboxImage from '@/components/LightboxImage.vue';
import { useEventBus } from '@/lib/events.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosError } from 'axios';
import { useCurrentUserId } from '@/lib/hooks.ts';

const props = defineProps<{
  conjuration: Conjuration;
}>();

const eventBus = useEventBus();
const currentUserId = useCurrentUserId();

const editableConjuration = ref(props.conjuration);
const addingTag = ref(false);
const tagText = ref('');
const showCustomizeImageModal = ref(false);
const tagInput = ref<HTMLElement | null>(null);

const editable = computed(
  () =>
    props.conjuration?.saved &&
    props.conjuration?.userId === currentUserId.value,
);

const dataArray = computed(() => {
  if (!props.conjuration) {
    return [];
  }

  return Object.keys(editableConjuration.value.data).map((key) => {
    return {
      key,
      value: editableConjuration.value.data[key],
    };
  });
});

onMounted(() => {
  eventBus.$on(
    'save-conjuration',
    async (payload: { conjurationId: number }) => {
      if (payload.conjurationId === props.conjuration.id) {
        await saveConjuration();
      }
    },
  );

  eventBus.$on(
    'updated-conjuration-image',
    async (payload: { imageUri: string; prompt: string }) => {
      showCustomizeImageModal.value = false;

      setTimeout(() => {
        editableConjuration.value.imageUri = payload.imageUri;
        editableConjuration.value.imageAIPrompt = payload.prompt;
      }, 50);
    },
  );
});

onUpdated(() => {
  console.log(editableConjuration.value.imageUri, props.conjuration.imageUri);
  if (!editableConjuration.value.imageUri) {
    editableConjuration.value.imageUri = props.conjuration.imageUri;
  }

  if (props.conjuration.id !== editableConjuration.value.id) {
    editableConjuration.value = props.conjuration;
  }
});

const removeTag = async (tag: string) => {
  if (!props.conjuration.tags) return;

  let tags = [...props.conjuration.tags];
  remove(tags, function (t) {
    return t === tag;
  });
  await patchConjuration(props.conjuration.id, { tags });
};

const addTag = async () => {
  if (!tagText.value) return;

  editableConjuration.value.tags?.push(tagText.value);
  tagText.value = '';
};

function showImage() {
  eventBus.$emit('open-lightbox', props.conjuration.imageUri);
}

async function saveConjuration() {
  try {
    await patchConjuration(props.conjuration.id, editableConjuration.value);
    showSuccess({ message: 'Successfully saved conjuration' });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
  }
}

function beginAddingTag() {
  addingTag.value = true;
  tagInput.value?.focus();
}
</script>

<template>
  <div v-if="conjuration" class="w-full">
    <div class="md:flex">
      <div class="max-w-[35rem] overflow-hidden rounded-md md:mr-6">
        <div class="relative">
          <div
            v-if="editable && editableConjuration.imageUri"
            class="absolute flex top-2 right-2"
          >
            <button
              class="bg-neutral-800 border border-neutral-600 px-2 md:px-4 rounded-md flex transition-all h-8 md:h-12 hover:scale-110"
              @click="showCustomizeImageModal = true"
            >
              <span class="self-center">Customize</span>
            </button>
          </div>

          <div
            v-if="editable && editableConjuration.imageUri"
            class="absolute flex bottom-2 right-2 cursor-pointer"
            @click="showImage"
          >
            <ArrowsPointingOutIcon
              class="w-8 h-8 self-center transition-all hover:scale-125"
            />
          </div>

          <LightboxImage
            v-if="editableConjuration.imageUri"
            :src="editableConjuration.imageUri"
            :alt="editableConjuration.name"
          />
          <div
            v-else
            class="w-full min-h-[20rem] flex justify-center h-full bg-surface"
          >
            <div
              class="self-center text-center text-[2rem] text-white animate-pulse"
            >
              Conjuring image...
            </div>
          </div>
        </div>

        <div class="mt-4 text-4xl font-bold text-center">
          <input
            v-model="editableConjuration.name"
            class="w-full text-center bg-transparent gradient-border-no-opacity md:text-4xl"
            :disabled="!editable"
          />
        </div>
        <div class="mt-2 flex flex-wrap justify-center">
          <div class="mt-3 flex flex-wrap">
            <div
              v-for="tag of editableConjuration.tags"
              :key="`${editableConjuration.id}-${tag}`"
              class="mr-2 mt-1 rounded-xl bg-gray-700 px-3 py-1 md:text-lg flex group"
            >
              <span class="self-center">{{ tag }}</span>
              <XMarkIcon
                v-if="editable"
                class="ml-2 h-6 w-6 self-center cursor-pointer text-white group-hover:flex hidden"
                @click="removeTag(tag)"
              />
            </div>

            <div
              v-if="!addingTag && editable"
              class="h-8 w-8 mt-1 font-bold self-center rounded-full bg-gray-700 flex justify-center cursor-pointer transition-all ease-in-out hover:scale-110"
              @click="beginAddingTag"
            >
              <PlusIcon class="w-5 h-5 self-center" />
            </div>
            <div v-if="addingTag" class="mr-2 mt-1 relative">
              <input
                ref="tagInput"
                v-model="tagText"
                class="rounded-xl bg-gray-700 px-3 py-1 text-lg flex pr-[4.5rem]"
                placeholder="Add tag"
                autofocus
                @keydown.enter="addTag"
                @keydown.esc="addingTag = false"
              />

              <div class="absolute right-2 h-full top-0 flex">
                <div class="self-center flex">
                  <XMarkIcon
                    class="h-6 cursor-pointer text-white hover:bg-gray-500 border border-gray-500 rounded-l-lg"
                    @click="
                      tagText = '';
                      addingTag = false;
                    "
                  />
                  <CheckIcon
                    class="h-6 cursor-pointer text-white hover:bg-purple-500 border border-gray-500 rounded-r-lg"
                    @click="addTag"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full mt-4 md:mt-0 md:ml-4">
        <div
          v-for="(data, i) in dataArray"
          :key="`data-${i}`"
          :class="{ 'mb-8': i !== dataArray.length - 1 }"
        >
          <div class="mb-1 text-2xl">
            {{ data.key }}
          </div>
          <textarea
            v-model="data.value"
            class="min-h-[10rem] w-full overflow-hidden rounded-xl border border-neutral-800 bg-surface p-3 text-lg shadow-lg"
            :disabled="!editable"
            @click="$event.stopPropagation()"
          />
        </div>
      </div>
    </div>
  </div>

  <ModalAlternate :show="showCustomizeImageModal">
    <div
      class="md:w-[800px] p-6 px-12 bg-neutral-900 rounded-[20px] text-center"
    >
      <CustomizeConjurationImage
        :prompt="editableConjuration.imageAIPrompt"
        :image-uri="conjuration.imageUri"
        :looks="conjuration.data.looks"
        @cancel="showCustomizeImageModal = false"
      />
    </div>
  </ModalAlternate>
</template>
