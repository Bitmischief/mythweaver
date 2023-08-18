<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  addConjuration,
  Conjuration,
  getConjurations,
  GetConjurationsRequest,
  getConjurationTags,
  GetConjurationTagsRequest,
} from "@/api/conjurations.ts";
import { PlusIcon, XMarkIcon, CheckIcon } from "@heroicons/vue/20/solid";
import Select from "@/components/Core/Forms/Select.vue";
import { useCurrentUserId, useSelectedCampaignId } from "@/lib/hooks.ts";
import { Conjurer, getConjurers } from "@/api/generators.ts";
import Autocomplete from "@/components/Core/Forms/Autocomplete.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const selectedCampaignId = useSelectedCampaignId();
const currentUserId = useCurrentUserId();

const conjurers = ref<Conjurer[]>([]);

const conjurations = ref<Conjuration[]>([]);
const conjurationsQuery = ref<GetConjurationsRequest>({
  campaignId: selectedCampaignId.value,
  mine: undefined,
  conjurerCodes: [],
  tags: [],
  offset: 0,
  limit: 25,
});

const tags = ref<string[]>([]);
const tagsQuery = ref<GetConjurationTagsRequest>({
  term: "",
  offset: 0,
  limit: 10,
});

const isMyConjuration = (conjuration: Conjuration) =>
  conjuration.copies?.length || conjuration.userId === currentUserId.value;

onMounted(async () => {
  await loadConjurers();
  await loadConjurations();
  await loadTags();
});

watch(
  conjurationsQuery,
  async () => {
    await loadConjurations();
  },
  {
    deep: true,
  }
);

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  return `background-image: url("${imageUri}");`;
};

async function loadConjurations() {
  const conjurationsResponse = await getConjurations(conjurationsQuery.value);
  conjurations.value = conjurationsResponse.data.data;
}

async function loadConjurers() {
  const conjurersReponse = await getConjurers();
  conjurers.value = conjurersReponse.data.data;
}

async function loadTags() {
  const tagsReponse = await getConjurationTags(tagsQuery.value);
  tags.value = tagsReponse.data.data;
}

async function handleTagsQueryChange(term: string) {
  tagsQuery.value.term = term;
  await loadTags();
}

function removeTag(tag: string) {
  conjurationsQuery.value.tags = conjurationsQuery.value?.tags?.filter(
    (t) => t !== tag
  );
}

async function handleAddConjuration(conjurationId: number) {
  await addConjuration(conjurationId);
  await loadConjurations();
}

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}
</script>

<template>
  <div class="mb-6 flex w-full justify-between rounded-xl bg-gray-800 p-4">
    <div class="flex">
      <div>
        <div class="mb-1 text-gray-300">All Conjurations?</div>
        <Select
          v-model="conjurationsQuery.mine"
          :options="[
            {
              name: 'All',
              value: undefined,
            },
            {
              name: 'Only Mine',
              value: true,
            },
          ]"
          display-prop="name"
          value-prop="value"
          class="mr-2 w-[20rem]"
        />
      </div>

      <div>
        <div class="mb-1 text-gray-300">Conjuration Types</div>
        <Select
          v-model="conjurationsQuery.conjurerCodes"
          :options="conjurers"
          display-prop="name"
          value-prop="code"
          class="mr-2 w-[20rem]"
          multiple
          placeholder="Select conjuration types"
        />
      </div>

      <div>
        <div class="mb-1 text-gray-300">Tags</div>
        <div class="w-[20rem]">
          <Autocomplete
            v-model="conjurationsQuery.tags"
            :options="tags"
            class="mr-2"
            multiple
            @query-change="handleTagsQueryChange"
          />
          <div class="mt-2 flex">
            <div
              v-for="tag in conjurationsQuery.tags"
              :key="tag"
              class="relative mr-1 rounded-xl bg-gray-900"
            >
              <div
                class="absolute flex h-full w-full cursor-pointer justify-center rounded-xl bg-red-500/90 opacity-0 hover:opacity-100"
                @click="removeTag(tag)"
              >
                <XMarkIcon class="h-6 w-6 self-center text-center text-white" />
              </div>
              <div class="p-1 px-3">
                {{ tag }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <router-link to="/conjurations/new" class="flex">
      <button
        class="self-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 font-bold"
      >
        Conjure something magical
      </button>
    </router-link>
  </div>

  <div
    v-if="conjurations.length"
    class="grid grid-cols-2 gap-8 3xl:grid-cols-4"
  >
    <div
      v-for="conjuration of conjurations"
      :key="conjuration.name"
      class="h-30 relative flex cursor-pointer flex-col justify-end rounded-lg bg-cover bg-top shadow-xl md:h-[20rem] 3xl:h-[30rem]"
      :style="backgroundImageInlineStyle(conjuration.imageUri)"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div
        v-if="isMyConjuration(conjuration)"
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-green-500"
      >
        <CheckIcon class="h-8 w-8 self-center text-white" />
      </div>
      <div
        v-else
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-gray-800 hover:bg-gray-500"
        @click="handleAddConjuration(conjuration.id)"
      >
        <button class="self-center">
          <PlusIcon class="h-8 w-8 text-white" />
        </button>
      </div>
      <div class="flex justify-between rounded-b-lg bg-black/50 p-4">
        <div>
          <div class="text-xl font-bold">{{ conjuration.name }}</div>
          <div class="flex flex-wrap">
            <div
              v-for="tag of conjuration.tags"
              :key="`${conjuration.id}-${tag}`"
              class="mr-1 mt-1 rounded-xl bg-gray-800 px-2 py-1 text-xs"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
