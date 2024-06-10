<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  Conjuration,
  copyConjuration,
  deleteConjuration,
  getConjuration,
  postConvertConjurationRequest,
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
  LinkIcon,
  BookmarkSlashIcon,
  ArrowsRightLeftIcon,
  XCircleIcon,
} from '@heroicons/vue/24/solid';
import {
  BookmarkSquareIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline';
import {
  useCurrentUserId,
  useCurrentUserRole,
  useQuickConjure,
  useSelectedCampaignId,
} from '@/lib/hooks.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { MenuButton, MenuItem } from '@headlessui/vue';
import Menu from '@/components/Core/General/Menu.vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import ViewRelationships from '@/components/Relationships/ViewRelationships.vue';
import { AxiosError } from 'axios';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { Conjurer, getConjurers } from '@/api/generators.ts';
import Select from '@/components/Core/Forms/Select.vue';
import { postConjurationRelationship } from '@/api/relationships.ts';

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const quickConjure = useQuickConjure();
const currentUserId = useCurrentUserId();
const currentUserRole = useCurrentUserRole();
const selectedCampaignId = useSelectedCampaignId();

const conjuration = ref<Conjuration | null>(null);
const privateConjuration = ref(false);

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
      privateConjuration.value = true;
    } else {
      showError({
        message: 'We were unable to fetch this conjuration. Please try again.',
      });
    }
  }
}

async function handleSaveConjuration() {
  try {
    await saveConjuration(conjurationId.value);
    showSuccess({ message: 'Successfully saved conjuration!' });
    await loadConjuration();
  } catch (e: any) {
    if (e.response?.data?.name === 'CONJURATION_LIMIT_REACHED') {
      showError({
        message:
          'You have reached the maximum number of conjurations for the FREE plan.',
        context:
          'You must upgrade your plan or delete conjurations to add more.',
      });
    } else {
      showError({
        message:
          'Something went wrong copying this conjuration. Please try again.',
      });
    }
  }
}

async function handleRemoveConjuration() {
  await removeConjuration(conjurationId.value);
  showSuccess({ message: 'Successfully removed conjuration!' });
  location.reload();
}

const confirmDeleteConjuration = ref(false);

async function handleDeleteConjuration() {
  try {
    await deleteConjuration(conjurationId.value);
    showSuccess({ message: 'Successfully deleted conjuration!' });
    confirmDeleteConjuration.value = false;
    await router.push('/conjurations');
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }
}

async function handleCopyConjuration() {
  try {
    const response = await copyConjuration(conjurationId.value);
    showSuccess({ message: 'Successfully copied conjuration!' });
    await router.push(`/conjurations/view/${response.data.id}`);
  } catch (e: any) {
    if (e.response.data?.name === 'CONJURATION_LIMIT_REACHED') {
      showError({
        message:
          'You have reached the maximum number of conjurations for the FREE plan.',
        context:
          'You must upgrade your plan or delete conjurations to add more.',
      });
    } else {
      showError({
        message:
          'Something went wrong copying this conjuration. Please try again.',
      });
    }
  }
}

async function routeBack() {
  if (route.query?.from) {
    await router.push(route.query.from as string);
  } else if (!isMyConjuration.value) {
    await router.push('/conjurations#gallery');
  } else if (!conjuration.value?.saved) {
    await router.push('/conjurations#history');
  } else {
    await router.push('/conjurations#saved');
  }
}

async function conjureUsingPrompt() {
  await router.push({
    path: '/conjure',
    query: {
      prompt: conjuration.value?.prompt,
      code: conjuration.value?.conjurerCode,
    },
  });
}

async function handleCreateRelationship(type: ConjurationRelationshipType) {
  eventBus.$emit('create-relationship', {
    relationshipType: type,
    nodeId: conjurationId,
    nodeType:
      conjuration.value?.conjurerCode === 'players'
        ? ConjurationRelationshipType.CHARACTER
        : ConjurationRelationshipType.CONJURATION,
  });
}

const readOnly = ref(true);

const isCharacterNotInCampaign = computed(() => {
  return (
    conjuration.value?.conjurerCode === 'players' &&
    !conjuration.value?.campaignIds?.some(
      (cid: any) => cid === selectedCampaignId.value,
    )
  );
});

