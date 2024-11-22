<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { Conjuration, getConjurations } from '@/api/conjurations.ts';
import { debounce } from 'lodash';
import ConjurationListItemView from '@/components/Conjuration/ConjurationListItemView.vue';
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/vue/24/solid';
import { XCircleIcon } from '@heroicons/vue/24/outline';
import {
  deleteCollectionConjuration,
  saveCollectionConjuration,
} from '@/api/collections.ts';
import Spinner from '@/components/Core/Spinner.vue';
import ConjurationsListFiltering from '@/components/Conjuration/ConjurationsListFiltering.vue';
import { AdjustmentsVerticalIcon } from '@heroicons/vue/20/solid';

const emit = defineEmits(['close']);
const props = defineProps<{
  collectionId: number;
  collectionName: string;
}>();

const loading = ref(false);
const searchText = ref<string | undefined>('');
const conjurations = ref<Conjuration[]>([]);
const loadingConjurations = ref(true);
const page = ref(0);
const moreToLoad = ref(true);
const clearFilterKey = ref(1);
const showFilters = ref(false);
const defaultFilters = {
  conjurerCodes: [],
  tags: [],
};
const conjurationsFilterQuery = ref(defaultFilters);

onMounted(async () => {
  try {
    await fetchConjurations();
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

watch(
  searchText,
  debounce(async () => {
    page.value = 0;
    await fetchConjurations(false);
  }, 1000),
);

watch(
  conjurationsFilterQuery,
  async () => {
    page.value = 0;
    await fetchConjurations(false);
  },
  {
    deep: true,
  },
);

async function fetchConjurations(concat = true) {
  try {
    loadingConjurations.value = true;
    const pageSize = 25;
    const search =
      searchText.value !== undefined && searchText.value === ''
        ? undefined
        : searchText.value?.trim();
    const response = await getConjurations({
      offset: page.value * pageSize,
      limit: pageSize,
      saved: true,
      search: search,
      collectionId: props.collectionId,
      tags: conjurationsFilterQuery.value.tags,
      conjurerCodes: conjurationsFilterQuery.value.conjurerCodes,
    });
    const conjurationResponse = response.data.data;
    moreToLoad.value = !(response.data.data.length < pageSize);
    if (concat) {
      conjurations.value = conjurations.value.concat(conjurationResponse);
    } else {
      conjurations.value = conjurationResponse;
    }
  } catch (e: any) {
    showError({
      message: `Something went wrong fetching conjurations.`,
      context: e.message,
    });
    throw e;
  } finally {
    loadingConjurations.value = false;
  }
}

const addToCollection = async (conjuration: Conjuration) => {
  try {
    await saveCollectionConjuration(props.collectionId, {
      conjurationId: conjuration.id,
    });
    showSuccess({ message: 'Conjuration added' });
    conjuration.inCollection = true;
  } catch (e: any) {
    showError({ message: e.message });
  }
};

const removeFromCollection = async (conjuration: Conjuration) => {
  try {
    await deleteCollectionConjuration(props.collectionId, conjuration.id);
    conjuration.inCollection = false;
    showSuccess({ message: 'Conjuration removed from collection' });
  } catch {
    showError({
      message:
        'Failed to remove conjuration from collection. Please try again.',
    });
  }
};

async function loadNextPage() {
  page.value += 1;
  await fetchConjurations();
}

function handleFiltersUpdated(filters: any) {
  conjurationsFilterQuery.value = {
    ...filters,
  };
  showFilters.value = false;
}

const clearFilters = () => {
  conjurationsFilterQuery.value = defaultFilters;
  searchText.value = undefined;
  clearFilterKey.value += 1;
};
</script>

<template>
  <div
    class="relative bg-surface-2 p-6 min-w-[50vw] min-h-[90vh] md:h-1 rounded-[20px] flex flex-col"
  >
    <ConjurationsListFiltering
      :key="clearFilterKey"
      :show="showFilters"
      @close="showFilters = false"
      @update-filters="handleFiltersUpdated"
    />

    <div class="flex justify-between mb-4">
      <div class="self-center text-lg">
        Add Conjurations to
        <span class="gradient-text">{{ collectionName }}</span>
      </div>
      <div class="self-center cursor-pointer" @click="emit('close')">
        <button class="button-gradient">Done</button>
      </div>
    </div>
    <div class="mt-2 flex gap-2">
      <InputText
        v-model="searchText"
        class="w-full"
        type="text"
        placeholder="Search conjurations"
        autofocus
      />
      <div class="flex gap-2">
        <div>
          <button
            v-if="
              JSON.stringify(conjurationsFilterQuery) !==
              JSON.stringify(defaultFilters)
            "
            class="button-ghost-primary"
            @click="clearFilters"
          >
            <span class="text-white text-sm font-normal"> Clear Filters </span>
          </button>
        </div>
        <div>
          <button
            class="button-primary flex self-center"
            @click="showFilters = true"
          >
            <AdjustmentsVerticalIcon class="w-5 h-5 mr-2" />
            <span class="text-white text-sm font-normal">Filters</span>
          </button>
        </div>
      </div>
    </div>
    <div class="grow overflow-y-auto">
      <div v-if="loadingConjurations" class="flex gap-2 justify-center my-6">
        <div class="self-center">
          <Spinner />
        </div>
        <div class="text-neutral-300">Loading</div>
      </div>
      <div
        class="grid place-items-stretch gap-2 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div v-for="con in conjurations" :key="con.id" class="relative">
          <div
            v-if="con.inCollection"
            class="absolute top-4 right-4 z-10 cursor-pointer"
          >
            <div
              class="text-neutral-200 hover:text-neutral-400"
              @click="removeFromCollection(con)"
            >
              <XCircleIcon class="h-8 w-8" />
            </div>
          </div>
          <div
            class="absolute z-10 bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg whitespace-nowrap"
          >
            <div v-if="con.inCollection" class="text-center">
              <button class="button-primary flex gap-1" disabled>
                <CheckCircleIcon class="h-5 w-5" />
                <span>Added To Collection</span>
              </button>
            </div>
            <div v-else>
              <button
                class="button-gradient flex gap-2"
                @click="addToCollection(con)"
              >
                <PlusCircleIcon class="h-5 w-5" />
                <span>Add To Campaign</span>
              </button>
            </div>
          </div>
          <ConjurationListItemView
            class="pointer-events-none h-full"
            :data="con"
            :show-saves="false"
            :highlight-text="searchText"
          />
        </div>
        <div v-if="moreToLoad" class="text-center col-span-full">
          <button class="button-gradient" @click="loadNextPage">
            <span v-if="!loadingConjurations">Load More</span>
            <Spinner v-else />
          </button>
        </div>
        <div v-else class="text-center col-span-full my-6">
          No more results...
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
