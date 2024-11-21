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
    setSelectedImage(image: Image) {
      this.selectedImage = image;
    },
    setShowEditImageModal(show: boolean) {
      this.showEditImageModal = show;
    },
  },
});
