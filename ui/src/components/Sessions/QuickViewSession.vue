<script setup lang="ts">
import { SessionBase } from '@/api/sessions.ts';
import { useRouter } from 'vue-router';

defineEmits(['close']);
const router = useRouter();

const props = defineProps<{
  session: SessionBase;
}>();

async function gotoSession() {
  await router.push(`/sessions/${props.session.id}`);
}
</script>

<template>
  <div class="flex justify-end gap-4 mb-4">
    <button class="button-ghost" @click="gotoSession">View Full Session</button>
    <button class="button-primary" @click="$emit('close')">Close</button>
  </div>
  <div class="md:flex">
    <div class="basis-1/4 mb-4">
      <img
        :src="session.imageUri || '/images/session_bg_square.png'"
        alt="session image"
        class="max-w-[500px] w-full rounded-[12px]"
      />
      <div class="text-xl text-center">
        {{ session.name }}
      </div>
    </div>
    <div class="flex flex-wrap gap-4 grow basis-3/4">
      <div
        class="w-full md:mt-0 md:ml-4 px-4 py-2 pb-4 border border-neutral-800 rounded-[12px]"
      >
        <div class="text-neutral-400 mb-2">Summary</div>
        <div v-if="session.summary">
          {{ session.summary }}
        </div>
        <div v-else class="text-center my-4">No summary yet.</div>
      </div>
      <div
        class="w-full md:mt-0 md:ml-4 px-4 py-2 pb-4 border border-neutral-800 rounded-[12px]"
      >
        <div class="text-neutral-400 mb-2">Recap:</div>
        <div v-if="session.recap">
          {{ session.recap }}
        </div>
        <div v-else class="text-center my-4">No recap yet.</div>
      </div>
      <div
        class="w-full md:mt-0 md:ml-4 px-4 py-2 pb-4 border border-neutral-800 rounded-[12px]"
      >
        <div class="text-neutral-400 mb-2">Planning</div>
        <div v-if="session.planning">
          {{ session.planning }}
        </div>
        <div v-else class="text-center my-4">No planning yet.</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