const loadingChangeConjurationType = ref(false);
const showConvertConjurationType = ref(false);
const generators = ref<Conjurer[]>([]);
const selectedConjurerCode = ref<string | null>(null);

const showConvertConjurationTypeModal = async () => {
  if (!generators.value.length) {
    await loadGenerators();
  }
  showConvertConjurationType.value = true;
};

const currentConjurationType = computed(() => {
  if (!generators.value.length) return;
  return generators.value.find(
    (g: any) => g.code === conjuration.value?.conjurerCode,
  );
});

const changeConjurationType = async () => {
  if (conjuration.value && selectedConjurerCode.value) {
    try {
      loadingChangeConjurationType.value = true;
      const response = await postConvertConjurationRequest({
        conjurationId: conjuration.value.id,
        conjurerCode: selectedConjurerCode.value,
      });
      conjuration.value.conjurerCode = response.data.conjurerCode;
      showSuccess({ message: 'Conjuration type updated' });
      showConvertConjurationType.value = false;
    } catch {
      showError({
        message:
          'Something went wrong changing the conjuration type. Please try again.',
      });
    } finally {
      loadingChangeConjurationType.value = false;
    }
  }
};

async function loadGenerators() {
  const generatorsResponse = await getConjurers();
  generators.value = generatorsResponse.data.data;
  if (generators.value.length) {
    selectedConjurerCode.value = generators.value[0].code;
  }
}

