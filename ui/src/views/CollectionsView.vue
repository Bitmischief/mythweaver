<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  deleteCollectionConjuration,
  getCollections,
  saveCollection,
} from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  ArrowRightIcon,
  SquaresPlusIcon,
  EllipsisHorizontalIcon,
  ArrowRightEndOnRectangleIcon,
  MinusCircleIcon,
} from '@heroicons/vue/24/outline';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import {
  XCircleIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/solid';
import AddConjurationsToCollection from '@/components/Collections/AddConjurationsToCollection.vue';
import Collection from '@/components/Collections/Collection.vue';
import { useSelectedCampaignId, useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import CollectionHistory from '@/components/Collections/CollectionHistory.vue';
import { useRoute, useRouter } from 'vue-router';
import ConjurationQuickView from '@/components/Conjuration/ConjurationListItemView.vue';
import ConjurationMove from '@/components/Collections/ConjurationMove.vue';
import { useEventBus } from '@/lib/events';

const eventBus = useEventBus();
const channel = useWebsocketChannel();
const campaignId = useSelectedCampaignId();

const loading = ref(true);
const router = useRouter();
const route = useRoute();

const collections = ref<any[]>([]);
const conjurations = ref<any[]>([]);
const collectionHistory = ref<any[]>([]);

const showNewCollection = ref(false);
const showAddConjurations = ref(false);
const showMoveConjuration = ref(false);
const conjurationToMove = ref<any>(null);

const newCollectionName = ref('');
const parentId = ref<number | undefined>();

watch(parentId, async () => {
  await router.push({
    query: {
      history: collectionHistory.value?.length
        ? JSON.stringify(
            collectionHistory.value.map((h: any) => ({
              id: h.id,
              name: h.name,
              campaignId: h.campaignId,
            })),
          )
        : undefined,
    },
  });
});

onMounted(async () => {
  if (route.query?.history?.length) {
    const history = route.query.history as string;
    const historyArray = JSON.parse(history);

    if (historyArray[0].campaignId !== campaignId.value) {
      await router.push({
        query: {
          history: undefined,
        },
      });
    } else {
      collectionHistory.value = historyArray;
      parentId.value = historyArray.at(-1)?.id;
    }
  }

  channel.bind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.bind(ServerEvent.CollectionMoved, fetchCollections);

  await fetchCollections();
  if (!parentId.value && collections.value.length) {
    await openCollection(collections.value[0]);
  }

  eventBus.$on('campaign-selected', async () => {
    collectionHistory.value = [];
    parentId.value = undefined;
    await fetchCollections();
    await openCollection(collections.value[0]);
  });
});

onUnmounted(() => {
  channel.unbind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.unbind(ServerEvent.CollectionMoved, fetchCollections);
});

const fetchCollections = async () => {
  loading.value = true;
  try {
    const response = await getCollections(parentId.value, campaignId.value);
    collections.value = response.data?.collections || [];
    conjurations.value = response.data?.conjurations || [];
  } catch {
    showError({
      message: 'Failed to fetch collections. Please refresh the page.',
    });
  } finally {
    loading.value = false;
  }
};

const addCollection = async () => {
  try {
    await saveCollection({
      name: newCollectionName.value,
      parentId: parentId.value,
    });
    await fetchCollections();
    showNewCollection.value = false;
    newCollectionName.value = '';
    showSuccess({ message: 'Collection created!' });
  } catch {
    showError({ message: 'Failed to create collection. Please try again.' });
  }
};

const openCollection = async (collection: any) => {
  collectionHistory.value.push(collection);
  parentId.value = collection.id;
  await fetchCollections();
};

async function clickHistory(collection: any) {
  const historyIndex = collectionHistory.value.findIndex(
    (h) => h.id === collection.id,
  );
  collectionHistory.value = collectionHistory.value.slice(0, historyIndex + 1);

  if (collectionHistory.value?.length) {
    parentId.value =
      collectionHistory.value[collectionHistory.value.length - 1].id;
  } else {
    parentId.value = undefined;
  }

  await fetchCollections();
}

async function back() {
  collectionHistory.value.pop();
  parentId.value = collectionHistory.value?.length
    ? collectionHistory.value[collectionHistory.value.length - 1].id
    : undefined;
  await fetchCollections();
}

async function closeAddConjurations() {
  await fetchCollections();
  showAddConjurations.value = false;
}

const parentName = computed(() => {
  if (collectionHistory.value?.length) {
    return collectionHistory.value[collectionHistory.value.length - 1].name;
  }
  return 'Campaigns';
});

const showBack = computed(() => {
  return collectionHistory.value.length > 1;
});

const removeCollectionConjuration = async (
  collectionId: number,
  conjurationId: number,
) => {
  try {
    await deleteCollectionConjuration(collectionId, conjurationId);
    await fetchCollections();
    showSuccess({ message: 'Conjuration removed from collection' });
  } catch {
    showError({
      message:
        'Failed to remove conjuration from collection. Please try again.',
    });
  }
};

const moveConjuration = (conjuration: any) => {
  showMoveConjuration.value = true;
  conjurationToMove.value = conjuration;
};
</script>

<template>
  <div class="w-full flex justify-between mb-4">
    <div class="flex md:justify-start grow">
      <div class="text-xl self-center">
        <span class="gradient-text"> Campaign Collections</span>
      </div>
    </div>
    <div class="self-center">
      <div v-if="parentId" class="hidden md:flex gap-2">
        <div>
          <button
            class="button-ghost flex gap-2"
            @click="showNewCollection = true"
          >
            <SquaresPlusIcon class="h-5 w-5" />
            New Collection
          </button>
        </div>
        <div>
          <button
            class="button-gradient flex gap-2"
            @click="showAddConjurations = true"
          >
            <SparklesIcon class="h-5 w-5" />
            Add Conjurations
          </button>
        </div>
      </div>
      <Menu class="md:hidden">
        <MenuButton class="button-ghost-primary">
          <EllipsisHorizontalIcon class="h-6 w-6 text-neutral-300" />
        </MenuButton>

        <template #content>
          <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
            <MenuItem @click="showNewCollection = true">
              <div class="menu-item">
                <button class="button-text flex gap-2">
                  <SquaresPlusIcon class="h-5 w-5" />
                  New Collection
                </button>
              </div>
            </MenuItem>
            <MenuItem v-if="parentId" @click="showAddConjurations = true">
              <div class="menu-item">
                <button class="button-text flex gap-2">
                  <SparklesIcon class="h-5 w-5" />
                  Add Conjurations
                </button>
              </div>
            </MenuItem>
          </div>
        </template>
      </Menu>
    </div>
  </div>
  <div class="w-full mb-8">
    <div class="flex gap-4">
      <div v-if="showBack" class="self-center">
        <button class="button-primary flex self-center" @click="back">
          <ArrowLeftIcon class="w-4 mr-1 self-center" />
          Back
        </button>
      </div>
      <div
        class="grow flex flex-wrap shrink py-1 px-2 bg-surface-2 rounded-[12px] text-neutral-400 whitespace-nowrap self-center"
      >
        <div
          v-for="(history, i) in collectionHistory"
          :key="`history_${i}`"
          class="flex gap-2"
          @click="clickHistory(history)"
        >
          <CollectionHistory
            :data="history"
            :droppable="i !== collectionHistory.length - 1"
            :class="{ underline: i === collectionHistory.length - 1 }"
          />
          <ArrowRightIcon class="h-5 w-5 self-center" />
        </div>
      </div>
    </div>
    <div v-if="loading" class="w-full mt-2">
      <div class="h-1.5 w-full bg-surface-3 overflow-hidden rounded-full">
        <div class="progress w-full h-full bg-gradient left-right"></div>
      </div>
    </div>
    <div
      class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-4"
    >
      <template v-if="collections?.length">
        <div
          v-for="collection in collections"
          :key="`${collection.id}_${collection.placeholders?.length}`"
        >
          <Collection
            :data="collection"
            :droppable="!!parentId"
            @open="openCollection(collection)"
            @updated="fetchCollections"
          />
        </div>
      </template>
    </div>
    <div
      class="border-b border-neutral-800 text-neutral-500 mt-4 font-bold text-lg"
    >
      Conjurations
    </div>
    <div class="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <template v-if="conjurations?.length && parentId">
        <div v-for="conjuration in conjurations" :key="conjuration.id">
          <ConjurationQuickView
            :data="conjuration"
            :show-saves="false"
            :has-actions="true"
          >
            <template #actions>
              <div class="absolute top-3 w-full z-50">
                <Menu class="flex cursor-pointer">
                  <div
                    class="absolute top-0 right-3 flex rounded-full bg-surface-3 p-1 z-10"
                  >
                    <MenuButton class="flex self-center mx-1 py-1">
                      <EllipsisHorizontalIcon class="h-6 w-6 self-center" />
                    </MenuButton>
                  </div>
                  <MenuItems>
                    <div
                      class="absolute left-0 right-0 top-10 z-10 bg-surface-3 py-2 rounded-[12px]"
                    >
                      <MenuItem @click="moveConjuration(conjuration)">
                        <div class="menu-item">
                          <div class="button-text flex gap-2">
                            <div class="self-center">
                              <ArrowRightEndOnRectangleIcon class="h-5 w-5" />
                            </div>
                            Move Conjuration
                          </div>
                        </div>
                      </MenuItem>
                      <MenuItem @click="removeCollectionConjuration">
                        <div class="menu-item">
                          <div class="button-text flex gap-2 text-red-400">
                            <div class="self-center">
                              <MinusCircleIcon class="h-5 w-5" />
                            </div>
                            Remove From Collection
                          </div>
                        </div>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            </template>
          </ConjurationQuickView>
        </div>
      </template>
      <div
        v-if="!conjurations.length"
        class="flex justify-center w-full col-span-full"
      >
        <div class="flex flex-col justify-center gap-2">
          <div class="text-neutral-500">No conjurations in this collection</div>
          <button
            class="button-gradient flex justify-center gap-2"
            @click="showAddConjurations = true"
          >
            <SparklesIcon class="h-5 w-5" />
            Add Conjurations
          </button>
        </div>
      </div>
    </div>
    <div v-if="!loading && !collections?.length && !conjurations?.length">
      <div class="text-center text-neutral-400">
        <div class="text-lg">No collections or conjurations found.</div>
        <button
          v-if="parentId"
          class="button-ghost-primary mt-2"
          @click="showNewCollection = true"
        >
          Add New Collection
        </button>
        <button
          v-if="parentId"
          class="button-ghost mt-2 ml-2"
          @click="showAddConjurations = true"
        >
          Add Conjurations
        </button>
      </div>
    </div>
  </div>
  <ModalAlternate :show="showNewCollection">
    <div class="bg-surface-2 rounded-[20px] min-w-[90vw] md:min-w-[50vw] p-6">
      <div class="flex justify-between mb-4">
        <div class="self-center text-lg">New Collection</div>
        <div
          class="self-center cursor-pointer"
          @click="showNewCollection = false"
        >
          <XCircleIcon class="h-6 w-6" />
        </div>
      </div>
      <div class="mb-4">
        <InputText
          v-model="newCollectionName"
          type="text"
          placeholder="New Collection Name"
        />
      </div>
      <div class="flex">
        <div>
          <button
            class="button-gradient"
            :disabled="!newCollectionName"
            @click="addCollection"
          >
            Create Collection
          </button>
        </div>
      </div>
    </div>
  </ModalAlternate>
  <ModalAlternate v-if="parentId" :show="showAddConjurations">
    <AddConjurationsToCollection
      :collection-id="parentId"
      :collection-name="parentName"
      class="md:max-w-[75vw] h-[90vw]"
      @close="closeAddConjurations"
    />
  </ModalAlternate>
  <ModalAlternate :show="showMoveConjuration">
    <ConjurationMove
      :data="conjurationToMove"
      :collection-id="parentId"
      @close="showMoveConjuration = false"
    />
  </ModalAlternate>
</template>

<style scoped></style>
