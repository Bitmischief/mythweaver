<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEventBus } from '@/lib/events.ts';
import { TransitionRoot } from '@headlessui/vue';

const eventBus = useEventBus();
const showMenu = ref(false);
const uri = ref('');

onMounted(() => {
  eventBus.$on('open-lightbox', (imageUri: string) => {
    toggleMenu();
    uri.value = imageUri;
  });
});

function toggleMenu() {
  showMenu.value = !showMenu.value;

  if (showMenu.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
}
</script>

<template>
  <div
    v-if="showMenu"
    class="fixed inset-0 z-50 flex h-screen w-full overflow-y-auto overscroll-none bg-surface/90 transition-opacity"
    @click="toggleMenu"
  >
    <TransitionRoot
      appear
      :show="showMenu"
      as="div"
      class="flex w-full px-4"
      enter="transform transition duration-[300ms]"
      enter-from="scale-0"
      enter-to="scale-100"
    >
      <img :src="uri" class="mx-auto my-auto max-h-[80vh] rounded-xl" alt="" />
    </TransitionRoot>
  </div>
</template>
