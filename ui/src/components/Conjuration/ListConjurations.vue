<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Conjuration, getConjurations } from "@/api/conjurations.ts";
import { BoltIcon, AdjustmentsVerticalIcon } from "@heroicons/vue/20/solid";
import ConjurationQuickView from "@/components/Conjuration/ConjurationListItemView.vue";
import { debounce } from "lodash";
import ConjurationsListFiltering from "@/components/Conjuration/ConjurationsListFiltering.vue";

const pagingDone = ref(false);
const conjurations = ref<Conjuration[]>([]);
const showFilters = ref(false);

const conjurationsQuery = computed(() => ({
  ...conjurationsFilterQuery.value,
  ...conjurationsPagingQuery.value,
}));

const initialPaging = {
  offset: 0,
  limit: 8,
};
const conjurationsPagingQuery = ref(initialPaging);
const conjurationsFilterQuery = ref({
  mine: false,
  saved: false,
  conjurerCodes: [],
  tags: [],
});

onMounted(async () => {
  await loadConjurations();

  const viewParent = document.querySelector("#view-parent");
  viewParent?.addEventListener("scroll", () => {
    if (!viewParent) return;

    if (
      viewParent.scrollTop + viewParent.clientHeight >=
      viewParent.scrollHeight * 0.75
    ) {
      pageConjurations();
    }
  });
});

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
  conjurationsFilterQuery,
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
</script>

<template>
  <ConjurationsListFiltering
    :show="showFilters"
    @close="showFilters = false"
    @update-filters="handleFiltersUpdated"
  />

  <div class="mb-6 flex w-full justify-between rounded-xl p-4">
    <div class="w-full md:flex md:justify-between">
      <div class="text-2xl self-center font-bold">Conjurations List</div>

      <div class="mt-2 self-center md:mt-0 flex justify-between">
        <button
          class="w-[122px] mr-2 h-[46px] p-3 bg-neutral-900 rounded-md justify-start items-center gap-[5px] inline-flex transition-all hover:scale-110"
          @click="showFilters = true"
        >
          <AdjustmentsVerticalIcon class="w-5 h-5 mr-2" />
          <span class="text-white text-sm font-normal">Filters</span>
        </button>

        <router-link to="/conjurations/new" class="flex">
          <button
            class="flex w-full self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          >
            <BoltIcon class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Create</span>
          </button>
        </router-link>
      </div>
    </div>
  </div>

  <div
    v-if="conjurations.length"
    class="grid grid-cols-1 gap-8 md:grid-cols-2 3xl:grid-cols-4"
  >
    <ConjurationQuickView
      v-for="conjuration of conjurations"
      :key="conjuration.name"
      :conjuration="conjuration"
      @add-conjuration="loadConjurations"
      @remove-conjuration="loadConjurations"
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
  content: "";
  padding: 1px;
  background-color: #212121;
  margin: 0 16px;
}
</style>
