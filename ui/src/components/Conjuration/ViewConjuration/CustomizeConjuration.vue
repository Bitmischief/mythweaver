<script setup lang="ts">
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed, watch, onMounted, onUpdated, onUnmounted, ref } from 'vue';
import { LinkIcon } from '@heroicons/vue/20/solid';
import { ShareIcon } from '@heroicons/vue/24/outline';
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
import { useDebounceFn } from '@vueuse/core';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages';

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
const { showModal: showGenerateImageModal, setLinkingContext } =
  useGenerateImages();

const editableConjuration = ref(props.conjuration);
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
  channel.bind(ServerEvent.ImageEdited, imageEditedHandler);
  channel.bind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
  channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.bind(ServerEvent.ImageError, imageErrorHandler);
  channel.bind(
    ServerEvent.ImageGenerationTimeout,
    imageGenerationTimeoutHandler,
  );
});

watch(
  () => props.conjuration,
  () => {
    editableConjuration.value = props.conjuration;
  },
  { deep: true },
);

watch(
  () => editableConjuration.value,
  useDebounceFn(async () => {
    await saveConjuration();
  }, 1200),
  { deep: true },
);

function imageCreatedHandler(image: any) {
  if (!primaryImage.value?.uri) {
    editableConjuration.value.images = [{ ...image }];
  }
}

function imageEditedHandler(data: any) {
  if (primaryImage.value?.id === data.imageId) {
    editableConjuration.value.images = [{ ...data.image }];
  }
}

function primaryImageSetHandler(data: any) {
  if (data.context?.conjurationId === editableConjuration.value.id) {
    editableConjuration.value.images = data.images;
    imageKey.value++;
    showSuccess({ message: 'Image saved' });
  }
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
  channel.unbind(ServerEvent.ImageEdited, imageEditedHandler);
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

async function saveConjuration() {
  try {
    await patchConjuration(props.conjuration.id, {
      ...editableConjuration.value,
      data: Object.fromEntries(dataArray.value.map((x) => [x.key, x.value])),
      imageUri: undefined,
    });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
  }
}

const conjurationType = computed(() => {
  return mapConjurationType(props.conjuration.conjurerCode);
});

const hasAnyPrimaryImages = computed(() => {
  return editableConjuration.value?.images?.some((i) => i.primary && i.uri);
});

const primaryImage = computed(() => {
  if (editableConjuration.value?.images?.length) {
    return editableConjuration.value.images.find((i: any) => i.primary);
  }
  return undefined;
});

function showCustomizeImageModal() {
  setLinkingContext({ conjurationId: props.conjuration.id });
  showGenerateImageModal.value = true;
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

function removeTag(tag: string) {
  const index = editableConjuration.value.tags?.indexOf(tag);
  if (index && index >= 0) {
    editableConjuration.value.tags?.splice(index, 1);
  }
}

const newTag = ref<string | null>(null);

function addTag() {
  if (newTag.value) {
    if (editableConjuration.value.tags) {
      editableConjuration.value.tags.push(newTag.value);
    } else {
      editableConjuration.value.tags = [newTag.value];
    }
  }

  newTag.value = null;
}
</script>

<template>
  <div v-if="conjuration" class="w-full">
    <div class="lg:flex">
      <div
        class="lg:min-w-[25rem] lg:w-[25rem] 3xl:min-w-[35rem] 3xl:w-[35rem] shrink rounded-md md:mr-6"
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
        </div>

        <div class="mb-2 font-bold text-center">
          <input
            v-model="editableConjuration.name"
            class="input-secondary text-2xl"
            :disabled="readOnly"
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
            :disabled="readOnly"
            @click="emit('edit')"
          />
          <div class="text-neutral-500 text-xs mx-2">
            Controls whether any MythWeaver user can view this conjuration or
            only you.
          </div>
        </div>

        <div class="mt-5 px-1">
          <div class="text-xs text-neutral-400 mb-1">TAGS</div>
          <div
            class="flex flex-wrap border border-neutral-800 rounded-lg p-1 gap-1"
            @click="readOnly && emit('edit')"
          >
            <Chip
              v-for="(tag, i) in editableConjuration.tags"
              :key="`tag_${i}`"
              :label="tag"
              :removable="!readOnly"
              @click="removeTag(tag)"
            />
            <div v-if="!readOnly" class="flex-grow !min-w-0">
              <InputText
                v-model="newTag"
                type="text"
                class="!bg-surface !border-none"
                placeholder="+ Add tag"
                @keydown.enter="addTag"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="grow min-w-0 mt-4 lg:mt-0 lg:ml-4">
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

<style scoped>
.tag {
  @apply px-2 py-1 rounded-full text-sm bg-surface-2 border border-surface-3 m-1;
}
</style>
