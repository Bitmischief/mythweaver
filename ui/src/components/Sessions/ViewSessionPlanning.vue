<script lang="ts" setup>
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole } from '@/lib/hooks.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import WysiwygEditor from '@/components/Core/WysiwygEditor.vue';
import { cloneDeep, isEqual } from 'lodash';
import { format } from 'date-fns';

const route = useRoute();
const currentUserRole = useCurrentUserRole();

const sessionName = ref();
const sessionDate = ref();

const session = ref<SessionBase>();

onMounted(async () => {
  await init();
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );

  session.value = response.data as SessionBase;
  sessionName.value = session.value.name;
  if (session.value.date) {
    sessionDate.value = format(session.value.date, "yyyy-MM-dd'T'HH:mm");
  }

  origPlanning = cloneDeep(session.value.planningJson);
  if (session.value.planningJson) {
    readOnly.value = true;
  }
}

async function clickSaveSession() {
  if (session.value) {
    const putSessionResponse = await patchSession({
      id: session.value.id,
      name: sessionName.value,
      date: sessionDate.value,
      planningJson: session.value.planningJson,
    });
    if (putSessionResponse.status === 200) {
      showSuccess({ message: 'Session saved' });
      session.value.name = sessionName.value;
      session.value.date = sessionDate.value;
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
  const { time: originalTime, ...original } = origPlanning ?? { time: null };
  // eslint-disable-next-line
  const { time: updatedTime, ...updated } = planning ?? { time: null };

  unsavedChanges.value = !isEqual(original, updated);
};
</script>

<template>
  <div v-if="session">
    <FormKit type="form" :actions="false" @submit="clickSaveSession">
      <div class="md:mt-6 flex flex-wrap md:flex-nowrap gap-4 mb-4">
        <div class="grow">
          <FormKit
            v-model="sessionName"
            type="text"
            label="Session Name"
            input-class="md:text-xl"
            validation="required"
          />
        </div>
        <div class="shrink">
          <FormKit
            v-model="sessionDate"
            type="datetime-local"
            label="Session Date"
            input-class="md:text-xl"
            validation-visibility="live"
          />
        </div>
        <div
          v-if="currentUserRole === CampaignRole.DM"
          class="shrink self-center"
        >
          <button type="submit" class="button-gradient self-center">
            Save
          </button>
        </div>
      </div>
    </FormKit>
    <div class="mt-4 pb-6 mb-6 border border-neutral-800 rounded-[20px] p-4">
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
  </div>
</template>
