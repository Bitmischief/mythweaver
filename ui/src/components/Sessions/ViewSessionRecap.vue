<script lang="ts" setup>
import {
  getSession,
  getSessionTranscript,
  patchSession,
  postRecapTranscription,
  SessionBase,
  SessionTranscript,
} from '@/api/sessions.ts';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole, useUnsavedChangesWarning } from '@/lib/hooks.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { BarsArrowUpIcon } from '@heroicons/vue/24/solid';
import { isEqual } from 'lodash';

const props = defineProps<{
  proceedPastRecap: boolean;
}>();

const route = useRoute();
const currentUserRole = useCurrentUserRole();

const originalSession = ref<SessionBase>({} as SessionBase);
const session = ref<SessionBase>({} as SessionBase);
const transcript = ref<SessionTranscript>({} as SessionTranscript);
const processing = ref(false);

useUnsavedChangesWarning(originalSession, session);

onMounted(async () => {
  await init();
});

watch(
  () => props.proceedPastRecap,
  async (newVal) => {
    if (newVal) {
      await saveRecap();
    }
  },
);

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  originalSession.value = response.data as SessionBase;

  session.value = { ...originalSession.value };
  processing.value = session.value.processing;

  const transcriptResponse = await getSessionTranscript(
    parseInt(route.params.sessionId.toString()),
  );

  transcript.value = transcriptResponse.data as SessionTranscript;
}

const recapLoading = ref(false);

async function generateRecap() {
  if (!transcript.value) {
    showError({
      message: 'A session transcription is required to use this feature.',
    });
    return;
  }

  try {
    recapLoading.value = true;
    const response = await postRecapTranscription(session.value.id);
    session.value.suggestedRecap = response.data.recap;
  } catch (e) {
    showError({ message: 'Failed to generate a recap. Please try again.' });
  } finally {
    recapLoading.value = false;
  }
}

function copySuggestedRecap() {
  session.value.recap = session.value.suggestedRecap;
  session.value.suggestedRecap = '';
}

const unsavedChanges = ref(false);

watch(
  () => session.value.recap,
  (oldVal, newVal) => {
    if (newVal !== undefined && !isEqual(oldVal, newVal)) {
      unsavedChanges.value = true;
    }
  },
);

async function saveRecap() {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    campaignId: session.value.campaignId,
    recap: session.value.recap,
    suggestedRecap: session.value.suggestedRecap,
  });

  if (putSessionResponse.status === 200) {
    unsavedChanges.value = false;
    showSuccess({ message: `Session recap saved!` });
  } else {
    showError({ message: 'Failed to save session recap' });
  }
}
</script>

<template>
  <FormKit
    type="form"
    :actions="false"
    :config="{ validationVisibility: 'submit' }"
    @submit="saveRecap"
  >
    <FormKit
      v-model="session.recap"
      auto-height
      :disabled="currentUserRole !== CampaignRole.DM"
      label="Session Recap"
      validation="(500)length:0,15000"
      type="textarea"
    />
    <div
      v-if="session.suggestedRecap"
      class="mb-4 border border-neutral-800 rounded-[12px] p-2"
    >
      <div class="flex gap-2 align-center text-sm text-neutral-200 mb-2">
        <div class="self-center text-neutral-400 font-bold">
          Suggested Recap
        </div>
        <div
          class="border border-fuchsia-500 rounded-full text-xs flex py-1 px-2 self-center"
        >
          <img src="@/assets/icons/wand.svg" alt="wand" class="h-4 py-1 mr-1" />
          AI Generated
        </div>
        <div class="relative group">
          <BarsArrowUpIcon
            class="w-6 h-6 cursor-pointer"
            @click.stop="copySuggestedRecap"
          />
          <div
            class="group-hover:visible invisible absolute right-1/2 translate-x-1/2 border border-neutral-500 bg-surface-3 whitespace-nowrap py-2 px-4 rounded-[12px]"
          >
            Use suggested recap
          </div>
        </div>
      </div>
      <div class="text-sm text-neutral-400 whitespace-pre-wrap">
        {{ session.suggestedRecap }}
      </div>
    </div>

    <div class="flex gap-4">
      <div>
        <FormKit
          v-if="currentUserRole === CampaignRole.DM && !session.archived"
          type="submit"
          label="Save"
          input-class="$reset button-gradient"
          :disabled="processing || !unsavedChanges"
        />
      </div>
      <div class="relative group/recap">
        <FormKit
          v-if="currentUserRole === CampaignRole.DM && !session.archived"
          type="button"
          :label="
            recapLoading
              ? 'Loading recap...'
              : `${session.suggestedRecap ? 'Re-g' : 'G'}enerate suggested recap`
          "
          :input-class="`$reset button-ghost ${recapLoading ? 'animate-pulse' : ''}`"
          outer-class="mb-0"
          :disabled="processing || !transcript.sentences?.length"
          :title="
            !transcript.sentences?.length
              ? 'A session transcript is required to use this feature.'
              : ''
          "
          @click="generateRecap"
        />
        <div v-if="!transcript" class="tooltip-top group-hover/recap:block">
          A session transcript is required to use this feature.
          <div class="tooltip-arrow" />
        </div>
      </div>
    </div>
  </FormKit>
</template>
