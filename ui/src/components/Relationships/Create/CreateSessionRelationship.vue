<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { getSessions, SessionBase } from '@/api/sessions.ts';
import { postConjurationRelationship } from '@/api/relationships.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { LinkIcon } from '@heroicons/vue/24/outline';
import { debounce } from 'lodash';
import Spinner from '@/components/Core/Spinner.vue';
import { useEventBus } from '@/lib/events.ts';
import { CheckCircleIcon } from '@heroicons/vue/20/solid';

defineEmits(['relationship-created']);

const props = defineProps<{
  nodeId: number;
  nodeType: ConjurationRelationshipType;
}>();

let loading = ref(false);
let eventBus = useEventBus();

onMounted(async () => {
  try {
    await fetchSessions();
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

let searchText = ref<string | undefined>();
let sessions = ref<SessionBase[]>([]);
let loadingSessions = ref(true);
let page = ref(0);
let moreToLoad = ref(true);

watch(
  searchText,
  debounce(async () => {
    page.value = 0;
    await fetchSessions(false);
  }, 1000),
);

async function loadNextPage() {
  page.value += 1;
  await fetchSessions();
}

async function fetchSessions(concat = true) {
  try {
    loadingSessions.value = true;
    const pageSize = 25;
    const search =
      searchText.value !== undefined && searchText.value === ''
        ? undefined
        : searchText.value;
    const response = await getSessions({
      offset: page.value * pageSize,
      limit: pageSize,
      search: search,
      nodeId: props.nodeId,
      nodeType: props.nodeType,
    });
    const results = response.data.data.filter((c: any) =>
      props.nodeType === ConjurationRelationshipType.SESSION
        ? c.id !== props.nodeId
        : true,
    );
    moreToLoad.value = !(response.data.data.length < pageSize);
    if (results.length) {
      if (concat) {
        sessions.value = sessions.value.concat(results);
      } else {
        sessions.value = results;
      }
    }
  } catch (e: any) {
    showError({
      message: `Something went wrong fetching sessions.`,
      context: e.message,
    });
  } finally {
    loadingSessions.value = false;
  }
}

const linking = ref<number>(-1);
async function linkSession(session: SessionBase) {
  linking.value = session.id;
  try {
    await postConjurationRelationship(
      session.id,
      ConjurationRelationshipType.SESSION,
      {
        relatedNodeId: props.nodeId,
        relatedNodeType: props.nodeType,
      },
    );
    showSuccess({ message: 'Conjuration relationship created!' });
    session.linked = true;
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
      placeholder="Search sessions"
      autofocus
    />
  </div>
  <div v-show="!loading && !loadingSessions" class="h-[calc(100%-3em)]">
    <div class="h-full overflow-y-auto">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 pr-2">
        <div
          v-for="(session, i) in sessions"
          :key="`session_${i}`"
          class="bg-surface-3 rounded-[12px] p-2"
        >
          <div class="relative">
            <img
              :src="session.imageUri"
              alt="session image"
              class="mx-auto w-full h-auto rounded-[12px]"
            />
          </div>
          <div class="flex justify-between mt-2">
            <div
              class="self-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ session.name }}
            </div>
            <div
              class="relative self-center"
              :class="{ 'group hover:text-fuchsia-500': linking === -1 }"
            >
              <LinkIcon
                v-if="linking !== session.id && !session.linked"
                class="h-8 w-8"
                :class="{
                  'cursor-not-allowed text-neutral-500': linking !== -1,
                  'cursor-pointer': linking === -1,
                }"
                @click="linkSession(session)"
              />
              <CheckCircleIcon v-else-if="session.linked" class="h-8 w-8" />
              <Spinner v-else class="h-8 w-8" />
              <div
                class="group-hover:block absolute -top-6 right-0 bg-surface-2 px-2 rounded-full hidden text-neutral-300 whitespace-nowrap"
              >
                <span v-if="!session.linked">Create Relationship</span>
                <span v-else>Relationship Exists</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="moreToLoad" class="text-center col-span-full">
          <button class="button-gradient" @click="loadNextPage">
            Load More
          </button>
        </div>
        <div v-else class="text-center col-span-full">No more results...</div>
      </div>
    </div>
  </div>
  <div v-show="loading || loadingSessions" class="flex justify-center h-full">
    <div class="my-auto min-w-[20vw] animate-pulse">Loading Sessions...</div>
  </div>
</template>

<style scoped></style>
