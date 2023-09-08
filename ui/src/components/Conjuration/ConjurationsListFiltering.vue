<script setup lang="ts">
import ModalAlternate from "@/components/ModalAlternate.vue";
import Autocomplete from "@/components/Core/Forms/Autocomplete.vue";
import { BoltIcon, XMarkIcon } from "@heroicons/vue/20/solid";
import Select from "@/components/Core/Forms/Select.vue";
import { Conjurer, getConjurers } from "@/api/generators.ts";
import {
  getConjurationTags,
  GetConjurationTagsRequest,
} from "@/api/conjurations.ts";
import { onMounted, ref } from "vue";
import { useSelectedCampaignId } from "@/lib/hooks.ts";

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["updateFilters", "close"]);

const selectedCampaignId = useSelectedCampaignId();

const conjurers = ref<Conjurer[]>([]);

const conjurationsFilterQuery = ref({
  campaignId: selectedCampaignId.value,
  mine: false,
  saved: false,
  conjurerCodes: [],
  tags: [],
});

const tags = ref<string[]>([]);
const tagsQuery = ref<GetConjurationTagsRequest>({
  term: "",
  offset: 0,
  limit: 10,
});

onMounted(async () => {
  await loadConjurers();
  await loadTags();
});

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
  conjurationsFilterQuery.value.tags =
    conjurationsFilterQuery.value?.tags?.filter((t) => t !== tag);
}
</script>

<template>
  <ModalAlternate :show="show" @close="emit('close')">
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="text-2xl border-b border-gray-700 pb-2 mb-6">
        Filter Conjurations
      </div>

      <div class="">
        <div class="mb-1 text-gray-300">Mine</div>
        <div class="mb-1 text-xs text-neutral-500">
          Get conjurations you have created
        </div>
        <input
          v-model="conjurationsFilterQuery.mine"
          type="checkbox"
          class="h-6 w-6 gradient-border-no-opacity bg-surface focus:bg-fuchsia-500"
        />
      </div>

      <div class="mt-4">
        <div class="mb-1 text-gray-300">Saved</div>
        <div class="mb-1 text-xs text-neutral-500">
          Get conjurations you have saved
        </div>
        <input
          v-model="conjurationsFilterQuery.saved"
          type="checkbox"
          class="h-6 w-6 gradient-border-no-opacity bg-surface focus:bg-fuchsia-500"
        />
      </div>

      <div class="mt-4">
        <div class="mb-1 text-gray-300">Conjuration Types</div>
        <Select
          v-model="conjurationsFilterQuery.conjurerCodes"
          :options="conjurers"
          display-prop="name"
          value-prop="code"
          class="w-full md:w-[20rem]"
          multiple
          placeholder="Select conjuration types"
        />
      </div>

      <div class="mt-4">
        <div class="mb-1 text-gray-300">Tags</div>
        <div class="w-full md:w-[20rem]">
          <Autocomplete
            v-model="conjurationsFilterQuery.tags"
            :options="tags.map((t) => ({ value: t }))"
            multiple
            display-prop="value"
            value-prop="value"
            @query-change="handleTagsQueryChange"
          />
          <div class="mt-2 flex">
            <div
              v-for="tag in conjurationsFilterQuery.tags"
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

        <button
          class="mt-4 flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="emit('updateFilters', conjurationsFilterQuery)"
        >
          <BoltIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Apply</span>
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
