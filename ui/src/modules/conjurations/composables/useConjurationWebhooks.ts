import { onUnmounted } from 'vue';
import { useWebsocketChannel } from '@/lib/hooks';
import { useConjurationStore } from '@/modules/conjurations/store/conjuration.store';
import { useImageStore } from '@/modules/images/store/image.store';
import { ServerEvent } from '@/lib/serverEvents';

export function useConjurationWebhooks() {
  const channel = useWebsocketChannel();
  const conjurationStore = useConjurationStore();
  const imageStore = useImageStore();

  channel.bind(ServerEvent.ImageEdited, onImageEdited);
  channel.bind(ServerEvent.PrimaryImageSet, onPrimaryImageSet);

  onUnmounted(() => {
    channel.unbind('image-edited', onImageEdited);
  });

  async function onImageEdited(data: any) {
    await conjurationStore.updateConjurationImages(data.image);
    await imageStore.updateImages(data.image);
  }

  async function onPrimaryImageSet(data: any) {
    if (data.images.length) {
      await conjurationStore.updateConjurationImages(data.images[0]);
      await imageStore.updateImages(data.images[0]);
    }
  }
}
