<script setup lang="ts">
import { ref } from "vue";
import { Conjuration } from "@/api/conjurations.ts";

defineProps<{
  conjuration: Conjuration;
}>();

const viewImage = ref(false);
</script>

<template>
  <div
    v-if="viewImage"
    class="relative z-10"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    ></div>
    <div
      class="fixed inset-0 z-10 cursor-pointer overflow-y-auto"
      @click="viewImage = false"
    >
      <div
        class="flex min-h-full flex-col items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative mb-4 transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all"
        >
          <img
            :src="conjuration.imageUri"
            class="max-h-[80vh] max-w-[80vw]"
            :alt="conjuration.name"
          />
        </div>
        Click anywhere to close
      </div>
    </div>
  </div>

  <div class="md:flex">
    <div class="mb-3 mr-3 md:mb-0">
      <img
        :src="conjuration.imageUri"
        class="h-[10rem] w-auto cursor-pointer rounded-full hover:opacity-60"
        :alt="conjuration.name"
        @click="viewImage = true"
      />
    </div>
    <div class="self-center">
      <div class="text-5xl">
        {{ conjuration.name }}
      </div>

      <div class="mt-3 flex flex-wrap">
        <div
          v-for="tag of conjuration.tags"
          :key="`${conjuration.id}-${tag}`"
          class="mr-2 mt-1 rounded-xl bg-gray-700 px-3 py-1 text-lg"
        >
          {{ tag }}
        </div>
      </div>
    </div>
  </div>
</template>
