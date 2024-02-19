<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { postMagicLinkGeneration } from '@/api/generators';
import { getConjurationRequest } from '@/api/conjurations';
import { useRoute, useRouter } from 'vue-router';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showError } from '@/lib/notifications.ts';
import Loader from '@/components/Core/Loader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { useEventBus } from '@/lib/events.ts';
import { useAuthStore } from '@/store';

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const authStore = useAuthStore();

const generating = ref(true);
const error = ref(false);
const errorMsg = ref('');

onMounted(async () => {
  eventBus.$on('user-loaded', async () => {
    const channel = useWebsocketChannel();
    channel.bind(ServerEvent.ConjurationCreated, function (data: any) {
      router.push(`/conjurations/view/${data.id}`);
    });

    channel.bind(ServerEvent.ConjurationError, function () {
      generating.value = false;
      errorMsg.value =
        'There was a server error creating your conjuration. Reach out to support for help resolving this issue.';
      showError({
        message: errorMsg.value,
      });
    });
  });

  if (authStore.tokens) {
    await authStore.loadCurrentUser();
  }

  generating.value = true;
  const token = route.query.t as string;
  const response = await postMagicLinkGeneration(token);

  if (response.status !== 200) {
    generating.value = false;
    errorMsg.value = response.data;
  }

  const conjuration = await getConjurationRequest(
    response.data.conjurationRequestId,
  );

  if (conjuration.data) {
    router.push(`/conjurations/view/${conjuration.data.id}`);
  }
});
</script>

<template>
  <ModalAlternate :show="true" class="flex justify-center h-full">
    <div v-if="generating" class="my-auto text-center">
      <Loader />
      <div class="text-lg mt-2">Conjuring...</div>
      <div class="text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
    <div v-else-if="error" class="my-auto">
      <span>
        {{ errorMsg }}
      </span>
    </div>
  </ModalAlternate>
</template>
