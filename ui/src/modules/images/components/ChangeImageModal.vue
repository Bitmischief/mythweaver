<script setup lang="ts">
import ViewImage from './ViewImage.vue';
import FullScreenModal from '@/components/FullScreenModal.vue';
import { useChangeImage } from '../composables/useChangeImage';
import { useImages } from '../composables/useImages';
import { ref, watch } from 'vue';
import { Image } from '../types/image';
import { useImageHistory } from '../composables/useImageHistory';
import { useGenerateImages } from '../composables/useGenerateImages';

const { showModal, currentImageId } = useChangeImage();
const { imageHistory, loading: loadingImageHistory } = useImageHistory();
const { getImage } = useImages();
const { showModal: showGenerateImageModal } = useGenerateImages();

const currentImage = ref<Image | undefined>(undefined);

watch(currentImageId, async () => {
  if (!currentImageId.value) {
    return;
  }

  currentImage.value = await getImage(currentImageId.value);
});

function generateNewImage() {
  console.log('generateNewImage');
  showGenerateImageModal.value = true;
}
</script>

<template>
  <FullScreenModal
    :show="showModal"
    :z="25"
    extra-dark
    @close="showModal = false"
  >
    <div class="p-4 flex justify-between gap-4">
      <!-- Current Image ID: {{ currentImageId }} Linking Context:
      {{ linkingContext }} -->

      <div class="flex gap-4">
        <div v-if="currentImage">
          <div class="flex justify-center mb-2 text-xl text-neutral-300">
            Current Image
          </div>

          <ViewImage
            :image="currentImage"
            allow-edits
            class="max-w-[500px]"
            disable-set-as-primary
          />
        </div>

        <div>
          <div class="flex justify-center mb-2 text-xl text-neutral-300">
            Previously Generated Images
          </div>

          <div v-if="loadingImageHistory">Loading...</div>
          <div v-else class="flex flex-wrap gap-2">
            <div v-for="image in imageHistory" :key="image.id">
              <ViewImage
                :image="image"
                allow-edits
                allow-selection
                class="max-w-[250px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="">
        <button @click="generateNewImage">Generate New Image</button>
      </div>
    </div>
  </FullScreenModal>
</template>
