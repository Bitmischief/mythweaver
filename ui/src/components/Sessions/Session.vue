<script lang="ts" setup>
import { SessionBase } from '@/api/sessions.ts';

defineProps<{
  session: SessionBase;
}>();
</script>

<template>
  <div class="transition-all ease-in-out hover:scale-[105%]">
    <div class="bg-neutral-900 rounded-[10px]">
      <div
        class="relative rounded-tl-[10px] rounded-tr-[10px] bg-neutral-600 flex justify-center"
      >
        <img
          :src="session.imageUri || '/images/session_bg_square.png'"
          class="object-cover rounded-t-[10px]"
        />
      </div>

      <div class="text-xl p-3 text-neutral-200 truncate">
        {{ session.name }}

        <div class="text-sm text-neutral-400 truncate">
          {{ session.summary || 'No summary provided' }}
        </div>
      </div>
    </div>
  </div>
</template>
