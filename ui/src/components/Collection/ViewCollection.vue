<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  Collection,
  copyCollection,
  patchCollection,
  getCollection,
  getCollections,
  removeCollection,
  saveCollection,
} from '@/api/collections.ts';
import {
  Conjuration,
  // getConjuration,
  updateCollectionConjuration,
  getCollectionConjurations,
} from '@/api/conjurations.ts';
import { useRoute, useRouter } from 'vue-router';
import { useEventBus } from '@/lib/events.ts';
import CustomizeCollection from '@/components/Collection/ViewCollection/CustomizeCollection.vue';
import ConjurationQuickView from '@/components/Conjuration/ConjurationListItemView.vue';
import CollectionQuickView from '@/components/Collection/CollectionListItemView.vue';
import { HeartIcon } from '@heroicons/vue/20/solid';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { showSuccess, showError } from '@/lib/notifications.ts';

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const currentUserId = useCurrentUserId();

const collection = ref<Collection | null>(null);

const conjurations = ref<Conjuration[]>([]);
const collections = ref<Collection[]>([]);

let currentDragTarget: any = null;

const defaultPaging = {
  offset: 0,
  limit: 20,
};

const defaultFilters = {
  conjurerCodes: [],
  imageStylePreset: undefined,
  tags: [],
};
const collectionsPagingQuery = ref(defaultPaging);

const collectionsFilterQuery = ref(defaultFilters);

const collectionsMineQuery = ref({
  tab: 0,
});

const collectionsQuery = computed(() => ({
  ...collectionsFilterQuery.value,
  ...collectionsPagingQuery.value,
  ...collectionsMineQuery.value,
}));

// Get Collection Id from URL Params
const collectionId = computed(() =>
  parseInt(route.params.collectionId?.toString()),
);

// Check if collection was created by user, and is saved
const editable = computed(
  () =>
    collection.value?.saved && collection.value?.userId === currentUserId.value,
);

// On start load current collection
onMounted(async () => {
  await loadCollection();
  await loadCollections();
});

// If collectionId changes, load new collection
watch(collectionId, async () => {
  await loadCollection();
});

// Load collection from DB based on CollectionId
async function loadCollection() {
  if (collectionId.value) {
    const response = await getCollection(collectionId.value);
    collection.value = response.data;

    if (collection.value?.copies?.length) {
      await router.push(`/collections/view/${collection.value.copies[0].id}`);
      await loadCollection();
    }
  }
}

// Save collection
async function handleSaveCollection() {
  await saveCollection(collectionId.value);
  showSuccess({ message: 'Successfully saved collection!' });
  await loadCollection();
}

// Remove Collection
async function handleRemoveCollection() {
  if (confirm('Are you sure you want to delete this collection?')) {
    await removeCollection(collectionId.value);
    showSuccess({ message: 'Successfully removed collection!' });
    await router.push('/collections');
  }
}

// Copy Collection
async function handleCopyCollection() {
  const response = await copyCollection(collectionId.value);
  showSuccess({ message: 'Successfully copied collection!' });
  await router.push(`/collections/view/${response.data.id}`);
}

async function loadCollections() {
  const collectionsResponse = await getCollections({
    ...collectionsQuery.value,
    parentId: collection?.value?.id,
  });

  collections.value = collectionsResponse.data.data;

  const collectionConjurationsResponse = await getCollectionConjurations({
    collectionId: collection?.value?.id,
  });
  conjurations.value = collectionConjurationsResponse.data.data;
  let collectionConjurations =
    collectionConjurationsResponse.data.collectionConjurations;
  conjurations.value.forEach((conjuration) => {
    let targetConjuration = collectionConjurations.find(
      (collectionConjuration: any) => {
        return collectionConjuration.conjurationId == conjuration.id;
      },
    );
    conjuration.collection_id = targetConjuration.id;
  });
  console.log(conjurations.value);
}

async function childIsDragging() {
  // console.log('child being draggggged');
}

async function childDragStart(collection: number) {
  currentDragTarget = collection;
}
async function childDragEnd(collection: number) {
  console.log(collection);
}
// async function conjurationDragStart(conjuration: number) {
//   currentDragTarget = conjuration;
// }

async function childDropped(collection: number) {
  // console.log('child being dropped');
  let parentId = collection;
  let childType = currentDragTarget.conjurerCode
    ? currentDragTarget.conjurerCode
    : 'collection';
  if (childType == 'collection') {
    let myCollectionId = currentDragTarget;
    const myCollection = collections.value.find((collection) => {
      return (collection.id = myCollectionId);
    });
    if (myCollection) {
      myCollection.parentId = parentId;
      const response = await patchCollection(myCollection.id, {
        name: myCollection.name,
        description: myCollection.description,
      });
      if (response.status === 200) {
        showSuccess({ message: 'collection saved' });
      } else {
        showError({
          message: 'Failed to save collection. Please try again in a moment.',
        });
      }
    }
  } else if (childType == 'characters') {
    let conjurationId = currentDragTarget.id;
    let parentId = collection;
    let currentConjuration: any = conjurations.value.filter((conjuration) => {
      return conjuration.id == conjurationId;
    })[0];
    const response = await updateCollectionConjuration({
      id: currentConjuration.collection_id,
      conjurationId: conjurationId,
      collectionId: parentId,
    });
    if (response.status === 200) {
      showSuccess({ message: 'collection saved' });
      await router.push(`/collections/view/${parentId}`);
      await loadCollection();
      await loadCollections();
    } else {
      showError({
        message: 'Failed to save collection. Please try again in a moment.',
      });
    }
  }
}
</script>

<template>
  <div v-if="collection">
    <div class="md:flex justify-between mb-6">
      <div class="md:flex">
        <router-link
          :to="`/collections`"
          class="bg-surface-2 flex rounded-md border border-gray-600/50 p-3"
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back
        </router-link>

        <div
          v-if="collection.saved && !editable"
          class="md:ml-2 mt-2 md:mt-0 border border-blue-500 rounded-md px-4 flex"
        >
          <span class="self-center"
            >You must make a copy of this collection to make changes to
            it.</span
          >
        </div>
      </div>

      <div class="md:flex mt-2 md:mt-0">
        <button
          v-if="editable"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="
            eventBus.$emit('save-collection', {
              collectionId: collection.id,
            })
          "
        >
          <span class="self-center">Save Changes</span>
        </button>

        <button
          v-if="collection.saved && !editable"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="handleCopyCollection"
        >
          <DocumentDuplicateIcon class="h-5 w-5 mr-2" />
          <span class="self-center">Copy Collection</span>
        </button>

        <button
          v-if="!collection.saved"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-green-400 to-green-600 px-4 py-3 transition-all hover:scale-110"
          @click="handleSaveCollection"
        >
          <HeartIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Save Collection</span>
        </button>

        <button
          v-if="collection.saved"
          class="md:ml-2 mt-2 md:mt-0 h-12 flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-red-400 to-red-600 px-4 py-3 transition-all hover:scale-110"
          @click="handleRemoveCollection"
        >
          Delete
        </button>
      </div>
    </div>

    <CustomizeCollection :collection="collection" />
    <div class="children-container flex">
      <CollectionQuickView
        v-for="collection of collections"
        :key="collection.name"
        :collection="collection"
        @drag="childIsDragging"
        @drop="childDropped"
        @dragstart="childDragStart"
        @dragend="childDragEnd"
      />
      <ConjurationQuickView
        v-for="conjuration of conjurations"
        :key="conjuration.name"
        :conjuration="conjuration"
      />
    </div>
  </div>
</template>
