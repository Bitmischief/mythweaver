<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError } from '@/lib/notifications.ts';
import { Conjuration, getConjurations } from '@/api/conjurations.ts';
import { debounce } from 'lodash';
import ConjurationListItemView from '@/components/Conjuration/ConjurationListItemView.vue';
import { XCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import { saveCollectionConjuration } from '@/api/collections.ts';
import Spinner from '@/components/Core/Spinner.vue';

const emit = defineEmits(['close']);
const props = defineProps<{
  collectionId: number;
}>();

let loading = ref(false);
let searchText = ref<string | undefined>('');
let conjurations = ref<Conjuration[]>([]);
let loadingConjurations = ref(true);
let page = ref(0);
let moreToLoad = ref(true);

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

async function fetchConjurations(concat = true) {
  try {
    loadingConjurations.value = true;
    const pageSize = 25;
    const search =
      searchText.value !== undefined && searchText.value === ''
        ? undefined
        : searchText.value;
    const response = await getConjurations({
      offset: page.value * pageSize,
      limit: pageSize,
      saved: true,
      search: search,
      collectionId: props.collectionId,
    });
    const conjurationResponse = response.data.data;
    moreToLoad.value = !(response.data.data.length < pageSize);
    if (conjurationResponse.length) {
      if (concat) {
        conjurations.value = conjurations.value.concat(conjurationResponse);
      } else {
        conjurations.value = conjurationResponse;
      }
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
    conjuration.inCollection = true;
  } catch (e: any) {
    showError({ message: e.message });
  }
};

async function loadNextPage() {
  page.value += 1;
  await fetchConjurations();
}
</script>

<template>
  <div
    class="bg-surface-2 p-6 min-w-[50vw] max-h-[95vh] overflow-hidden rounded-[20px] flex flex-col"
  >
    <div class="flex justify-between mb-4">
      <div class="self-center text-lg">Add Conjurations</div>
      <div class="self-center cursor-pointer" @click="emit('close')">
        <XCircleIcon class="h-6 w-6" />
      </div>
    </div>
    <div class="mt-2">
      <FormKit
        v-model="searchText"
        type="text"
        placeholder="Search conjurations"
        autofocus
      />
    </div>
    <div class="grow overflow-y-auto">
      <div
        class="grid place-items-stretch gap-2 md:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="con in conjurations"
          :key="con.id"
          class="relative"
          @click.once="addToCollection(con)"
        >
          <div
            class="absolute z-10 bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg whitespace-nowrap"
          >
            <div v-if="con.inCollection" class="text-green-500 rounded-full">
              <button class="button-primary flex gap-1" disabled>
                <CheckCircleIcon class="h-5 w-5" />
                <span>In Collection</span>
              </button>
            </div>
            <div v-else>
              <button class="button-gradient">Add To Collection</button>
            </div>
          </div>
          <ConjurationListItemView
            class="pointer-events-none"
            :data="con"
            :show-saves="false"
          />
        </div>
        <div v-if="moreToLoad" class="text-center col-span-full">
          <button class="button-gradient" @click="loadNextPage">
            <span v-if="!loadingConjurations">Load More</span>
            <Spinner v-else />
          </button>
        </div>
        <div v-else class="text-center col-span-full">No more results...</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
