<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getConjuration } from '@/modules/conjurations/api';
import { Conjuration } from '@/modules/conjurations/types';
import ConjurationPrimaryImage from '@/modules/conjurations/components/core/conjurationPrimaryImage.vue';
import { useConjurationUtils } from '@/modules/conjurations/composables/useConjurationUtils';
import { ArrowRight } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

const props = defineProps<{
  conjurationId: number;
}>();

const route = useRoute();
const conjuration = ref<Conjuration | null>(null);
const getConjurationDescription = ref();

onMounted(async () => {
  const response = await getConjuration(props.conjurationId);
  conjuration.value = response.data;

  if (conjuration.value) {
    const { getConjurationDescription: getDesc } = useConjurationUtils(
      conjuration.value,
    );
    getConjurationDescription.value = getDesc;
  }
});
</script>

<template>
  <div
    v-if="conjuration"
    class="flex flex-col bg-surface-2 relative rounded-[20px] max-h-[250px] overflow-y-hidden border border-fuchsia-500 p-3"
  >
    <div
      class="relative h-full text-sm text-neutral-400 overflow-hidden shrink overflow-y-auto"
    >
      <div class="preview-image w-[40%]">
        <ConjurationPrimaryImage :conjuration="conjuration" />
      </div>
      <div class="text-lg text-white mb-1">
        {{ conjuration.name }}
      </div>
      {{ getConjurationDescription() }}
    </div>
    <div class="pt-2 bg-surface-2">
      <router-link
        :to="`/conjurations/view/${conjuration.id}?from=${route.path}`"
        class="w-full button-primary hover:bg-fuchsia-500/25 flex items-center justify-center"
      >
        <div>View Conjuration</div>
        <ArrowRight class="w-4 h-4" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.preview-image img {
  border-radius: 12px;
  margin-right: 10px;
  aspect-ratio: 1/1;
  text-align: center;
  float: left;
  object-fit: cover;
  shape-outside: square();
}
</style>
