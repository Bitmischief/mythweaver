<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  Conjuration,
  getConjuration,
  getConjurations,
} from '@/api/conjurations.ts';
import { postConjurationRelationship } from '@/api/relationships.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
  ArrowsUpDownIcon,
  ArrowDownIcon,
} from '@heroicons/vue/20/solid';
import { debounce } from 'lodash';
import Spinner from '@/components/Core/Spinner.vue';
import { useEventBus } from '@/lib/events.ts';
import { mapConjurationType, mapNoImage } from '@/lib/util.ts';

defineEmits(['relationship-created', 'close']);

const eventBus = useEventBus();
const props = defineProps<{
  conjurationId: number;
}>();

let loading = ref(false);

onMounted(async () => {
  try {
    await fetchConjuration();
    await fetchConjurations();
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

let searchText = ref<string | undefined>('');
let conjurations = ref<Conjuration[]>([]);
let conjuration = ref();
let loadingConjurations = ref(true);
let page = ref(0);
let moreToLoad = ref(true);

let linking = ref<Conjuration>();
let twoWay = ref(false);
let linkComment = ref('');
let reverseLinkComment = ref('');

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

async function fetchConjuration() {
  const response = await getConjuration(props.conjurationId);
  conjuration.value = response.data;
}

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
      nodeId: props.conjurationId,
      nodeType: ConjurationRelationshipType.CONJURATION,
    });
    const results = response.data.data.filter(
      (c: any) => c.id !== props.conjurationId,
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

async function linkConjuration() {
  if (!linking.value) {
    return;
  }

  try {
    await postConjurationRelationship(
      props.conjurationId,
      ConjurationRelationshipType.CONJURATION,
      {
        relatedNodeId: linking.value.id,
        relatedNodeType: ConjurationRelationshipType.CONJURATION,
        comment: linkComment.value,
      },
    );

    if (twoWay.value) {
      await postConjurationRelationship(
        linking.value.id,
        ConjurationRelationshipType.CONJURATION,
        {
          relatedNodeId: props.conjurationId,
          relatedNodeType: ConjurationRelationshipType.CONJURATION,
          comment: reverseLinkComment.value,
        },
      );
    }

    showSuccess({ message: 'Conjuration relationship created!' });
    eventBus.$emit('relationship-created', {
      conjurationId: props.conjurationId,
    });
    await fetchConjurations(false);
  } catch (e: any) {
    showError({
      message: 'Something went wrong creating the conjuration relationship',
    });
  } finally {
    linking.value = undefined;
    linkComment.value = '';
    twoWay.value = false;
  }
}

const primaryImageUri = (data: any) => {
  if (data?.images?.length) {
    return data.images?.find((i: any) => i.primary)?.uri;
  }
  return undefined;
};

function conjurationType(conjuration: Conjuration) {
  return mapConjurationType(conjuration.conjurerCode);
}

function noImage(conjurerCode: string) {
  return mapNoImage(conjurerCode);
}

function startLinking(conjuration: Conjuration) {
  if (!conjuration.linked) {
    linking.value = conjuration;
  }
}

function cancelLinking() {
  linking.value = undefined;
  linkComment.value = '';
  twoWay.value = false;
}
</script>

<template>
  <div class="max-h-full flex flex-col">
    <div class="grow flex justify-between">
      <div class="text-xl">
        Add Relationship to
        <span class="gradient-text">
          {{ conjuration.name }}
        </span>
      </div>
      <div class="self-center">
        <button class="button-text" @click="$emit('close')">
          <XCircleIcon class="h-6 w-6" />
        </button>
      </div>
    </div>
    <div v-if="!linking" class="mt-2">
      <FormKit
        v-model="searchText"
        type="text"
        placeholder="Search conjurations"
        autofocus
      />
    </div>
    <div v-show="!loading && !linking" class="grow-0 overflow-y-auto">
      <div
        class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 pr-2"
      >
        <div
          v-for="(con, i) in conjurations"
          :key="`conjuration_${i}_${con.id}`"
          class="bg-surface-3 rounded-[12px] p-2"
          :class="{
            'cursor-pointer hover:bg-purple-800/25': !con.linked,
          }"
          @click="startLinking(con)"
        >
          <div class="relative">
            <img
              :src="primaryImageUri(con) || noImage(con.conjurerCode)"
              alt="conjuration image"
              class="mx-auto w-full h-auto rounded-[12px]"
            />
            <div
              class="absolute flex justify-center items-center rounded-full bg-white/50 text-black text-xs font-bold left-2 top-2 h-6 px-4"
            >
              {{ conjurationType(con) }}
            </div>
            <div class="absolute top-1 right-1">
              <div
                class="relative self-center"
                :class="{
                  'group hover:text-fuchsia-500': linking === undefined,
                }"
              >
                <CheckCircleIcon v-if="con.linked" class="h-8 w-8" />
                <div
                  class="group-hover:block absolute -bottom-6 right-0 bg-surface-2 px-2 rounded-full hidden text-neutral-300 whitespace-nowrap"
                >
                  <span v-if="!con.linked">Create Relationship</span>
                  <span v-else>Relationship Exists</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2">
            <div
              class="self-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ con.name }}
            </div>
          </div>
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
    <div v-show="!loading && linking" class="grow-0 overflow-y-auto p-2">
      <div class="flex flex-col md:flex-row justify-center h-full">
        <div class="basis-2/5">
          <img
            :src="
              primaryImageUri(conjuration) || noImage(conjuration.conjurerCode)
            "
            alt="conjuration image"
            class="mx-auto w-full h-auto rounded-[12px] max-w-[25rem] mb-2"
          />
          <div class="p-2 text-lg rounded-[12px] bg-surface-3 truncate">
            {{ conjuration.name }}
          </div>
        </div>
        <div class="basis-1/5 flex justify-center my-6 md:my-auto">
          <div class="hidden md:block">
            <ArrowsRightLeftIcon v-if="twoWay" class="h-8 w-8" />
            <ArrowRightIcon v-else class="h-8 w-8" />
          </div>
          <div class="md:hidden">
            <ArrowsUpDownIcon v-if="twoWay" class="h-8 w-8" />
            <ArrowDownIcon v-else class="h-8 w-8" />
          </div>
        </div>
        <div class="basis-2/5">
          <img
            :src="
              primaryImageUri(linking) || noImage(linking?.conjurerCode || '')
            "
            alt="conjuration image"
            class="mx-auto w-full h-auto rounded-[12px] max-w-[25rem] mb-2"
          />
          <div class="p-2 text-lg rounded-[12px] bg-surface-3 truncate">
            {{ linking?.name }}
          </div>
        </div>
      </div>
      <div class="flex mt-6">
        <div :class="{ 'basis-full': !twoWay, 'basis-2/5': twoWay }">
          <FormKit
            v-model="linkComment"
            type="text"
            :label="`Relationship with ${linking?.name}`"
            placeholder="e.g. 'friends with', 'killed by'"
            :help="
              linkComment
                ? `${linking?.name} ${linkComment} ${conjuration.name}`
                : ``
            "
          />
        </div>
        <div v-if="twoWay" class="basis-1/5"></div>
        <div v-if="twoWay" class="basis-2/5">
          <FormKit
            v-model="reverseLinkComment"
            type="text"
            :label="`Relationship with ${conjuration.name}`"
            placeholder="e.g. 'friends with', 'killed by'"
            :help="
              reverseLinkComment
                ? `${linking?.name} ${reverseLinkComment} ${conjuration.name}`
                : ``
            "
          />
        </div>
      </div>
      <div class="w-full mt-6">
        <FormKit
          v-model="twoWay"
          type="checkbox"
          label="Two Way Relationship"
          decorator-icon="check"
          help="This will create the relationship going both directions"
        />
      </div>
    </div>
    <div v-if="!loading && linking" class="grow">
      <hr class="border-neutral-800 -mx-6" />
      <div class="flex gap-2 mt-6">
        <div class="basis-1/2">
          <button class="button-primary w-full" @click="cancelLinking">
            Back
          </button>
        </div>
        <div class="basis-1/2">
          <button class="button-gradient w-full" @click="linkConjuration">
            Add relationship
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-show="loading || loadingConjurations" class="flex justify-center">
    <div class="my-auto min-w-[20vw] animate-pulse">
      Loading Conjurations...
    </div>
  </div>
</template>

<style scoped></style>
