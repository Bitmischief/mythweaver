<script lang="ts" setup>
import {
  getSession,
  patchSession,
  postGenerateSummary,
  SessionBase,
} from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { pusher, ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import RegeneratableTextEdit from '@/components/Core/Forms/RegeneratableTextEdit.vue';

const route = useRoute();
const userId = useCurrentUserId();
const eventBus = useEventBus();

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

async function generateSummary() {
  if (!session.value.recap) {
    showError({ message: 'You must provide a recap first!' });
    return;
  }

  try {
    await postGenerateSummary(session.value.id, {
      recap: session.value.recap || '',
    });

    eventBus.$emit('session-updated', {
      summary: session.value.summary,
      suggestedSummary: session.value.suggestedSummary,
    });

    showSuccess({
      message:
        'Generating summary. This session will update soon with an image, summary and suggestions.',
    });
  } catch (e) {
    showError({ message: 'Failed to complete session. Try again soon!' });
  }
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
  <FormKit
    v-model="session.recap"
    auto-height
    label="Game Master's Recap"
    type="textarea"
  />

  <template v-if="!session.summary">
    <button
      class="rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-1 h-12 transition-all hover:scale-110"
      @click="generateSummary"
    >
      Generate Summary
    </button>
  </template>
  <template v-if="session.summary || session.suggestedSummary">
    <RegeneratableTextEdit
      v-model="session.summary"
      auto-height
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
      context="session"
      :background="session"
      label="Suggestions"
      help="This is a generated set of suggestions to improve your roleplaying based on your provided recap."
      type="textarea"
      @updated-suggestion="session.suggestedSuggestions = $event"
    />
  </template>

  <div class="flex justify-end">
    <button
      class="rounded-md bg-green-500 text-lg py-1 px-3"
      @click="clickSaveSession"
    >
      Save Changes
    </button>
  </div>
</template>
