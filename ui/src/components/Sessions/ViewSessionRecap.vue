<script lang="ts" setup>
import {
  getSession,
  postGenerateSummary,
  SessionBase,
} from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole, useUnsavedChangesWarning } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';

const route = useRoute();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const originalSession = ref<SessionBase>({} as SessionBase);
const session = ref<SessionBase>({} as SessionBase);
useUnsavedChangesWarning(originalSession, session);

onMounted(async () => {
  await init();
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  originalSession.value = response.data as SessionBase;
  session.value = { ...originalSession.value };
}

async function generateSummary() {
  if (!session.value.recap) {
    showError({ message: 'You must provide a recap first!' });
    return;
  }

  try {
    await postGenerateSummary(session.value.id, {
      recap: session.value.recap || '',
    });
    originalSession.value = { ...session.value };

    eventBus.$emit('session-processing', {
      recap: session.value.recap || '',
    });

    showSuccess({
      message:
        'Generating summary. This session will update soon with an image, summary and suggestions.',
    });
  } catch (e) {
    showError({ message: 'Failed to complete session. Try again soon!' });
  }
}
</script>

<template>
  <FormKit
    v-model="session.recap"
    auto-height
    :disabled="currentUserRole !== CampaignRole.DM"
    label="Game Master's Recap"
    type="textarea"
  />

  <button
    v-if="!session.summary && currentUserRole === CampaignRole.DM"
    class="rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-1 h-12 transition-all hover:scale-110"
    @click="generateSummary"
  >
    Generate Summary
  </button>
</template>
