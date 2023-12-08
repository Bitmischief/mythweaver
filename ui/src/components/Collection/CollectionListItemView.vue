<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, ref, onMounted } from 'vue';
import {
  Collection,
  getCollections,
  removeCollection,
} from '@/api/collections.ts';
import { Conjuration, getCollectionConjurations } from '@/api/conjurations.ts';
import DeleteModal from '@/components/Core/General/DeleteModal.vue';
import { showSuccess } from '@/lib/notifications.ts';
import { CheckIcon, XMarkIcon } from '@heroicons/vue/20/solid';

const props = defineProps<{
  collection: Collection | undefined;
  skeleton?: boolean;
}>();

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

const collectionsMineQuery = ref({});

const collectionsQuery = computed(() => ({
  ...collectionsFilterQuery.value,
  ...collectionsPagingQuery.value,
  ...collectionsMineQuery.value,
}));

const emit = defineEmits([
  'add-collection',
  'view-collection',
  'remove-collection',
  'drag',
  'dragstart',
  'dragend',
  'drop',
]);

const childCollections = ref<Collection[]>([]);
const childConjurations = ref<Conjuration[]>([]);

const router = useRouter();
let hoverClass = 'unhover';

// async function handleAddCollection(collectionId: number) {
//   console.log(collectionId);
// }

async function navigateToViewCollection(collectionId: number) {
  await router.push(`/collections/view/${collectionId}`);
  emit('view-collection');
}

async function clickDeleteCollection() {
  if (!props.collection) return;
  const collectionId = props.collection?.id;
  // console.log(collectionId);
  await removeCollection(collectionId);
  showSuccess({ message: 'Successfully removed conjuration' });
  emit('remove-collection', {
    collectionId,
  });
  showDeleteModal.value = false;
}
async function dragStart() {
  emit('dragstart', props.collection?.id);
}
async function dragging() {
  emit('drag', {});
}
async function dragend() {
  emit('dragend', props.collection?.id);
}
async function drop() {
  console.log('dropped in child');
  emit('drop', props.collection?.id);
}
async function dragenter(e: Event) {
  e.preventDefault();
  hoverClass = 'hover';
}
async function dragover(e: Event) {
  e.preventDefault();
}
async function dragleave(e: Event) {
  e.preventDefault();
  hoverClass = 'unhover';
}

const showDeleteModal = ref(false);

onMounted(async () => {
  await loadCollections();
  await loadConjurations();
});

async function loadCollections() {
  const collectionsResponse = await getCollections({
    ...collectionsQuery.value,
    parentId: props.collection?.id,
  });
  childCollections.value = collectionsResponse.data.data;
}

async function loadConjurations() {
  const collectionsResponse = await getCollectionConjurations({
    collectionId: props.collection?.id,
  });
  childConjurations.value = collectionsResponse.data.data;
}
</script>

<template>
  <div
    v-if="collection"
    :id="'' + collection.id"
    class="mr-6 mb-6 collection_container"
    :class="hoverClass"
    draggable="true"
    @drop="drop"
    @dragstart="dragStart"
    @drag="dragging"
    @dragend="dragend"
    @dragenter="dragenter"
    @dragover="dragover"
    @dragleave="dragleave"
  >
    <div
      class="relative md:max-w-[23rem] 3xl:max-w-[40rem] flex cursor-pointer flex-col justify-end rounded-t-xl shadow-xl"
      @click="navigateToViewCollection(collection.id)"
    >
      <div
        class="flex flex-wrap"
        style="width: 368px; height: 368px; background-color: #1f2937"
      >
        <template
          v-for="child of childCollections.slice(0, 4)"
          :key="child.name"
        >
          <div
            class="bg-gradient-to-r from-fuchsia-500 to-blue-400"
            style="
              width: 184px;
              height: 184px;
              text-align: center;
              display: table;
            "
          >
            <div style="vertical-align: middle; display: table-cell">
              {{ child.name }}
            </div>
          </div>
        </template>
        <template v-if="childCollections.length < 4">
          <template v-for="child of childConjurations" :key="child.name">
            <div
              :value="child"
              :style="{ backgroundImage: 'url(\'' + child.imageUri + '\')' }"
              style="
                background-size: cover;
                background-position: center center;
                height: 184px;
                width: 184px;
                background-repeat: no-repeat;
              "
            />
            <!-- {{ child.name }} -->
            <!-- </div> -->
          </template>
        </template>
      </div>

      <div
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-green-500 hover:bg-red-500 transition-all hover:scale-110 group"
      >
        <XMarkIcon
          class="h-8 w-8 hidden group-hover:flex self-center text-white"
          @click.stop="showDeleteModal = true"
        />
        <CheckIcon
          class="h-8 w-8 self-center text-white flex group-hover:hidden"
        />
      </div>

      <div class="flex w-full justify-between rounded-b-lg bg-surface-2 p-4">
        <div>
          <div class="text-xl font-bold">{{ collection.name }}</div>
          <div class="flex flex-wrap">
            <div class="mr-1 mt-1 rounded-xl bg-gray-800 px-2 py-1 text-xs">
              {{ collection.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <DeleteModal v-model="showDeleteModal">
    <div class="text-center text-8xl">Wait!</div>
    <div class="mt-8 text-center text-3xl">
      Are you sure you want to remove this collection from your list?
    </div>

    <div class="mt-12 flex justify-center">
      <button
        class="mr-6 rounded-xl border border-green-500 px-6 py-3"
        @click="showDeleteModal = false"
      >
        No, keep collection
      </button>
      <button
        class="rounded-xl bg-red-500 px-6 py-3"
        @click="clickDeleteCollection"
      >
        Remove collection
      </button>
    </div>
  </DeleteModal>
</template>

<style scoped>
.hover {
  border: 2px solid green;
}
</style>
