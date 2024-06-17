<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getCollections, saveCollection } from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  ArrowRightIcon,
  SquaresPlusIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  ArrowRightEndOnRectangleIcon,
  FolderMinusIcon,
} from '@heroicons/vue/24/outline';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { XCircleIcon, SparklesIcon } from '@heroicons/vue/24/solid';
import AddConjurationsToCollection from '@/components/Collections/AddConjurationsToCollection.vue';
import ConjurationListItemView from '@/components/Conjuration/ConjurationListItemView.vue';
import Collection from '@/components/Collections/Collection.vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import CollectionHistory from '@/components/Collections/CollectionHistory.vue';

const channel = useWebsocketChannel();

const collections = ref<any[]>([]);
const conjurations = ref<any[]>([]);
const collectionHistory = ref<any[]>([]);

const showNewCollection = ref(false);
const showAddConjurations = ref(false);

const newCollectionName = ref('');
const parentId = ref<number | undefined>();

onMounted(async () => {
  channel.bind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.bind(ServerEvent.CollectionMoved, fetchCollections);

  await fetchCollections();
});

onUnmounted(() => {
  channel.unbind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.unbind(ServerEvent.CollectionMoved, fetchCollections);
});

const fetchCollections = async () => {
  try {
    const response = await getCollections(parentId.value);
    collections.value = response.data?.collections || [];
    conjurations.value = response.data?.conjurations || [];
  } catch {
    showError({
      message: 'Failed to fetch collections. Please refresh the page.',
    });
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
    showSuccess({ message: 'Collection saved!' });
  } catch {
    showError({ message: 'Failed to save collection. Please try again.' });
  }
};

const openCollection = async (collection: any) => {
  parentId.value = collection.id;
  await fetchCollections();
  collectionHistory.value.push(collection);
};

async function clickHistory(collection: any) {
  const historyIndex = collectionHistory.value.findIndex(
    (h) => h.id === collection.id,
  );
  collectionHistory.value = collectionHistory.value.slice(0, historyIndex + 1);

  if (collectionHistory.value.length) {
    parentId.value =
      collectionHistory.value[collectionHistory.value.length - 1].id;
  } else {
    parentId.value = undefined;
  }

  await fetchCollections();
}

async function clearHistory() {
  collectionHistory.value = [];
  parentId.value = undefined;
  await fetchCollections();
}

async function closeAddConjurations() {
  await fetchCollections();
  showAddConjurations.value = false;
}
</script>

<template>
  <div class="w-full flex justify-between mb-4">
    <div class="flex md:justify-start grow">
      <div class="text-xl self-center">
        <span class="gradient-text">My Collections</span>
      </div>
    </div>
    <div class="self-center">
      <Menu>
        <MenuButton class="button-ghost-primary">
          <EllipsisHorizontalIcon class="h-6 w-6 text-neutral-300" />
        </MenuButton>

        <template #content>
          <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
            <MenuItem>
              <div class="menu-item">
                <button
                  class="button-text flex gap-2"
                  @click="showNewCollection = true"
                >
                  <SquaresPlusIcon class="h-5 w-5" />
                  New Collection
                </button>
              </div>
            </MenuItem>
            <MenuItem v-if="parentId">
              <div class="menu-item">
                <button
                  class="button-text flex gap-2"
                  @click="showAddConjurations = true"
                >
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
    <div
      class="flex shrink py-1 px-2 bg-surface-2 rounded-full mb-4 text-neutral-400 whitespace-nowrap overflow-x-auto"
    >
      <div class="flex gap-4 px-2 hover:underline hover:cursor-pointer">
        <div class="flex gap-2 hover:text-neutral-200" @click="clearHistory">
          <HomeIcon class="h-5 w-5 self-center" />
          <div>Home</div>
        </div>
        <ArrowRightIcon class="h-5 w-5 self-center" />
      </div>
      <div
        v-for="(history, i) in collectionHistory"
        :key="`history_${i}`"
        @click="clickHistory(history)"
      >
        <CollectionHistory :data="history" />
      </div>
    </div>
    {{}}
    <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <template v-if="collections.length">
        <div
          v-for="collection in collections"
          :key="`${collection.id}_${collection.placeholders?.length}`"
        >
          <Collection
            :data="collection"
            @open="openCollection(collection)"
            @updated="fetchCollections"
          />
        </div>
      </template>
      <template v-if="conjurations.length">
        <div
          v-for="conjuration in conjurations"
          :key="conjuration.id"
          class="relative"
        >
          <div
            class="cursor-pointer absolute top-3 right-3 rounded-full bg-surface-3 p-1 z-10"
          >
            <Menu>
              <MenuButton class="self-center mx-1 py-1">
                <EllipsisHorizontalIcon class="h-6 w-6 self-center" />
              </MenuButton>

              <template #content>
                <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
                  <MenuItem>
                    <div class="menu-item">
                      <button
                        class="button-text flex gap-2"
                        @click="showNewCollection = true"
                      >
                        <ArrowRightEndOnRectangleIcon class="h-5 w-5" />
                        Move Conjuration
                      </button>
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <div class="menu-item">
                      <button
                        class="button-text flex gap-2 text-red-400"
                        @click="showNewCollection = true"
                      >
                        <FolderMinusIcon class="h-5 w-5" />
                        Remove From Collection
                      </button>
                    </div>
                  </MenuItem>
                </div>
              </template>
            </Menu>
          </div>
          <ConjurationListItemView :data="conjuration" draggable />
        </div>
      </template>
    </div>
    <div v-if="!collections.length && !conjurations.length">
      <div class="text-center text-neutral-400">
        <div>No collections or conjurations found.</div>
        <button
          class="button-ghost-primary mt-2"
          @click="showNewCollection = true"
        >
          Add New Collection
        </button>
        <button
          v-if="collectionHistory.length"
          class="button-ghost mt-2 ml-2"
          @click="showAddConjurations = true"
        >
          Add Conjurations
        </button>
      </div>
    </div>
  </div>
  <ModalAlternate :show="showNewCollection">
    <FormKit type="form" :actions="false" @submit="addCollection">
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
        <div class="mt-1">
          <FormKit
            ref="newCollectionNameInput"
            v-model="newCollectionName"
            placeholder="New Collection Name"
            label="Collection Name"
            type="text"
            validation="required"
          />
        </div>
        <div class="flex">
          <div>
            <button class="button-gradient">Create Collection</button>
          </div>
        </div>
      </div>
    </FormKit>
  </ModalAlternate>
  <ModalAlternate :show="showAddConjurations" class="">
    <AddConjurationsToCollection
      :collection-id="parentId"
      class="md:max-w-[75vw] h-[90vw]"
      @close="closeAddConjurations"
    />
  </ModalAlternate>
</template>

<style scoped></style>
