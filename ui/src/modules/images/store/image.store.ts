import { defineStore } from 'pinia';
import { Image } from '@/modules/images/types/image.ts';

interface ImageStoreState {
  showEditImageModal: boolean;
  selectedImage: Image | undefined;
}

export const useImageStore = defineStore({
  id: 'image',
  state: (): ImageStoreState => ({
    selectedImage: undefined,
    showEditImageModal: false,
  }),
  actions: {
    setShowEditImageModal(show: boolean) {
      this.showEditImageModal = show;
    },
    updateImages(image: Image) {
      if (this.selectedImage && this.selectedImage.id === image.id) {
        this.selectedImage = image;
      }
    },
  },
});
