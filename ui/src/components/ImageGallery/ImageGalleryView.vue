<template>
  <div class="container mx-auto px-4">
    <h1 class="text-2xl font-bold mb-4">My Image Gallery</h1>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div v-for="image in images" :key="image.id" class="relative group aspect-square">
        <img
          :src="image.uri"
          :alt="image.prompt"
          class="w-full h-full object-cover rounded-lg"
        />
        <div
          class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
        >
          <button
            @click="openImageDetails(image)"
            class="bg-white text-black px-4 py-2 rounded-lg"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
    <div v-if="loading" class="text-center mt-4">
      <Loader />
    </div>
    <div v-if="hasMore" class="text-center mt-4">
      <button @click="loadMore" class="button-primary">Load More</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserImageGallery } from '@/api/images';
import Loader from '@/components/Core/Loader.vue';

const images = ref([]);
const loading = ref(false);
const offset = ref(0);
const limit = ref(50);
const hasMore = ref(true);

const loadImages = async () => {
  loading.value = true;
  try {
    const response = await getUserImageGallery(offset.value, limit.value);
    images.value.push(...response.data.images);
    hasMore.value = images.value.length < response.data.total;
    offset.value += limit.value;
  } catch (error) {
    console.error('Error loading images:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  loadImages();
};

const openImageDetails = (image) => {
  // Implement image details modal or navigation
  console.log('Open image details:', image);
};

onMounted(() => {
  loadImages();
});
</script>