import { onUnmounted } from 'vue';
import { useWebsocketChannel } from '@/lib/hooks';
import { useConjurationStore } from '@/modules/conjurations/store/conjuration.store';
import { useImageStore } from '@/modules/images/store/image.store';
import { ServerEvent } from '@/lib/serverEvents';
import { showError } from '@/lib/notifications';

export function useConjurationWebhooks() {
  const channel = useWebsocketChannel();
  const conjurationStore = useConjurationStore();
  const imageStore = useImageStore();

  channel.bind(ServerEvent.ImageEdited, onImageEdited);
  channel.bind(ServerEvent.PrimaryImageSet, onPrimaryImageSet);
  channel.bind(ServerEvent.ImageEraseError, handleEraseError);
  channel.bind(ServerEvent.ImageInpaintError, handleInpaintError);
  channel.bind(ServerEvent.ImageOutpaintError, handleOutpaintError);

  onUnmounted(() => {
    channel.unbind(ServerEvent.ImageEdited, onImageEdited);
    channel.unbind(ServerEvent.PrimaryImageSet, onPrimaryImageSet);
    channel.unbind(ServerEvent.ImageEraseError, handleEraseError);
    channel.unbind(ServerEvent.ImageInpaintError, handleInpaintError);
    channel.unbind(ServerEvent.ImageOutpaintError, handleOutpaintError);
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

  function handleEraseError() {
    showError({
      message:
        'Encountered an error smart erasing image. Please contact support if this issue persists.',
    });
  }

  function handleInpaintError() {
    showError({
      message:
        'Encountered an error modifying image. Please contact support if this issue persists.',
    });
  }

  function handleOutpaintError() {
    showError({
      message:
        'Encountered an error extending image. Please contact support if this issue persists.',
    });
  }
}
