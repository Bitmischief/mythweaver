<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { getCollections, saveCollection } from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  ArrowRightIcon,
  SquaresPlusIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
} from '@heroicons/vue/24/outline';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import {
  XCircleIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/solid';
import AddConjurationsToCollection from '@/components/Collections/AddConjurationsToCollection.vue';
import Collection from '@/components/Collections/Collection.vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import CollectionHistory from '@/components/Collections/CollectionHistory.vue';
import { useRoute, useRouter } from 'vue-router';
import CollectionConjuration from '@/components/Collections/CollectionConjuration.vue';

const loading = ref(true);
const channel = useWebsocketChannel();
const router = useRouter();
const route = useRoute();

const collections = ref<any[]>([]);
const conjurations = ref<any[]>([]);
const collectionHistory = ref<any[]>([]);

const showNewCollection = ref(false);
const showAddConjurations = ref(false);

const newCollectionName = ref('');
const parentId = ref<number | undefined>();

const props = defineProps<{
  campaign?: any;
}>();

watch(parentId, async () => {
  await router.push({
    query: {
      history: collectionHistory.value?.length
        ? JSON.stringify(
            collectionHistory.value.map((h: any) => ({
              id: h.id,
              name: h.name,
              campaign: h.campaignId,
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

    if (props.campaign && historyArray[0].campaignId !== props.campaign.id) {
      await router.push({
        query: {
          history: undefined,
        },
      });
    } else {
      collectionHistory.value = historyArray;
      parentId.value = historyArray[historyArray.length - 1].id;
    }
  }

  channel.bind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.bind(ServerEvent.CollectionMoved, fetchCollections);

  await fetchCollections();

  if (props.campaign) {
    await openCollection(collections.value[0]);
  }
});

onUnmounted(() => {
  channel.unbind(ServerEvent.CollectionConjurationMoved, fetchCollections);
  channel.unbind(ServerEvent.CollectionMoved, fetchCollections);
});

const fetchCollections = async () => {
  loading.value = true;
  try {
    const response = await getCollections(parentId.value, props.campaign?.id);
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

async function clearHistory() {
  collectionHistory.value = [];
  parentId.value = undefined;
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
  return props.campaign ? collectionHistory.value.length > 1 : !!parentId.value;
});
</script>

<template>
  <div class="w-full flex justify-between mb-4">
    <div class="flex md:justify-start grow">
      <div class="text-xl self-center">
        <span class="gradient-text"> Campaign Collections </span>
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
        <div v-if="!campaign" class="flex" @click="clearHistory">
          <HomeIcon class="h-5 w-5 self-center" />
          <CollectionHistory
            :data="{
              id: undefined,
              name: 'Campaigns',
            }"
            :droppable="!!campaign"
          />
          <ArrowRightIcon class="h-5 w-5 ml-2 self-center" />
        </div>
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
            :droppable="campaign || !!parentId"
            @open="openCollection(collection)"
            @updated="fetchCollections"
          />
        </div>
      </template>
      <template v-if="conjurations?.length && parentId">
        <div v-for="conjuration in conjurations" :key="conjuration.id">
          <CollectionConjuration
            :data="conjuration"
            :collection-id="parentId"
            @deleted="fetchCollections"
          />
        </div>
      </template>
    </div>
    <div v-if="!loading && !collections?.length && !conjurations?.length">
      <div class="text-center text-neutral-400">
        <div class="text-lg">No collections or conjurations found.</div>
        <div v-if="!parentId && !campaign" class="text-neutral-500 text-sm">
          Create a new campaign to get started using collections.
          <div class="text-white my-4">
            <router-link class="button-gradient" to="/campaigns/new"
              >Create Campaign
            </router-link>
          </div>
        </div>
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
  <ModalAlternate v-if="parentId" :show="showAddConjurations">
    <AddConjurationsToCollection
      :collection-id="parentId"
      :collection-name="parentName"
      class="md:max-w-[75vw] h-[90vw]"
      @close="closeAddConjurations"
    />
  </ModalAlternate>
</template>

<style scoped></style>
