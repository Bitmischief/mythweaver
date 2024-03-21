<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Conjuration,
  getConjuration,
  getConjurations,
} from '@/api/conjurations.ts';
import { AdjustmentsVerticalIcon, SparklesIcon } from '@heroicons/vue/20/solid';
import { Squares2X2Icon, QueueListIcon } from '@heroicons/vue/24/outline';
import { PhotoIcon } from '@heroicons/vue/24/outline';
import ConjurationQuickView from '@/components/Conjuration/ConjurationListItemView.vue';
import { debounce } from 'lodash';
import ConjurationsListFiltering from '@/components/Conjuration/ConjurationsListFiltering.vue';
import { useRoute, useRouter } from 'vue-router';
import { useConjurationsStore } from '@/store/conjurations.store.ts';

const pagingDone = ref(false);
const conjurations = ref<Conjuration[]>([]);
const showFilters = ref(false);
const loading = ref(false);

const route = useRoute();
const router = useRouter();

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

const conjurationsHistoryQuery = ref({
  history: false,
});

const conjurationsQuery = computed(() => ({
  ...conjurationsFilterQuery.value,
  ...conjurationsPagingQuery.value,
  ...conjurationsMineQuery.value,
  history: conjurationsHistoryQuery.value.history
    ? conjurationsHistoryQuery.value.history
    : undefined,
}));

onMounted(async () => {
  loading.value = true;

  if (route.hash === '#gallery') {
    conjurationsMineQuery.value.saved = false;
  } else if (route.hash === '#history') {
    conjurationsMineQuery.value.saved = true;
    conjurationsHistoryQuery.value.history = true;
  } else {
    conjurationsMineQuery.value.saved = true;
  }

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

  loading.value = false;
});

watch(
  () => route.hash,
  () => {
    if (route.hash === '#gallery') {
      conjurationsMineQuery.value.saved = false;
    } else if (route.hash === '#history') {
      conjurationsMineQuery.value.saved = true;
      conjurationsHistoryQuery.value.history = true;
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

const toggleHistory = async () => {
  if (route.hash === '#history') {
    await router.push('/conjurations#saved');
  } else {
    await router.push('/conjurations#history');
  }
};

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

const conjurationsStore = useConjurationsStore();
const viewType = computed(() => {
  return conjurationsStore.viewType;
});
function changeView(type: string) {
  conjurationsStore.setType(type);
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
      <div class="flex justify-center md:justify-start grow">
        <div v-if="conjurationsMineQuery.saved" class="text-xl self-center">
          My Conjurations
          <span v-if="conjurationsHistoryQuery.history" class="text-neutral-500"
            >| History</span
          >
        </div>
        <div v-else class="text-xl self-center mr-6">Gallery</div>
      </div>

      <div
        class="mt-2 self-center flex justify-center md:justify-end gap-2 grow flex-wrap md:flex-nowrap"
      >
        <button
          v-if="
            conjurationsMineQuery.saved && !conjurationsHistoryQuery.history
          "
          class="button-ghost-primary self-center whitespace-nowrap flex flex-nowrap"
          @click="toggleHistory"
        >
          <span class="text-sm flex">
            Show <span class="hidden md:block mx-1">Conjuration</span> History
          </span>
        </button>
        <button
          v-if="conjurationsMineQuery.saved && conjurationsHistoryQuery.history"
          class="button-ghost self-center whitespace-nowrap flex flex-nowrap"
          @click="toggleHistory"
        >
          <span class="text-neutral-300 text-sm flex">
            <span class="hidden md:block mr-1">Show</span>My Conjurations
          </span>
        </button>

        <button
          v-if="
            JSON.stringify(conjurationsFilterQuery) !==
            JSON.stringify(defaultFilters)
          "
          class="button-ghost-white"
          @click="conjurationsFilterQuery = defaultFilters"
        >
          <span class="text-white text-sm font-normal"> Clear Filters </span>
        </button>

        <button
          class="button-primary flex self-center"
          @click="showFilters = true"
        >
          <AdjustmentsVerticalIcon class="w-5 h-5 mr-2" />
          <span class="text-white text-sm font-normal">Filters</span>
        </button>

        <router-link to="/conjurations/new" class="flex">
          <button class="button-gradient flex self-center">
            <SparklesIcon class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Create</span>
          </button>
        </router-link>
        <div class="self-center cursor-pointer">
          <Squares2X2Icon
            v-if="viewType !== 'grid'"
            class="h-6 w-6 self-center"
            @click="changeView('grid')"
          />
          <QueueListIcon
            v-else
            class="h-6 w-6 self-center"
            @click="changeView('list')"
          />
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="!conjurations.length && conjurationsMineQuery.saved && !loading"
    class="flex justify-center h-full"
  >
    <div class="flex flex-col justify-center text-center">
      <div>
        <PhotoIcon class="h-14 text-neutral-500 mx-auto" />
      </div>
      <div class="self-center text-2xl my-4">
        No conjurations have been saved yet.
      </div>
      <div class="text-neutral-500 mb-8 max-w-[40em]">
        Conjurations you have saved will appear on this screen. Try creating
        your first conjuration using the button below, or you can visit the
        Gallery to view and save community generated conjurations.
      </div>
      <router-link to="/conjurations/new" class="flex justify-center">
        <button class="button-gradient flex">
          <SparklesIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Create Conjuration</span>
        </button>
      </router-link>
    </div>
  </div>

  <div
    v-if="conjurations.length && !loading"
    class="grid place-items-stretch gap-2 md:gap-5"
    :class="{
      'grid-cols-1 md:grid-cols-2 xl:grid-cols-3': viewType === 'list',
      'grid-cols-2 md:grid-cols-3 lg:grid-cols-4': viewType === 'grid',
    }"
  >
    <ConjurationQuickView
      v-for="conjuration of conjurations"
      :key="conjuration.name"
      :data="conjuration"
      :show-saves="!conjurationsMineQuery.saved"
      :condensed-view="viewType === 'list'"
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
