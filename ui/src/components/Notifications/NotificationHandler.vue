<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEventBus } from '@/lib/events.ts';
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/20/solid';
import { useRouter } from 'vue-router';

const eventBus = useEventBus();
const router = useRouter();

const showNotification = ref(false);
const typeRef = ref('');
const timeoutRef = ref(0);
const messageRef = ref('');
const contextRef = ref();
const routeRef = ref();

onMounted(() => {
  eventBus.$on('showNotification', (options: any) => {
    const {
      type = 'success',
      timeout = 5000,
      message,
      context,
      route,
    } = options || {};

    typeRef.value = type;
    timeoutRef.value = timeout;
    messageRef.value = message;
    contextRef.value = context;
    routeRef.value = route;

    showNotification.value = true;

    initTimeout();
  });
});

function initTimeout() {
  setTimeout(
    (test) => {
      test.value = false;
    },
    timeoutRef.value,
    showNotification,
  );
}

function clickNotification() {
  if (routeRef.value) {
    router.push(routeRef.value);
  }
}
</script>

<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showNotification"
          class="pointer-events-auto bg-surface-3/95 w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
          :class="{ 'cursor-pointer hover:bg-surface-3/100': !!routeRef }"
          @click="clickNotification"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="self-center">
                <CheckCircleIcon
                  v-if="typeRef === 'success'"
                  class="w-6 text-green-500 green-glow"
                />
                <InformationCircleIcon
                  v-else-if="typeRef === 'error'"
                  class="w-6 text-red-500 red-glow"
                />
                <InformationCircleIcon
                  v-else
                  class="w-6 text-blue-500 blue-glow"
                />
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <div class="text-sm">{{ messageRef }}</div>
                <div v-if="contextRef" class="text-xs text-neutral-500">
                  {{ contextRef }}
                </div>
              </div>
              <div class="ml-4 flex shrink-0 self-center">
                <button
                  type="button"
                  class="inline-flex self-center rounded-md text-white hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  @click="showNotification = false"
                >
                  <span class="sr-only">Close</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
