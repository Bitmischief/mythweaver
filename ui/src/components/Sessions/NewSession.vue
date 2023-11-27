<script setup lang="ts">
import { SessionBase, postSession } from '@/api/sessions.ts';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccess } from '@/lib/notifications.ts';

const router = useRouter();

const session = ref<SessionBase>({
  id: 0,
  campaignId: 0,
  planning: '',
  name: 'New Session',
} as SessionBase);

async function handleCreateSession() {
  const createSessionResponse = await postSession(session.value);

  showSuccess({ message: 'Session created!' });
  await router.push(`/sessions/${createSessionResponse.data.id}/edit`);
}
</script>

<template>
  <div class="">
    <div class="text-lg mb-6">Let's Create A Session</div>

    <FormKit
      v-slot="{ disabled }"
      type="form"
      :actions="false"
      @submit="handleCreateSession"
    >
      <FormKit v-model="session.name" label="Name" type="text" />

      <FormKit
        v-model="session.planning"
        label="Planning"
        auto-height
        type="textarea"
      />

      <FormKit
        type="submit"
        :disabled="disabled as boolean"
        label="Create Session"
      />
    </FormKit>
  </div>
</template>
