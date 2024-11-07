<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserImageGallery } from '@/api/images';
import Loader from '@/components/Core/Loader.vue';
import LightboxImage from '@/components/LightboxImage.vue';
import { Image } from '@/api/images';

const images = ref<Image[]>([]);
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

onMounted(() => {
  loadImages();
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex md:justify-start grow mb-8">
      <h1 class="text-3xl font-bold">
        <span class="gradient-text">My Images</span>
      </h1>
    </div>
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
    >
      <div v-for="image in images" :key="image.id" class="relative group">
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <LightboxImage :src="image.uri" :alt="image.prompt">
            <div class="space-y-4">
              <div>
                <h3 class="font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Model:
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ image.imageModel.description }}
                </p>
              </div>
              <div>
                <h3 class="font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Created At:
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ new Date(image.createdAt).toLocaleString() }}
                </p>
              </div>
              <div>
                <h3 class="font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Prompt:
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ image.prompt }}
                </p>
              </div>
            </div>
          </LightboxImage>
        </div>
        <div class="mt-2 text-sm text-gray-600 truncate">
          {{ image.imageModel.description }}
        </div>
      </div>
    </div>
    <div v-if="loading" class="text-center mt-8">
      <Loader />
    </div>
    <div v-if="hasMore" class="text-center mt-8">
      <button class="button-primary px-6 py-2 rounded-full" @click="loadMore">
        Load More
      </button>
    </div>
  </div>
</template>

<style scoped>
.gradient-text {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600;
}

.button-primary {
  @apply bg-gradient-to-r from-purple-400 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-200;
}
</style>
