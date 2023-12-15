<template>
  <div
    v-if="show"
    class="absolute left-0 top-0 w-full h-full z-40"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
    @click="emit('close')"
  >
    <div
      class="fixed inset-0 bg-black bg-opacity-5 backdrop-blur-[3px] transition-opacity"
      :class="{ 'bg-opacity-5': !extraDark, 'bg-opacity-90': extraDark }"
      @click="emit('close')"
    ></div>

    <div class="fixed inset-0 z-10 overflow-y-auto" @click="emit('close')">
      <div
        class="flex min-h-full flex-col items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative mb-4 transform overflow-visible rounded-lg text-left shadow-xl transition-all"
          @click="$event.stopPropagation()"
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  show: boolean;
  extraDark?: boolean;
}>();

const emit = defineEmits(['close']);
</script>
