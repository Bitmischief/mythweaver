<script setup lang="ts">
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed, onMounted, onUpdated, onUnmounted, ref } from 'vue';
import {
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  LinkIcon,
} from '@heroicons/vue/20/solid';
import { PencilSquareIcon, ShareIcon } from '@heroicons/vue/24/outline';
import { remove } from 'lodash';
import { useEventBus } from '@/lib/events.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosError } from 'axios';
import {
  useCurrentUserId,
  useCurrentUserRole,
  useHasValidPlan,
} from '@/lib/hooks.ts';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Select from '@/components/Core/Forms/Select.vue';
import { BillingPlan } from '@/api/users.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import WysiwygEditor from '@/components/Core/WysiwygEditor.vue';
import { mapConjurationType } from '@/lib/util.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import ViewRelationships from '@/components/Relationships/ViewRelationships.vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['edit']);
const props = defineProps<{
  conjuration: Conjuration;
  imageConjurationFailed?: boolean;
  imageConjurationFailureReason?: string;
  readOnly?: boolean;
}>();

const tab = ref('editor');

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const currentUserId = useCurrentUserId();
const currentUserRole = useCurrentUserRole();
const channel = useWebsocketChannel();
const hasValidPlan = useHasValidPlan();

const editableConjuration = ref(props.conjuration);
const addingTag = ref(false);
const tagText = ref('');
const tagInput = ref<HTMLElement | null>(null);
const imageKey = ref(0);

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

onMounted(async () => {
  eventBus.$on(
    'save-conjuration',
    async (payload: { conjurationId: number }) => {
      if (payload.conjurationId === props.conjuration.id) {
        await saveConjuration();
      }
    },
  );

  channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.bind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
  channel.bind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.bind(ServerEvent.ImageError, imageErrorHandler);
  channel.bind(
    ServerEvent.ImageGenerationTimeout,
    imageGenerationTimeoutHandler,
  );
});

function imageCreatedHandler(image: any) {
  if (!primaryImage.value?.uri) {
    editableConjuration.value.images = [{ ...image }];
  }
}

function primaryImageSetHandler(data: any[]) {
  editableConjuration.value.images = data;
  imageKey.value++;
  showSuccess({ message: 'Image saved' });
}

function imageUpscaledHandler(data: any) {
  editableConjuration.value.images = [{ ...data }];
  imageKey.value++;
  showSuccess({ message: 'Image upscaled' });
}

function imageFilteredHandler() {
  const message =
    'The generated image was filtered out by our content moderation system. Please try again.';
  showError({
    message,
  });
}

function imageErrorHandler(data: any) {
  showError({
    message: data.message,
  });
}

function imageGenerationTimeoutHandler() {
  if (editableConjuration.value?.images?.length) {
    editableConjuration.value.images = editableConjuration.value.images.map(
      (i) => {
        if (i.primary) {
          return {
            ...i,
            generating: false,
            failed: true,
          };
        }
        return i;
      },
    );
  }
  showError({
    message: 'Image generation timed out. Please try again.',
  });
}

onUnmounted(() => {
  eventBus.$off('save-conjuration');
  channel.unbind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
  channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.unbind(ServerEvent.ImageUpscaled, imageUpscaledHandler);
  channel.unbind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.unbind(ServerEvent.ImageError, imageErrorHandler);
  channel.unbind(
    ServerEvent.ImageGenerationTimeout,
    imageGenerationTimeoutHandler,
  );
});

onUpdated(() => {
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
      imageUri: undefined,
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

const conjurationType = computed(() => {
  return mapConjurationType(props.conjuration.conjurerCode);
});

const hasAnyPrimaryImages = computed(() => {
  return editableConjuration.value?.images?.some((i) => i.primary && i.uri);
});

const hasAnyImageHistory = computed(() => {
  return editableConjuration.value?.images?.length;
});

const primaryImage = computed(() => {
  if (editableConjuration.value?.images?.length) {
    return editableConjuration.value.images.find((i) => i.primary);
  }
  return undefined;
});

function showCustomizeImageModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    image: {
      prompt: editableConjuration.value.imageAIPrompt,
    },
    linking: {
      conjurationId: editableConjuration.value.id,
    },
  });
}

function showImageHistoryModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    image: {
      prompt: editableConjuration.value.imageAIPrompt,
    },
    linking: {
      conjurationId: editableConjuration.value.id,
    },
    historyMode: true,
    showImageCredits: false,
  });
}

function edit(e: any) {
  emit('edit');
  if (props.readOnly) {
    setTimeout(() => {
      e.target.select();
    }, 100);
  }
}

async function handleCreateRelationship() {
  eventBus.$emit('create-relationship', {
    conjurationId: props.conjuration.id,
  });
}

async function viewGraph() {
  await router.push({
    path: '/relationships/graph',
    query: { from: route.fullPath, source: props.conjuration.id },
  });
}
</script>

<template>
  <div v-if="conjuration" class="w-full">
    <div class="lg:flex">
      <div
        class="lg:basis-2/5 xl:basis-auto min-w-0 min-w-[25rem] max-w-[50rem] rounded-md md:mr-6"
      >
        <CustomizableImage
          v-if="hasAnyPrimaryImages"
          :key="imageKey"
          :image="primaryImage"
          :editable="editable"
          :alt="editableConjuration.name"
          :image-conjuration-failed="imageConjurationFailed"
          :image-conjuration-failure-reason="imageConjurationFailureReason"
          :type="conjurationType"
          :linking="{ conjurationId: editableConjuration.id }"
          class="mb-2"
        />
        <div v-else-if="editable" class="flex gap-2">
          <div class="grow">
            <button
              class="button-gradient w-full mb-2"
              @click="showCustomizeImageModal"
            >
              Conjure Image
            </button>
          </div>
          <div v-if="hasAnyImageHistory">
            <button class="button-ghost" @click="showImageHistoryModal">
              <PencilSquareIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mb-2 font-bold text-center">
          <input
            v-model="editableConjuration.name"
            class="input-secondary text-2xl"
            :disabled="!editable"
            @click="edit"
          />
        </div>

        <div>
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
                disabled: !hasValidPlan(BillingPlan.Basic),
              },
            ]"
            value-prop="code"
            display-prop="name"
            :disabled="!editable"
            @click="emit('edit')"
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
      <div class="lg:basis-3/5 xl:basis-auto grow min-w-0 mt-4 lg:mt-0 lg:ml-4">
        <div
          v-if="editable"
          class="flex gap-2 p-1 rounded-[18px] bg-surface-2 mb-2 border border-surface-3 text-sm"
        >
          <button
            class="basis-1/2 self-center font-bold"
            :class="{
              'button-secondary text-neutral-200': tab === 'editor',
              'button-text text-neutral-400 hover:bg-purple-800/25':
                tab !== 'editor',
            }"
            @click="tab = 'editor'"
          >
            Conjuration details
          </button>
          <button
            class="basis-1/2 self-center font-bold"
            :class="{
              'button-secondary text-neutral-200': tab === 'relationships',
              'button-text text-neutral-400 hover:bg-purple-800/25':
                tab !== 'relationships',
            }"
            @click="tab = 'relationships'"
          >
            Relationships
          </button>
        </div>
        <div v-show="tab === 'editor'">
          <WysiwygEditor
            :key="'' + readOnly"
            v-model="editableConjuration.data"
            :read-only="readOnly"
            :editable="editable"
            :placeholder="`Add details to your ${conjurationType} here!`"
            :context="conjurationType"
            @dblclick="
              editable && currentUserRole === CampaignRole.DM
                ? emit('edit')
                : null
            "
          />
        </div>
        <div v-show="tab === 'relationships'">
          <div class="flex justify-between mb-2">
            <div class="self-center text-lg">Relationships</div>
            <div class="self-center flex gap-2">
              <button
                class="button-ghost flex gap-2"
                @click="handleCreateRelationship"
              >
                <LinkIcon class="h-5 w-5" />
                Add Relationship
              </button>
              <button class="button-primary flex gap-2" @click="viewGraph">
                <ShareIcon class="h-5 w-5" />
                View Graph
              </button>
            </div>
          </div>
          <ViewRelationships
            :start-node-id="conjuration.id"
            :start-node-type="ConjurationRelationshipType.CONJURATION"
          />
        </div>
      </div>
    </div>
  </div>
</template>
