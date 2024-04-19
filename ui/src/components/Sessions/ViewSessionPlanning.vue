<script lang="ts" setup>
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import WysiwygEditor from '@/components/Core/WysiwygEditor.vue';
import { cloneDeep, isEqual } from 'lodash';

const route = useRoute();
const currentUserRole = useCurrentUserRole();
const channel = useWebsocketChannel();

const session = ref<SessionBase>();

onMounted(async () => {
  await init();

  channel.bind(ServerEvent.SessionUpdated, async function () {
    const response = await getSession(
      parseInt(route.params.sessionId.toString()),
    );
    session.value = {
      ...session.value,
      name: response.data.name,
      imageUri: response.data.imageUri,
    } as SessionBase;
  });
});

onUnmounted(() => {
  channel.unbind(ServerEvent.SessionUpdated);
});

async function init() {
  await loadSession();
}

async function loadSession() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  session.value = response.data as SessionBase;

  if (session.value.planningJson) {
    origPlanning = cloneDeep(session.value.planningJson);
    readOnly.value = true;
  }
}

async function clickSaveSession() {
  if (session.value) {
    const putSessionResponse = await patchSession(session.value);

    if (putSessionResponse.status === 200) {
      showSuccess({ message: 'Session saved' });
      unsavedChanges.value = false;
    } else {
      showError({ message: 'Failed to save session' });
    }
  }
}

let origPlanning: any; // used to check for unsaved changes
const readOnly = ref(false);
const unsavedChanges = ref(false);

const toggleReadOnly = () => {
  readOnly.value = !readOnly.value;
};
const planningChanged = (planning: any) => {
  // eslint-disable-next-line
  const { time: originalTime, ...original } = origPlanning;
  // eslint-disable-next-line
  const { time: updatedTime, ...updated } = planning;

  unsavedChanges.value = !isEqual(original, updated);
};
</script>

<template>
  <div v-if="session">
    <div class="flex flex-wrap md:flex-nowrap justify-between mb-2">
      <div class="text-lg font-bold text-neutral-200 self-center">
        Session Planning
        <span v-if="unsavedChanges" class="text-xs text-neutral-500">
          Unsaved Changes
        </span>
      </div>
      <div
        v-if="currentUserRole === CampaignRole.DM"
        class="flex gap-2 grow justify-end"
      >
        <div>
          <button
            v-if="!readOnly || unsavedChanges"
            class="button-gradient self-center"
            @click="clickSaveSession"
          >
            Save Changes
          </button>
        </div>
        <div>
          <button class="button-ghost self-center" @click="toggleReadOnly">
            {{ readOnly ? 'Edit Mode' : 'Read Mode' }}
          </button>
        </div>
      </div>
    </div>
    <WysiwygEditor
      :key="'' + readOnly"
      v-model="session.planningJson"
      :read-only="readOnly"
      :class="{
        'cursor-pointer': readOnly && currentUserRole === CampaignRole.DM,
      }"
      @update:model-value="planningChanged"
      @click="
        readOnly && currentUserRole === CampaignRole.DM
          ? (readOnly = false)
          : null
      "
    />
  </div>
</template>
