<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Conjuration,
  getConjuration,
  getConjurations,
} from '@/api/conjurations.ts';
import { AdjustmentsVerticalIcon, SparklesIcon } from '@heroicons/vue/20/solid';
import ConjurationQuickView from '@/components/Conjuration/ConjurationListItemView.vue';
import { debounce } from 'lodash';
import ConjurationsListFiltering from '@/components/Conjuration/ConjurationsListFiltering.vue';
import { useRoute } from 'vue-router';

const pagingDone = ref(false);
const conjurations = ref<Conjuration[]>([]);
const showFilters = ref(false);

const route = useRoute();

const defaultPaging = {
  offset: 0,
  limit: 20,
};
const conjurationsPagingQuery = ref(defaultPaging);

const defaultFilters = {
  conjurerCodes: [],
  imageStylePreset: undefined,
  tags: [],
};
const conjurationsFilterQuery = ref(defaultFilters);

const conjurationsMineQuery = ref({
  saved: true,
});

const conjurationsQuery = computed(() => ({
  ...conjurationsFilterQuery.value,
  ...conjurationsPagingQuery.value,
  ...conjurationsMineQuery.value,
}));

onMounted(async () => {
  await loadConjurations();

  const viewParent = document.querySelector('#view-parent');
  viewParent?.addEventListener('scroll', () => {
    if (!viewParent) return;

    if (
      viewParent.scrollTop + viewParent.clientHeight >=
      viewParent.scrollHeight * 0.75
    ) {
      pageConjurations();
    }
  });

  if (route.hash === '#gallery') {
    conjurationsMineQuery.value.saved = false;
  } else {
    conjurationsMineQuery.value.saved = true;
  }
});

watch(
  () => route.hash,
  () => {
    if (route.hash === '#gallery') {
      conjurationsMineQuery.value.saved = false;
    } else {
      conjurationsMineQuery.value.saved = true;
    }
  },
);

watch(
  conjurationsPagingQuery,
  async () => {
    await loadConjurations(conjurationsPagingQuery.value.offset !== 0);
  },
  {
    deep: true,
  },
);

watch(
  [conjurationsFilterQuery, conjurationsMineQuery],
  async () => {
    pagingDone.value = false;
    if (conjurationsPagingQuery.value.offset === 0) {
      await loadConjurations();
    } else {
      conjurationsPagingQuery.value.offset = 0;
    }
  },
  {
    deep: true,
  },
);

const pageConjurations = debounce(() => {
  conjurationsPagingQuery.value.offset += conjurationsPagingQuery.value.limit;
}, 250);

async function loadConjurations(append = false) {
  if (pagingDone.value) return;

  const conjurationsResponse = await getConjurations({
    ...conjurationsQuery.value,
  });

  if (!append) {
    conjurations.value = conjurationsResponse.data.data;
  } else {
    conjurations.value.push(...conjurationsResponse.data.data);
  }

  if (conjurationsResponse.data.data.length === 0) {
    pagingDone.value = true;
  }
}

function handleFiltersUpdated(filters: any) {
  // the spread here is necessary so that we aren't setting the REFERENCE of the object.
  // otherwise after the first apply click, any filter changes will be applied immediately
  // without waiting for another apply click
  conjurationsFilterQuery.value = { ...filters };
  showFilters.value = false;
}

async function handleConjurationChange(change: {
  conjurationId: number;
  parentConjurationId?: number;
}) {
  const id = change.parentConjurationId || change.conjurationId;
  const conjurationResponse = await getConjuration(id);

  const conjurationIndex = conjurations.value.findIndex((c) => c.id === id);

  conjurations.value[conjurationIndex] = conjurationResponse.data;

  if (!conjurations.value[conjurationIndex].saved) {
    conjurations.value.splice(conjurationIndex, 1);
  }
}
</script>

<template>
  <ConjurationsListFiltering
    :show="showFilters"
    @close="showFilters = false"
    @update-filters="handleFiltersUpdated"
  />

  <div class="flex w-full justify-between rounded-xl pb-8">
    <div class="w-full md:flex md:justify-between">
      <div class="flex">
        <div
          v-if="conjurationsMineQuery.saved"
          class="text-xl self-center mr-6"
        >
          My Conjurations
        </div>
        <div v-else class="text-xl self-center mr-6">Gallery</div>
      </div>

      <div class="self-center flex justify-between">
        <button
          v-if="
            JSON.stringify(conjurationsFilterQuery) !==
            JSON.stringify(defaultFilters)
          "
          class="mr-2 px-3 py-1.5 rounded-md justify-start items-center gap-[5px] inline-flex transition-all hover:scale-110 text-sm"
          @click="conjurationsFilterQuery = defaultFilters"
        >
          <span class="text-white text-sm font-normal underline">
            Clear Filters
          </span>
        </button>

        <button
          class="mr-2 px-3 py-1.5 bg-neutral-900 rounded-md justify-start items-center gap-[5px] inline-flex transition-all hover:scale-110 text-sm"
          @click="showFilters = true"
        >
          <AdjustmentsVerticalIcon class="w-5 h-5 mr-2" />
          <span class="text-white text-sm font-normal">Filters</span>
        </button>

        <router-link to="/conjurations/new" class="flex">
          <button
            class="flex w-full self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-3 py-1.5 transition-all hover:scale-110 text-sm"
          >
            <SparklesIcon class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Create</span>
          </button>
        </router-link>
      </div>
    </div>
  </div>

  <div
    v-if="!conjurations.length && conjurationsMineQuery.saved"
    class="bg-surface-2 rounded-md p-8 flex justify-center"
  >
    <div>
      <div class="self-center text-neutral-600 text-5xl mb-12">
        You don't have any saved conjurations
      </div>

      <router-link to="/conjurations/new" class="flex justify-center">
        <button
          class="flex rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 text-3xl px-4 py-3 transition-all hover:scale-125 duration-100"
        >
          <SparklesIcon class="mr-4 h-8 w-8 self-center" />
          <span class="self-center">Conjure</span>
        </button>
      </router-link>
    </div>
  </div>

  <div
    v-if="conjurations.length"
    class="grid grid-cols-1 place-items-stretch sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
  >
    <ConjurationQuickView
      v-for="conjuration of conjurations"
      :key="conjuration.name"
      :conjuration="conjuration"
      @add-conjuration="handleConjurationChange"
      @remove-conjuration="handleConjurationChange"
    />
  </div>

  <div v-if="conjurations.length && pagingDone" class="my-12 pb-12 w-full">
    <div class="text-center text-xl text-gray-500 divider">
      No more conjurations to show!
    </div>
  </div>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
}

.divider::before,
.divider::after {
  flex: 1;
  content: '';
  padding: 1px;
  background-color: #212121;
  margin: 0 16px;
}
</style>
