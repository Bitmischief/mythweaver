<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

const showNotification = ref(false);
const typeRef = ref("");
const timeoutRef = ref(0);
const messageRef = ref("");

onMounted(() => {
  eventBus.$on("showNotification", (options: any) => {
    const { type = "success", timeout = 5000, message } = options || {};

    typeRef.value = type;
    timeoutRef.value = timeout;
    messageRef.value = message;

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
    showNotification
  );
}
</script>

<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 z-10 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
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
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
          :class="{
            'bg-green-500': typeRef === 'success',
            'bg-red-500': typeRef === 'error',
          }"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="h-full shrink-0 self-center">
                <svg
                  v-if="typeRef === 'success'"
                  class="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <svg
                  v-else
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
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                {{ messageRef }}
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
