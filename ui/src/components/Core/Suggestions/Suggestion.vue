<script setup lang="ts">
defineProps<{
  suggestion: string;
  textClass?: string;
}>();

defineEmits(['accept', 'reject']);
</script>

<template>
  <div
    class="hover:bg-neutral-900 w-fit rounded-md py-1 px-3 transition-all duration-300 cursor-pointer group"
  >
    <div class="flex">
      <div
        class="rounded-full w-2 h-2 bg-blue-500 self-center animate-pulse mr-2"
      ></div>
      <div class="text-neutral-400 w-[calc(100%-1rem)]" :class="textClass">
        {{ suggestion }}
      </div>
    </div>

    <div
      class="group-hover:scale-y-100 scale-y-0 transition-all duration-500 ease-in-out"
    >
      <div class="text-xs my-2 text-neutral-400">
        This is an AI generated suggestion. You can accept the change, or reject
        it and no changes will be made.
      </div>
      <button
        class="rounded-md bg-green-500 px-3 mr-2 text-sm transition-all hover:scale-110"
        @click="$emit('accept')"
      >
        Accept
      </button>
      <button
        class="rounded-md bg-red-500 px-3 text-sm transition-all hover:scale-110"
        @click="$emit('reject')"
      >
        Reject
      </button>
    </div>
  </div>
</template>
