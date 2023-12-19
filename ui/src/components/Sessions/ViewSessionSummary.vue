<script lang="ts" setup>
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import RegeneratableTextEdit from '@/components/Core/Forms/RegeneratableTextEdit.vue';
import { CampaignRole } from '@/api/campaigns.ts';

const route = useRoute();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const summary = ref('');
const summaryKey = ref(0);
const suggestedSummary = ref('');
const suggestions = ref('');
const suggestedSuggestions = ref('');
const session = ref<SessionBase>({} as SessionBase);

const sessionId = computed(() => parseInt(route.params.sessionId.toString()));

onMounted(async () => {
  await init();

  channel.bind(ServerEvent.SessionUpdated, async function () {
    await init();
  });
});

onUnmounted(() => {
  channel.unbind(ServerEvent.SessionUpdated);
});

async function init() {
  const response = await getSession(sessionId.value);

  summary.value = response.data.summary;
  suggestedSummary.value = response.data.suggestedSummary;
  suggestions.value = response.data.suggestions;
  suggestedSuggestions.value = response.data.suggestedSuggestions;

  session.value = response.data as SessionBase;
  forceSummaryRerender();
}

function forceSummaryRerender() {
  summaryKey.value += 1;
}

async function clickSaveSession() {
  const putSessionResponse = await patchSession({
    id: sessionId.value,
    summary: summary.value,
    suggestedSummary: suggestedSummary.value,
    suggestions: suggestions.value,
    suggestedSuggestions: suggestedSuggestions.value,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session saved' });
    eventBus.$emit('session-summary-panel-updated', {
      summary: summary.value,
      suggestions: suggestions.value,
    });
  } else {
    showError({ message: 'Failed to save session' });
  }
}
</script>

<template>
  <div v-if="!summary" class="text-center text-neutral-300 text-xl">
    No summary yet. Provide a
    <router-link to="recap" class="underline text-fuchsia-200"
      >recap</router-link
    >
    and click "Generate Summary" to get started.
  </div>

  <template v-if="summary || suggestedSummary">
    <RegeneratableTextEdit
      :key="summaryKey"
      v-model="summary"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      :suggestion="suggestedSummary"
      context="session"
      :background="session"
      label="Summary"
      help="This is a generated summary of your session, based on your provided recap."
      type="textarea"
      @clear-suggestion="suggestedSummary = ''"
    />

    <RegeneratableTextEdit
      v-model="suggestions"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      :suggestion="suggestedSuggestions"
      context="session"
      :background="session"
      label="Suggestions"
      help="This is a generated set of suggestions to improve your roleplaying based on your provided recap."
      type="textarea"
      @clear-suggestion="suggestedSuggestions = ''"
    />
  </template>

  <div
    v-if="summary && currentUserRole === CampaignRole.DM"
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
