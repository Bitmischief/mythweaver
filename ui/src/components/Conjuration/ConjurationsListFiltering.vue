<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import { BoltIcon } from '@heroicons/vue/20/solid';
import { Conjurer, getConjurers } from '@/api/generators.ts';
import {
  getConjurationTags,
  GetConjurationTagsRequest,
} from '@/api/conjurations.ts';
import { onMounted, ref, onUnmounted } from 'vue';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import Select from 'primevue/select';
import MultiSelect, { MultiSelectFilterEvent } from 'primevue/multiselect';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['updateFilters', 'close']);

const selectedCampaignId = useSelectedCampaignId();

const conjurers = ref<Conjurer[]>([]);

const conjurationsFilterQuery = ref({
  campaignId: selectedCampaignId.value,
  conjurerCodes: [],
  tags: [],
});

const tags = ref<string[]>([]);
const tagsQuery = ref<GetConjurationTagsRequest>({
  term: '',
  offset: 0,
  limit: 10,
});

onMounted(async () => {
  await loadConjurers();
  await loadTags();
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

async function loadConjurers() {
  const conjurersReponse = await getConjurers();
  conjurers.value = conjurersReponse.data.data;
}

async function loadTags() {
  const tagsResponse = await getConjurationTags(tagsQuery.value);
  tags.value = tagsResponse.data.data;
}

async function handleTagsQueryChange(event: MultiSelectFilterEvent) {
  tagsQuery.value.term = event.value;
  await loadTags();
}
</script>

<template>
  <ModalAlternate :show="show" @close="emit('close')">
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="text-2xl border-b border-gray-700 pb-2 mb-6 text-center">
        Filter Conjurations
      </div>

      <div class="mt-4">
        <div class="mb-1 text-neutral-400 text-sm">Conjuration Types</div>
        <Select
          v-model="conjurationsFilterQuery.conjurerCodes"
          placeholder="Select conjuration types"
          option-label="name"
          option-value="code"
          :options="conjurers"
          multiple
        />
      </div>

      <div class="mt-4">
        <div class="mb-1 text-neutral-400 text-sm">Tags</div>
        <div class="w-full">
          <MultiSelect
            v-model="conjurationsFilterQuery.tags"
            :options="tags.map((t) => ({ value: t }))"
            display="chip"
            optionLabel="value"
            optionValue="value"
            placeholder="Select tags to filter by"
            filter
            @filter="handleTagsQueryChange"
            autoFilterFocus
            autoOptionFocus
            highlightOnSelect
          />
        </div>

        <button
          class="flex button-gradient mt-4"
          @click="emit('updateFilters', conjurationsFilterQuery)"
        >
          <BoltIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Apply Filters</span>
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
