<script lang="ts" setup>
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { pusher, ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserId, useCurrentUserRole } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import RegeneratableTextEdit from '@/components/Core/Forms/RegeneratableTextEdit.vue';
import { CampaignRole } from '@/api/campaigns.ts';

const route = useRoute();
const userId = useCurrentUserId();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const session = ref<SessionBase>({} as SessionBase);

onMounted(async () => {
  await init();

  if (!userId.value) {
    throw new Error('No userId to bind server events to!');
  }

  const channel = pusher.subscribe(userId.value.toString());
  channel.bind(ServerEvent.SessionUpdated, function (data: any) {
    session.value = data;
  });
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  session.value = response.data as SessionBase;
}

async function clickSaveSession() {
  const putSessionResponse = await patchSession({
    ...session.value,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session saved' });
    eventBus.$emit('session-summary-panel-updated', {
      summary: session.value.summary,
      recap: session.value.recap,
      suggestions: session.value.suggestions,
    });
  } else {
    showError({ message: 'Failed to save session' });
  }
}
</script>

<template>
  <div v-if="!session.summary" class="text-center text-neutral-300 text-xl">
    No summary yet. Provide a
    <router-link to="recap" class="underline text-fuchsia-200"
      >recap</router-link
    >
    and click "Generate Summary" to get started.
  </div>

  <template v-if="session.summary || session.suggestedSummary">
    <RegeneratableTextEdit
      v-model="session.summary"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      context="session"
      :background="session"
      label="Summary"
      help="This is a generated summary of your session, based on your provided recap."
      type="textarea"
      @updated-suggestion="session.suggestedSummary = $event"
    />

    <RegeneratableTextEdit
      v-model="session.suggestions"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      context="session"
      :background="session"
      label="Suggestions"
      help="This is a generated set of suggestions to improve your roleplaying based on your provided recap."
      type="textarea"
      @updated-suggestion="session.suggestedSuggestions = $event"
    />
  </template>

  <div
    v-if="session.summary && currentUserRole === CampaignRole.DM"
    class="flex justify-end"
  >
    <button
      class="rounded-md bg-green-500 text-lg py-1 px-3"
      @click="clickSaveSession"
    >
      Save Changes
    </button>
  </div>
</template>
