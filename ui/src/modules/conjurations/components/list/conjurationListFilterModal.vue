<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import Autocomplete from '@/components/Core/Forms/Autocomplete.vue';
import { BoltIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { GetConjurationTagsRequest } from '@/modules/conjurations/types';
import { Select } from 'primevue';

import { onMounted, ref } from 'vue';
import { useConjurationStore } from '../../store/conjuration.store';

const conjurationStore = useConjurationStore();
const model = defineModel<boolean>({ required: true });

const typesFilter = ref<string>();
const tagsFilter = ref<string[]>([]);

const tagsQuery = ref<GetConjurationTagsRequest>({
  term: '',
  offset: 0,
  limit: 10,
});

onMounted(async () => {
  await conjurationStore.getConjurationTypes();
  await loadTags();
});

async function loadTags() {
  await conjurationStore.getConjurationTags(tagsQuery.value);
}

async function handleTagsQueryChange(term: string) {
  tagsQuery.value.term = term;
  await loadTags();
}

function removeTag(tag: string) {
  tagsFilter.value = tagsFilter.value.filter((t) => t !== tag);
}

function applyFilters() {
  conjurationStore.conjurationListFilters = {
    ...conjurationStore.conjurationListFilters,
    tags: tagsFilter.value,
    conjurerCodes: typesFilter.value ? [typesFilter.value] : [],
  };
  model.value = false;
}
</script>

<template>
  <ModalAlternate :show="model" @close="model = false">
    <div class="md:w-[499px] p-6 bg-surface rounded-[20px]">
      <div class="text-2xl border-b border-gray-700 pb-2 mb-6 text-center">
        Filter Conjurations
      </div>

      <div class="mt-4">
        <div class="mb-1 text-neutral-400 text-sm">Conjuration Types</div>
        <Select
          v-model="typesFilter"
          :options="conjurationStore.conjurationTypes"
          option-label="name"
          option-value="code"
          placeholder="Select conjuration types"
        />
      </div>

      <div class="mt-4">
        <div class="mb-1 text-neutral-400 text-sm">Tags</div>
        <div class="w-full">
          <Autocomplete
            v-model="tagsFilter"
            :options="
              conjurationStore.conjurationTags.map((t) => ({ value: t }))
            "
            multiple
            display-prop="value"
            value-prop="value"
            @query-change="handleTagsQueryChange"
          />
          <div class="mt-2 flex">
            <div
              v-for="tag in tagsFilter"
              :key="tag"
              class="relative mr-1 rounded-xl bg-surface-2 border border-gray-700"
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

        <button class="flex button-gradient mt-4" @click="applyFilters">
          <BoltIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Apply Filters</span>
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
