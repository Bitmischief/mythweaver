<script lang="ts" setup>
import {
  getSession,
  postGenerateSummary,
  SessionBase,
} from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole, useUnsavedChangesWarning } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';

const route = useRoute();
const router = useRouter();
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

    if (session.value.summary) {
      showSuccess({
        message: 'Re-generating summary',
      });
    } else {
      showSuccess({
        message:
          'Generating summary. This session will update soon with an image, summary and suggestions.',
      });
    }

    await router.push(`/sessions/${route.params.sessionId}/summary`);
  } catch (e) {
    showError({ message: 'Failed to complete session. Try again soon!' });
  }
}
</script>

<template>
  <FormKit
    v-slot="{ disabled }"
    type="form"
    :actions="false"
    @submit="generateSummary"
  >
    <FormKit
      v-model="session.recap"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      label="Game Master's Recap"
      validation="length:25,15000"
      type="textarea"
    />

    <FormKit
      v-if="currentUserRole === CampaignRole.DM && !session.archived"
      type="submit"
      :disabled="disabled as boolean"
      :label="`${session.summary ? 'Re-g' : 'G'}enerate Summary`"
    />
  </FormKit>
</template>
