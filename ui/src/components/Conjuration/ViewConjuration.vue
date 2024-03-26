<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  Conjuration,
  copyConjuration,
  deleteConjuration,
  getConjuration,
  removeConjuration,
  saveConjuration,
} from '@/api/conjurations.ts';
import { useRoute, useRouter } from 'vue-router';
import { useEventBus } from '@/lib/events.ts';
import CustomizeConjuration from '@/components/Conjuration/ViewConjuration/CustomizeConjuration.vue';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/vue/24/solid';
import {
  BookmarkSquareIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/vue/24/outline';
import {
  useCurrentUserId,
  useCurrentUserRole,
  useQuickConjure,
} from '@/lib/hooks.ts';
import { showError, showInfo, showSuccess } from '@/lib/notifications.ts';
import { MenuButton, MenuItem } from '@headlessui/vue';
import Menu from '@/components/Core/General/Menu.vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import ViewRelationships from '@/components/Relationships/ViewRelationships.vue';
import { useLDFlag } from 'launchdarkly-vue-client-sdk';
import { AxiosError } from 'axios';

const showRelationships = useLDFlag('relationships', false);

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const quickConjure = useQuickConjure();
const currentUserId = useCurrentUserId();
const currentUserRole = useCurrentUserRole();

const conjuration = ref<Conjuration | null>(null);

const conjurationId = computed(() =>
  parseInt(route.params.conjurationId?.toString()),
);

const isMyConjuration = computed(
  () => conjuration.value?.userId === currentUserId.value,
);

const isQuickConjure = computed(() => {
  return route.query.quick === 'true';
});

onMounted(async () => {
  await loadConjuration();
  eventBus.$on('set-image', (image: any) => {
    conjuration?.value?.images?.push(image);
  });
});

onUnmounted(() => {
  eventBus.$off('set-image');
});

watch(conjurationId, async () => {
  await loadConjuration();
});

async function loadConjuration() {
  try {
    if (conjurationId.value) {
      const response = await getConjuration(conjurationId.value);
      conjuration.value = response.data;

      if (conjuration.value?.copies?.length) {
        await router.push(
          `/conjurations/view/${conjuration.value.copies[0].id}`,
        );
        await loadConjuration();
      }
    }
  } catch (e: any) {
    if (e.response.status === 404) {
      showInfo({ message: 'Conjuration not found.' });
      await router.push('/conjurations');
    } else {
      showError({
        message: 'We were unable to fetch this conjuration. Please try again.',
      });
    }
  }
}

async function handleSaveConjuration() {
  await saveConjuration(conjurationId.value);
  showSuccess({ message: 'Successfully saved conjuration!' });
  await loadConjuration();
}

async function handleRemoveConjuration() {
  if (confirm('Are you sure you want to remove this conjuration?')) {
    await removeConjuration(conjurationId.value);
    showSuccess({ message: 'Successfully removed conjuration!' });
    location.reload();
  }
}

async function handleDeleteConjuration() {
  if (
    confirm('Are you sure you want to permanently delete this conjuration?')
  ) {
    try {
      await deleteConjuration(conjurationId.value);
      showSuccess({ message: 'Successfully deleted conjuration!' });
      await router.push('/conjurations');
    } catch (e) {
      const err = e as AxiosError;
      showError({
        message: (err?.response?.data as any)?.message?.toString() || '',
      });
      return;
    }
  }
}

async function handleCopyConjuration() {
  const response = await copyConjuration(conjurationId.value);
  showSuccess({ message: 'Successfully copied conjuration!' });
  await router.push(`/conjurations/view/${response.data.id}`);
}

async function routeBack() {
  router.go(-1);
  await router.push('/conjurations#saved');
}

async function conjureUsingPrompt() {
  let imagePrompt = '';
  let negativePrompt = '';
  let stylePreset = '';

  if (
    conjuration.value?.images &&
    conjuration.value?.images.some(
      (i) => conjuration?.value?.imageUri === i.uri,
    )
  ) {
    const image = conjuration.value?.images.find(
      (i) => conjuration?.value?.imageUri === i.uri,
    );
    imagePrompt = image.prompt;
    negativePrompt = image.negativePrompt;
    stylePreset = image.stylePreset;
  }

  await router.push({
    path: '/conjurations/new',
    query: {
      prompt: conjuration.value?.prompt,
      code: conjuration.value?.conjurerCode,
      imagePrompt: imagePrompt,
      imageNegativePrompt: negativePrompt,
      stylePreset: stylePreset,
    },
  });
}

async function handleCreateRelationship(type: ConjurationRelationshipType) {
  eventBus.$emit('create-relationship', {
    relationshipType: type,
    nodeId: conjurationId,
    nodeType: ConjurationRelationshipType.CONJURATION,
  });
}
</script>

<template>
  <template v-if="conjuration">
    <div class="flex flex-wrap lg:flex-nowrap gap-4 justify-between mb-6">
      <div class="flex flex-wrap gap-4 lg:flex-nowrap grow">
        <button class="button-primary flex self-center" @click="routeBack">
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          <span class="self-center">Back</span>
        </button>

        <div
          v-if="conjuration.saved && !isMyConjuration"
          class="bg-amber-300/10 rounded-[12px] flex py-2 px-4"
        >
          <div class="self-center text-amber-300/75 my-auto">
            This conjuration has not been saved yet.
          </div>
        </div>

        <div
          v-if="!conjuration.saved"
          class="bg-amber-300/10 rounded-[12px] flex py-2 px-4"
        >
          <div class="self-center text-amber-300/75 my-auto">
            This conjuration has not been added to your conjurations yet.
          </div>
        </div>
      </div>

      <div
        class="flex flex-wrap xl:flex-nowrap whitespace-nowrap gap-2 mt-0 justify-end grow"
      >
        <button
          v-if="conjuration.prompt"
          class="button-ghost flex self-center"
          @click="conjureUsingPrompt"
        >
          Conjure With Same Prompt
        </button>
        <button
          v-if="isQuickConjure"
          class="button-gradient flex self-center"
          @click="quickConjure(conjuration.conjurerCode)"
        >
          <ArrowPathIcon class="mr-2 h-5 w-5 self-center" /> Retry Quick Conjure
        </button>

        <button
          v-if="isMyConjuration"
          class="button-ghost flex self-center"
          @click="
            eventBus.$emit('save-conjuration', {
              conjurationId: conjuration.id,
            })
          "
        >
          <span class="self-center">Save Changes</span>
        </button>

        <button
          v-if="conjuration.saved && !isMyConjuration"
          class="button-ghost flex self-center"
          @click="handleCopyConjuration"
        >
          <DocumentDuplicateIcon class="h-5 w-5 mr-2" />
          <span class="self-center">Copy Conjuration</span>
        </button>
        <button
          v-if="!conjuration.saved"
          class="button-ghost flex self-center"
          @click="handleSaveConjuration"
        >
          <BookmarkSquareIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Add to My Conjurations</span>
        </button>

        <Menu v-if="conjuration.saved" class="self-center">
          <MenuButton class="button-ghost-primary">
            <EllipsisHorizontalIcon class="h-6 w-6 text-neutral-300" />
          </MenuButton>

          <template #content>
            <div class="relative z-60 bg-surface-3 p-2 rounded-[12px]">
              <MenuItem v-if="showRelationships" class="menu-item">
                <button
                  v-if="currentUserRole === CampaignRole.DM"
                  class="button-primary flex"
                  @click="
                    handleCreateRelationship(
                      ConjurationRelationshipType.CONJURATION,
                    )
                  "
                >
                  Link Conjuration
                </button>
              </MenuItem>
              <MenuItem v-if="showRelationships" class="menu-item">
                <button
                  v-if="currentUserRole === CampaignRole.DM"
                  class="button-primary flex"
                  @click="
                    handleCreateRelationship(
                      ConjurationRelationshipType.SESSION,
                    )
                  "
                >
                  Link Sessions
                </button>
              </MenuItem>
              <MenuItem class="menu-item">
                <button
                  class="button-primary flex"
                  @click="handleRemoveConjuration"
                >
                  Remove From My Conjurations
                </button>
              </MenuItem>
              <MenuItem v-if="isMyConjuration" class="menu-item">
                <button
                  class="button-primary flex"
                  @click="handleDeleteConjuration"
                >
                  Delete Conjuration
                </button>
              </MenuItem>
            </div>
          </template>
        </Menu>
      </div>
    </div>

    <CustomizeConjuration
      :key="conjuration.updatedAt"
      :conjuration="conjuration"
      :image-conjuration-failed="conjuration.imageGenerationFailed"
    />
    <div v-if="showRelationships" class="mt-4">
      <div class="text-xl my-2">Related Conjurations</div>
      <ViewRelationships
        :start-node-id="conjuration.id"
        :start-node-type="ConjurationRelationshipType.CONJURATION"
      />
    </div>
  </template>
</template>
