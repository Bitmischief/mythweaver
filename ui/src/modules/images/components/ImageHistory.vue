<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getConjurationImageHistory } from '@/api/images.ts';
import { useEditImage } from '@/modules/images/composables/useEditImage.ts';

const props = defineProps<{
  conjurationId: number;
}>();

const { setPrimaryImage } = useEditImage();
const imageHistory = ref<any[]>([]);

onMounted(async () => {
  await fetchImageHistory();
});

async function fetchImageHistory() {
  try {
    const imageHistoryResponse = await getConjurationImageHistory(
      props.conjurationId,
    );
    imageHistory.value = imageHistoryResponse.data;
  } catch {
    console.log('Unable to fetch image history');
  }
}
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <div
      v-for="(img, i) in imageHistory"
      :key="`img_history_${i}`"
      class="relative group/image mx-4 md:mx-0"
    >
      <img
        :src="img.uri"
        alt="image"
        class="rounded-[20px] group-hover/image:opacity-50"
      />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/image:block"
      >
        <button class="button-gradient" @click="setPrimaryImage(img.id)">
          Set as primary image
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
