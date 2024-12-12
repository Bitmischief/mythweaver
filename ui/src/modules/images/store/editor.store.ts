import { defineStore } from 'pinia';
import { ImageEditorTool } from '@/modules/images/types/imageEditorTool';
import { deleteEdits, inpaintImage, smartErase, outpaint } from '@/modules/images/api/images';

interface ImageEditorStoreState {
  selectedTool: ImageEditorTool;
  editing: boolean;
  canvasMask: HTMLCanvasElement | null;
  brushSize: number;
  isEraseMode: boolean;
}

export const maskedTools = ['inpaint', 'erase'];

export const useImageEditorStore = defineStore({
  id: 'imageEditor',
  state: (): ImageEditorStoreState => ({
    selectedTool: 'inpaint',
    editing: false,
    canvasMask: null,
    brushSize: 25,
    isEraseMode: false,
  }),
  actions: {
    async inpaintImage(imageId: number, prompt: string) {
      if (!this.canvasMask || !prompt || !prompt.trim()) return;

      try {
        this.editing = true;
        const maskBlob = await new Promise<Blob | null>((resolve) => {
          this.canvasMask?.toBlob(resolve, 'image/png');
        });
        if (!maskBlob) {
          throw new Error('Failed to create mask blob');
        }
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

        const editedImage = await inpaintImage(imageId, maskFile, prompt);

        return editedImage;
      } finally {
        this.editing = false;
      }
    },
    async outpaintImage(
      imageId: number,
      prompt: string,
      dimensions: {
        up: number;
        down: number;
        left: number;
        right: number;
      },
    ) {
      if (!this.canvasMask || !prompt || !prompt.trim()) return;

      try {
        this.editing = true;
        const editedImage = await outpaint(imageId, prompt, dimensions);
        return editedImage;
      } finally {
        this.editing = false;
      }
    },
    async eraseImage(imageId: number) {
      if (!this.canvasMask) return;

      try {
        this.editing = true;
        const maskBlob = await new Promise<Blob | null>((resolve) => {
          this.canvasMask?.toBlob(resolve, 'image/png');
        });
        if (!maskBlob) {
          throw new Error('Failed to create mask blob');
        }
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

        const editedImage = await smartErase(imageId, maskFile);

        return editedImage;
      } finally {
        this.editing = false;
      }
    },
    deleteEdits(imageId: number) {
      return deleteEdits(imageId);
    },
    setEditMode(tool: ImageEditorTool) {
      this.selectedTool = tool;
      if (!maskedTools.includes(this.selectedTool)) {
        this.clearMask();
      }
    },
    clearMask() {
      this.canvasMask = null;
    },
  },
});
