<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCollections, saveCollection } from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  SquaresPlusIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/vue/24/outline';
import { CheckCircleIcon } from '@heroicons/vue/20/solid';
import Spinner from '@/components/Core/Spinner.vue';

const props = defineProps<{
  modelValue: any;
  collectionId: number | undefined;
  parentId: number | undefined;
  conjurationId: number | undefined;
}>();

const emit = defineEmits(['update:modelValue']);

const loading = ref(false);
const collections = ref<any[]>([]);
const expanded = ref<number[]>([]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

onMounted(async () => {
  collections.value = await fetchCollections();
});

const fetchCollections = async () => {
  loading.value = true;
  try {
    const response = await getCollections(
      props.parentId,
      undefined,
      props.conjurationId,
    );
    return (
      response.data?.collections?.filter(
        (c: any) => c.id !== props.collectionId,
      ) || []
    );
  } catch {
    showError({
      message: 'Failed to fetch collections. Please refresh the page.',
    });
  } finally {
    loading.value = false;
  }
};

const expand = async (collection: any) => {
  if (expanded.value.includes(collection.id)) {
    expanded.value = expanded.value.filter((i) => i !== collection.id);
  } else {
    expanded.value = [...expanded.value, collection.id];
  }
};

const showNewCollection = ref(false);
const newCollectionName = ref('');

const addCollection = async () => {
  try {
    await saveCollection({
      name: newCollectionName.value,
      parentId: props.parentId,
    });
    collections.value = await fetchCollections();
    showNewCollection.value = false;
    newCollectionName.value = '';
    showSuccess({ message: 'Collection created!' });
  } catch {
    showError({ message: 'Failed to create collection. Please try again.' });
  }
};
</script>

<template>
  <div v-if="loading" class="w-full">
    <Spinner />
  </div>
  <div v-else :class="{ 'pt-0 pr-0 pl-4': !!parentId }">
    <div class="grid gap-4 grid-cols-1">
      <div v-for="col in collections" :key="col.id">
        <div class="flex">
          <div class="self-center">
            <ArrowUturnLeftIcon
              v-if="parentId"
              class="h-5 w-5 rotate-180 self-center mr-2 text-neutral-500"
            />
          </div>
          <div
            class="p-4 border border-neutral-800 rounded-[12px] flex gap-4 justify-between grow cursor-pointer hover:bg-violet-500/10"
            :class="{
              'border-fuchsia-500 bg-fuchsia-500/10': value?.id === col.id,
              'bg-neutral-900': value?.id !== col.id,
            }"
            @click="value = col"
          >
            <div class="flex gap-2 text-neutral-300">
              <div
                class="hover:bg-surface-2/75 rounded-[6px] cursor-pointer text-fuchsia-500 p-2"
                @click.stop="expand(col)"
              >
                <ChevronRightIcon
                  class="h-5 w-5"
                  :class="
                    expanded.includes(col.id) ? 'transform rotate-90' : ''
                  "
                />
              </div>
              <div class="self-center">
                <SquaresPlusIcon class="h-6 w-6" />
              </div>
              <div class="self-center whitespace-nowrap">
                {{ col.name }}
              </div>
            </div>
            <div
              v-if="value?.id === col.id || col.containsConjuration"
              class="self-center"
              :class="{
                'text-violet-500': value?.id === col.id,
                'text-neutral-500': col.containsConjuration,
              }"
            >
              <CheckCircleIcon class="h-6 w-6 self-center" />
            </div>
          </div>
        </div>
        <div
          v-if="expanded.includes(col.id)"
          class="grid gap-4 grid-cols-1 ml-4 mt-4"
        >
          <CollectionMoveTree
            v-model="value"
            :collection-id="props.collectionId"
            :parent-id="col.id"
            :conjuration-id="props.conjurationId"
          />
        </div>
      </div>
      <div v-if="parentId" class="flex mb-6">
        <div class="self-center">
          <ArrowUturnLeftIcon
            class="h-5 w-5 rotate-180 self-center mr-2 text-neutral-500"
          />
        </div>
        <div v-if="!showNewCollection" class="w-full">
          <button
            class="button-ghost-primary hover:bg-purple-500/10 w-full"
            @click="showNewCollection = true"
          >
            Add New Collection
          </button>
        </div>
        <div v-else>
          <div
            class="bg-surface-2 rounded-[20px] min-w-[90vw] md:min-w-[50vw] p-6"
          >
            <div class="mb-2">
              <InputText
                ref="newCollectionNameInput"
                v-model="newCollectionName"
                placeholder="New Collection Name"
                label="Collection Name"
                type="text"
                validation="required"
              />
            </div>
            <div class="flex gap-2">
              <div>
                <Button
                  class="button-ghost-primary"
                  @click="showNewCollection = false"
                >
                  Cancel
                </Button>
              </div>
              <div>
                <Button
                  class="button-gradient"
                  :disabled="!newCollectionName"
                  @click="addCollection"
                  >Create Collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
