<script lang="ts" setup>
import { SessionBase } from '@/api/sessions.ts';

defineProps<{
  session: SessionBase;
}>();
</script>

<template>
  <div
    class="w-[150px] md:w-[400px] transition-all ease-in-out hover:scale-[105%]"
  >
    <div class="bg-neutral-900 rounded-[10px]">
      <div
        class="relative rounded-tl-[10px] rounded-tr-[10px] bg-neutral-600 flex justify-center"
      >
        <div class="absolute top-2 right-2">
          <div
            v-if="session.status === 1"
            class="bg-fuchsia-500 rounded-xl py-1 px-3 text-sm"
          >
            upcoming
          </div>
          <div
            v-if="session.status === 2"
            class="bg-green-500 rounded-xl py-1 px-3 text-sm"
          >
            completed
          </div>
        </div>
        <img
          :src="session.imageUri || '/images/session_bg_square.png'"
          class="md:w-[400px] md:h-[400px] object-cover rounded-t-[10px]"
        />
      </div>
    </div>
  </div>
</template>
