<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  Conjuration,
  getConjurations,
  GetConjurationsRequest,
  getConjurationTags,
  GetConjurationTagsRequest,
} from "@/api/conjurations.ts";
import { XMarkIcon, BoltIcon } from "@heroicons/vue/20/solid";
import Select from "@/components/Core/Forms/Select.vue";
import { useSelectedCampaignId } from "@/lib/hooks.ts";
import { Conjurer, getConjurers } from "@/api/generators.ts";
import Autocomplete from "@/components/Core/Forms/Autocomplete.vue";
import ConjurationQuickView from "@/components/Conjuration/ConjurationListItemView.vue";

const selectedCampaignId = useSelectedCampaignId();

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
  },
);

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
    (t) => t !== tag,
  );
}
</script>

<template>
  <div class="mb-6 flex w-full justify-between rounded-xl bg-gray-800 p-4">
    <div class="w-full md:flex md:justify-between">
      <div class="md:flex">
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

        <div class="mt-2 md:mt-0">
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

        <div class="mt-2 md:mt-0">
          <div class="mb-1 text-gray-300">Tags</div>
          <div class="w-[20rem]">
            <Autocomplete
              v-model="conjurationsQuery.tags"
              :options="tags.map((t) => ({ value: t }))"
              class="mr-2"
              multiple
              display-prop="value"
              value-prop="value"
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
                  <XMarkIcon
                    class="h-6 w-6 self-center text-center text-white"
                  />
                </div>
                <div class="p-1 px-3">
                  {{ tag }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-2 self-center md:mt-0">
        <router-link to="/conjurations/new" class="mx-auto flex">
          <button
            class="flex w-full self-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-3 font-bold"
          >
            <BoltIcon class="mr-2 h-5 w-5" />
            <span class="self-center">Conjure</span>
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
</template>
