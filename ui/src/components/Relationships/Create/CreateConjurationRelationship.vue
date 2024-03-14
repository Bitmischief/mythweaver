<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { Conjuration, getConjurations } from '@/api/conjurations.ts';
import { postConjurationRelationship } from '@/api/relationships.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { LinkIcon } from '@heroicons/vue/24/outline';
import { debounce } from 'lodash';
import Spinner from '@/components/Core/Spinner.vue';
import { useEventBus } from '@/lib/events.ts';

defineEmits(['relationship-created']);

const props = defineProps<{
  nodeId: number;
  nodeType: ConjurationRelationshipType;
}>();

let loading = ref(false);
let eventBus = useEventBus();

onMounted(async () => {
  try {
    await fetchConjurations();
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

let searchText = ref<string | undefined>('');
let conjurations = ref<Conjuration[]>([]);
let loadingConjurations = ref(true);
let page = ref(0);
let moreToLoad = ref(true);

watch(
  searchText,
  debounce(async () => {
    page.value = 0;
    await fetchConjurations(false);
  }, 1000),
);

async function loadNextPage() {
  page.value += 1;
  await fetchConjurations();
}

async function fetchConjurations(concat = true) {
  try {
    loadingConjurations.value = true;
    const pageSize = 10;
    const search =
      searchText.value !== undefined && searchText.value === ''
        ? undefined
        : searchText.value;
    const response = await getConjurations({
      offset: page.value * pageSize,
      limit: pageSize,
      saved: true,
      search: search,
    });
    const results = response.data.data.filter((c: any) =>
      props.nodeType === ConjurationRelationshipType.CONJURATION
        ? c.id !== props.nodeId
        : true,
    );
    moreToLoad.value = !(response.data.data.length < pageSize);
    if (results.length) {
      if (concat) {
        conjurations.value = conjurations.value.concat(results);
      } else {
        conjurations.value = results;
      }
    }
  } catch (e: any) {
    showError({
      message: `Something went wrong fetching conjurations.`,
      context: e.message,
    });
  } finally {
    loadingConjurations.value = false;
  }
}

const linking = ref<number>(-1);
async function linkConjuration(conjuration: Conjuration) {
  linking.value = conjuration.id;
  try {
    await postConjurationRelationship(
      conjuration.id,
      ConjurationRelationshipType.CONJURATION,
      {
        relatedNodeId: props.nodeId,
        relatedNodeType: props.nodeType,
      },
    );
    showSuccess({ message: 'Conjuration relationship created!' });
    eventBus.$emit('relationship-created', {
      nodeId: props.nodeId,
      nodeType: props.nodeType,
    });
  } catch (e: any) {
    showError({
      message: 'Something went wrong creating the conjuration relationship',
    });
  } finally {
    linking.value = -1;
  }
}
</script>

<template>
  <div class="mt-2">
    <FormKit
      v-model="searchText"
      type="text"
      placeholder="Search conjurations"
      autofocus
    />
  </div>
  <div v-show="!loading && !loadingConjurations" class="h-full">
    <div class="overflow-y-auto h-[calc(100%-3em)] pr-2">
      <div
        v-for="(conjuration, i) in conjurations"
        :key="`conjuration_${i}`"
        class="bg-surface-3 rounded-[12px] p-2 flex justify-between my-2"
      >
        <div class="flex">
          <img
            :src="conjuration.imageUri"
            alt="conjuration image"
            class="max-w-[100px] rounded-[12px]"
          />
          <div class="p-4 text-lg self-center">
            {{ conjuration.name }}
          </div>
        </div>
        <div
          class="relative px-4 self-center"
          :class="{ 'group hover:text-fuchsia-500': linking === -1 }"
          @click="linkConjuration(conjuration)"
        >
          <LinkIcon
            v-if="linking !== conjuration.id"
            class="h-8 w-8"
            :class="{
              'cursor-not-allowed text-neutral-500': linking !== -1,
              'cursor-pointer': linking === -1,
            }"
          />
          <Spinner v-else class="h-8 w-8" />
          <div
            class="group-hover:block absolute -top-8 right-0 bg-surface-2 px-2 rounded-full hidden text-neutral-300 whitespace-nowrap"
          >
            Create Relationship
          </div>
        </div>
      </div>
      <div v-if="moreToLoad" class="text-center">
        <button class="button-gradient" @click="loadNextPage">Load More</button>
      </div>
      <div v-else class="text-center">No more results...</div>
    </div>
  </div>
  <div
    v-show="loading || loadingConjurations"
    class="flex justify-center h-full"
  >
    <div class="my-auto min-w-[20vw] animate-pulse">
      Loading Conjurations...
    </div>
  </div>
</template>

<style scoped></style>
