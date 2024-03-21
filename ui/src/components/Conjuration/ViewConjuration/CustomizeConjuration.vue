<script setup lang="ts">
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed, onMounted, onUpdated, onUnmounted, ref } from 'vue';
import { CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/vue/20/solid';
import { remove } from 'lodash';
import { useEventBus } from '@/lib/events.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosError } from 'axios';
import { useCurrentUserId } from '@/lib/hooks.ts';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Select from '@/components/Core/Forms/Select.vue';
import { patchImageConjurationId } from '@/api/images.ts';

const props = defineProps<{
  conjuration: Conjuration;
  imageConjurationFailed?: boolean;
  imageConjurationFailureReason?: string;
}>();

const eventBus = useEventBus();
const currentUserId = useCurrentUserId();
const channel = useWebsocketChannel();

const editableConjuration = ref(props.conjuration);
const addingTag = ref(false);
const tagText = ref('');
const showCustomizeImageModal = ref(false);
const tagInput = ref<HTMLElement | null>(null);
const negativePrompt = ref('');
const stylePreset = ref('');
const seed = ref('');

const editable = computed(
  () => props.conjuration?.userId === currentUserId.value,
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
  setPromptSettings();

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
    async (payload: {
      imageId: number;
      imageUri: string;
      prompt: string;
      negativePrompt: string;
      stylePreset: string;
      seed: string;
    }) => {
      showCustomizeImageModal.value = false;

      setTimeout(async () => {
        editableConjuration.value.imageUri = payload.imageUri;
        editableConjuration.value.imageAIPrompt = payload.prompt;
        negativePrompt.value = payload.negativePrompt;
        stylePreset.value = payload.stylePreset;
        seed.value = payload.seed;

        await patchImageConjurationId(
          payload.imageId,
          editableConjuration.value.id,
        );
        await saveConjuration();
      }, 50);
    },
  );

  channel.bind(ServerEvent.ImageCreated, function (data: any) {
    if (!editableConjuration.value.imageUri) {
      editableConjuration.value.imageUri = data.uri;
      editableConjuration.value.imageAIPrompt = data.prompt;
      negativePrompt.value = data.negativePrompt;
      stylePreset.value = data.stylePreset;
      seed.value = data.seed;
      eventBus.$emit('set-image', data);
    }
  });

  channel.bind(ServerEvent.ImageFiltered, function () {
    const message =
      'The generated image was filtered out by our content moderation system. Please try again.';
    showError({
      message,
    });
  });

  channel.bind(ServerEvent.ImageError, function (data: any) {
    showError({
      message: data.message,
    });
  });
});

onUnmounted(() => {
  eventBus.$off('save-conjuration');
  eventBus.$off('updated-conjuration-image');
  channel.unbind(ServerEvent.ImageCreated);
  channel.unbind(ServerEvent.ImageFiltered);
  channel.unbind(ServerEvent.ImageError);
});

onUpdated(() => {
  if (!editableConjuration.value.imageUri) {
    editableConjuration.value.imageUri = props.conjuration.imageUri;
  }

  if (props.conjuration.id !== editableConjuration.value.id) {
    editableConjuration.value = props.conjuration;
  }
});

const removeTag = async (tag: string) => {
  if (!editableConjuration.value.tags) return;

  let tags = [...editableConjuration.value.tags];
  remove(tags, function (t) {
    return t === tag;
  });

  editableConjuration.value.tags = tags;
};

const addTag = async () => {
  if (!tagText.value) return;

  editableConjuration.value.tags?.push(tagText.value);
  tagText.value = '';
};

async function saveConjuration() {
  try {
    await patchConjuration(props.conjuration.id, {
      ...editableConjuration.value,
      data: Object.fromEntries(dataArray.value.map((x) => [x.key, x.value])),
    });
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

function normalizeKeyName(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

const conjurationType = computed(() => {
  if (props.conjuration.conjurerCode === 'monsters') {
    return 'Monster';
  } else if (props.conjuration.conjurerCode === 'locations') {
    return 'Location';
  } else if (props.conjuration.conjurerCode === 'characters') {
    return 'NPC';
  } else {
    return '';
  }
});

const setPromptSettings = () => {
  if (
    editableConjuration.value.images?.length &&
    editableConjuration.value.images.some(
      (i) => editableConjuration.value.imageUri === i.uri,
    )
  ) {
    const image = editableConjuration.value.images.find(
      (i) => editableConjuration.value.imageUri === i.uri,
    );
    negativePrompt.value = image.negativePrompt;
    stylePreset.value = image.stylePreset;
    seed.value = image.seed;
  }
};
</script>

<template>
  <div v-if="conjuration" class="w-full">
    <div class="md:flex">
      <div class="max-w-[35rem] overflow-hidden rounded-md md:mr-6">
        <CustomizableImage
          :image-uri="editableConjuration.imageUri"
          :prompt="editableConjuration.imageAIPrompt"
          :negative-prompt="negativePrompt"
          :editable="editable"
          :alt="editableConjuration.name"
          :image-conjuration-failed="imageConjurationFailed"
          :image-conjuration-failure-reason="imageConjurationFailureReason"
          :type="conjurationType"
          :seed="seed"
        />

        <div class="mt-4 font-bold text-center">
          <input
            v-model="editableConjuration.name"
            class="input-secondary text-2xl"
            :disabled="!editable"
          />
        </div>

        <div class="mt-2">
          <Select
            v-model="editableConjuration.visibility"
            placeholder="Update visibility"
            :options="[
              {
                code: 'PUBLIC',
                name: 'Public',
              },
              {
                code: 'PRIVATE',
                name: 'Private (available with Basic or Pro subscription)',
                disabled: true,
              },
            ]"
            value-prop="code"
            display-prop="name"
            :disabled="!editable"
          />
          <div class="text-neutral-500 text-xs mx-2">
            Controls whether any MythWeaver user can view this conjuration or
            only you.
          </div>
        </div>

        <div class="mt-5 px-1 flex flex-wrap">
          <div class="text-xs text-neutral-400">TAGS</div>
          <div class="flex flex-wrap">
            <div
              v-for="tag of editableConjuration.tags"
              :key="`${editableConjuration.id}-${tag}`"
              class="tag flex group group-hover:pr-2"
            >
              <span class="self-center">{{ tag }}</span>
              <XMarkIcon
                v-if="editable"
                class="self-center ml-2 h-4 cursor-pointer text-white hidden group-hover:block"
                @click="removeTag(tag)"
              />
            </div>

            <div
              v-if="!addingTag && editable"
              class="tag flex cursor-pointer pl-1 pr-3 bg-surface-2 border border-surface-3"
              @click="beginAddingTag"
            >
              <PlusIcon class="w-4 h-4 self-center mr-1" />
              <span class="self-center">Add Tag</span>
            </div>
            <div v-if="addingTag" class="grow mt-1 relative basis-full">
              <input
                ref="tagInput"
                v-model="tagText"
                class="input-primary"
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
          class="bg-surface-2 rounded-[12px]"
        >
          <div class="mb-1 text-lg text-white pt-3 px-3">
            {{ normalizeKeyName(data.key) }}
          </div>
          <FormKit
            v-model="data.value"
            type="textarea"
            inner-class="border-none"
            :input-class="{
              '$reset input-primary border-none focus:ring-fuchsia-500': true,
              'pointer-events-none': !editable,
              'dark:text-neutral-400': true,
            }"
            auto-height
          />
        </div>
      </div>
    </div>
  </div>
</template>