async function addToCampaign() {
  if (!selectedCampaignId.value || !conjuration.value) return;

  try {
    await postConjurationRelationship(
      selectedCampaignId.value,
      ConjurationRelationshipType.CAMPAIGN,
      {
        relatedNodeId: conjuration.value.id,
        relatedNodeType: ConjurationRelationshipType.CHARACTER,
      },
    );
    await loadConjuration();
    showSuccess({ message: 'Character added to campaign!' });
  } catch (e: any) {
    showError({
      message:
        'Something went wrong adding your character to this campaign, please try again.',
    });
  }
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
          v-if="isQuickConjure"
          class="button-gradient flex self-center"
          @click="quickConjure(conjuration.conjurerCode)"
        >
          <ArrowPathIcon class="mr-2 h-5 w-5 self-center" />
          Retry Quick Conjure
        </button>

        <button
          v-if="isMyConjuration && isCharacterNotInCampaign"
          class="button-gradient self-center"
          @click="addToCampaign"
        >
          Add To Current Campaign
        </button>
        <button
          v-if="isMyConjuration && readOnly"
          class="button-gradient self-center"
          @click="readOnly = false"
        >
          Edit
        </button>
        <button
          v-if="isMyConjuration && !readOnly"
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
            <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
              <MenuItem>
                <div class="menu-item">
                  <button
                    v-if="conjuration.prompt"
                    class="button-text flex gap-2"
                    @click="conjureUsingPrompt"
                  >
                    <ChatBubbleLeftRightIcon class="h-5 w-5" />
                    Conjure With Same Prompt
                  </button>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="menu-item">
                  <button
                    v-if="currentUserRole === CampaignRole.DM"
                    class="button-text flex gap-2"
                    @click="
                      handleCreateRelationship(
                        ConjurationRelationshipType.CONJURATION,
                      )
                    "
                  >
                    <LinkIcon class="h-5 w-5" />
                    Link Conjuration
                  </button>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="menu-item">
                  <button
                    v-if="currentUserRole === CampaignRole.DM"
                    class="button-text flex gap-2"
                    @click="
                      handleCreateRelationship(
                        ConjurationRelationshipType.SESSION,
                      )
                    "
                  >
                    <LinkIcon class="h-5 w-5" />
                    Link Sessions
                  </button>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="menu-item">
                  <button
                    v-if="currentUserRole === CampaignRole.DM"
                    class="button-text flex gap-2"
                    @click="
                      handleCreateRelationship(
                        ConjurationRelationshipType.CAMPAIGN,
                      )
                    "
                  >
                    <LinkIcon class="h-5 w-5" />
                    Link To Campaign
                  </button>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="menu-item">
                  <button
                    class="button-text flex gap-2"
                    @click="showConvertConjurationTypeModal"
                  >
                    <ArrowsRightLeftIcon class="h-5 w-5" />
                    Change Conjuration Type
                  </button>
                </div>
              </MenuItem>
              <MenuItem>
                <div class="menu-item">
                  <button
                    class="button-text flex gap-2"
                    @click="handleRemoveConjuration"
                  >
                    <BookmarkSlashIcon class="h-5 w-5" />
                    Remove From My Conjurations
                  </button>
                </div>
              </MenuItem>
              <MenuItem v-if="isMyConjuration">
                <div class="menu-item">
                  <button
                    class="button-text text-red-500 flex gap-2"
                    @click="confirmDeleteConjuration = true"
                  >
                    <TrashIcon class="h-5 w-5" />
                    Delete Conjuration
                  </button>
                </div>
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
      :read-only="readOnly"
      @edit="readOnly = false"
    />
    <div class="mt-4">
      <div class="text-xl my-2">Related Conjurations</div>
      <ViewRelationships
        :start-node-id="conjuration.id"
        :start-node-type="
          conjuration.conjurerCode === 'players'
            ? ConjurationRelationshipType.CHARACTER
            : ConjurationRelationshipType.CONJURATION
        "
      />
    </div>
    <ModalAlternate :show="confirmDeleteConjuration">
      <div v-if="conjuration" class="bg-surface-3 rounded-[12px] p-6">
        <div class="text-lg text-white">
          Are you sure you want to permanently delete
          <span class="text-fuchsia-500">{{ conjuration.name }}</span
          >?
        </div>
        <div class="font-bold underline text-neutral-400 text-center my-6">
          Note: This action <b>cannot</b> be undone
        </div>
        <div class="flex gap-2 justify-center mt-4">
          <div>
            <FormKit
              label="Cancel"
              type="button"
              input-class="$reset button-ghost self-center"
              @click="confirmDeleteConjuration = false"
            />
          </div>
          <div>
            <FormKit
              label="Confirm Delete"
              type="button"
              input-class="$reset button-gradient self-center"
              @click="handleDeleteConjuration"
            />
          </div>
        </div>
      </div>
    </ModalAlternate>
    <ModalAlternate :show="showConvertConjurationType">
      <div
        v-if="conjuration"
        class="w-[90vw] md:w-auto min-w-[25vw] bg-surface-3 rounded-[12px] p-6"
      >
        <div class="flex gap-6 justify-between">
          <div class="text-lg self-center">Change Conjuration Type</div>
          <div class="self-center" @click="showConvertConjurationType = false">
            <XCircleIcon class="h-6 w-6" />
          </div>
        </div>
        <div class="flex flex-wrap md:flex-nowrap gap-2 justify-center mt-4">
          <div class="basis-full md:basis-2/5">
            <div class="text-neutral-500 text-sm px-1">Current Type</div>
            <div class="select-ghost">
              {{ currentConjurationType?.name || 'N/A' }}
            </div>
          </div>
          <div class="basis-full md:basis-1/5 flex flex-col justify-center">
            <ArrowsRightLeftIcon class="h-6 w-6 mx-2 mx-auto" />
          </div>
          <div class="basis-full md:basis-2/5">
            <div class="text-neutral-500 text-sm px-1">New Type</div>
            <div>
              <Select
                v-model="selectedConjurerCode"
                :options="generators"
                display-prop="name"
                value-prop="code"
                placeholder="Select conjuration type"
              />
            </div>
          </div>
        </div>
        <div class="mt-4">
          <div
            v-if="selectedConjurerCode === currentConjurationType?.code"
            class="text-sm text-neutral-500"
          >
            The selected types are the same
          </div>
          <div>
            <button
              :disabled="selectedConjurerCode === currentConjurationType?.code"
              class="button-gradient w-full"
              @click="changeConjurationType"
            >
              Update Type
            </button>
          </div>
        </div>
      </div>
    </ModalAlternate>
  </template>
  <div v-else-if="privateConjuration" class="relative w-full h-full">
    <div
      class="absolute blur-md left-0 right-0 top-0 bottom-0 pointer-events-none"
    >
      <div class="bg-surface-2 h-full w-full"></div>
    </div>
    <div class="absolute text-2xl left-1/2 top-1/2 -translate-x-1/2 z-10">
      <div>This conjuration is private or does not exist.</div>
    </div>
  </div>
</template>
