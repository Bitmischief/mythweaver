<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  getSession,
  patchSession,
  postGenerateSummary,
  postSessionSummaryEmail,
  SessionBase,
} from '@/api/sessions.ts';
import { useRoute } from 'vue-router';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { showError, showInfo, showSuccess } from '@/lib/notifications.ts';
import ViewSessionTranscription from '@/components/Sessions/ViewSessionTranscription.vue';
import { format } from 'date-fns';
import Spinner from '@/components/Core/Spinner.vue';
import { ArrowPathIcon } from '@heroicons/vue/24/solid';
import { EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/vue/24/outline';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { generateArbitraryProperty } from '@/lib/generation.ts';
import { SparklesIcon } from '@heroicons/vue/24/solid';

const route = useRoute();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const session = ref<SessionBase>({} as SessionBase);

const sessionId = computed(() => parseInt(route.params.sessionId.toString()));

const sessionSuggestedImagePrompt = ref('');

onMounted(async () => {
  await init();

  channel.bind(ServerEvent.SessionUpdated, sessionUpdatedHandler);
  channel.bind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
});

async function sessionUpdatedHandler() {
  await init();
}

async function primaryImageSetHandler() {
  await init();
}

onUnmounted(() => {
  channel.unbind(ServerEvent.SessionUpdated, sessionUpdatedHandler);
  channel.unbind(ServerEvent.SessionUpdated, primaryImageSetHandler);
  eventBus.$off('session-summary-panel-updated');
});

async function init() {
  const response = await getSession(sessionId.value);

  session.value = response.data as SessionBase;
  sessionSuggestedImagePrompt.value = session.value.suggestedImagePrompt || '';
}

async function saveSession(updated?: string) {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    campaignId: session.value.campaignId,
    suggestedImagePrompt: sessionSuggestedImagePrompt.value,
    summary: session.value.summary,
  });

  if (putSessionResponse.status === 200) {
    if (updated) {
      showSuccess({ message: `Session ${updated} saved!` });
    }
  } else {
    showError({ message: 'Failed to save session' });
  }
}

const sessionType = computed(() => {
  if (session.value.completed) {
    return 'Completed';
  } else if (session.value.archived) {
    return 'Archived';
  } else if (session.value.planning || session.value.recap) {
    return 'In Progress';
  } else {
    return 'Upcoming';
  }
});

const sessionDate = computed(() => {
  return session.value && session.value.date
    ? format(session.value.date, 'MMM dd, yyyy @ h:mm a')
    : 'TBD';
});

const summaryLoading = ref(false);
const generateSummary = async () => {
  if (!session.value.recap?.length) {
    showInfo({ message: 'You must add a recap before generating a summary' });
    return;
  }

  summaryLoading.value = true;
  try {
    const summaryResponse = await postGenerateSummary({
      recap: session.value.recap,
    });
    console.log(summaryResponse);
    session.value.summary = summaryResponse.data;
    await saveSession('summary');
  } catch {
    showError({ message: 'Failed to generate summary. Please try again.' });
  } finally {
    summaryLoading.value = false;
  }
};

const emailLoading = ref(false);
const emailSent = ref(false);
const emailSummary = async () => {
  emailLoading.value = true;
  try {
    await postSessionSummaryEmail(session.value.id);
    emailSent.value = true;
    showSuccess({ message: 'A summary has been emailed to your players!' });
    setTimeout(() => {
      emailSent.value = false;
    }, 2000);
  } catch {
    showError({ message: 'Failed to generate summary. Please try again.' });
  } finally {
    emailLoading.value = false;
  }
};

const loadingImageModal = ref(false);

async function showCustomizeImageModal() {
  loadingImageModal.value = true;
  if (!session.value.suggestedImagePrompt && session.value.recap) {
    sessionSuggestedImagePrompt.value = await generateArbitraryProperty({
      propertyName: 'aiImagePrompt',
      context: 'TTRPG session',
      background: session.value.recap,
    });
    await saveSession();
  }

  eventBus.$emit('toggle-customize-image-modal', {
    image: {
      prompt: sessionSuggestedImagePrompt.value,
    },
    linking: {
      sessionId: session.value.id,
    },
  });
  loadingImageModal.value = false;
}

const primaryImage = computed(() => {
  if (session.value.images?.length) {
    return session.value.images.find((i) => i.primary);
  }
  return undefined;
});
</script>

<template>
  <template v-if="session.completed">
    <div
      class="flex gap-4 mt-4 flex-wrap lg:flex-nowrap justify-center items-stretch"
    >
      <div v-if="!primaryImage">
        <div
          class="relative flex h-full align-middle border border-surface-3 rounded-[12px] p-4"
        >
          <button
            :disabled="loadingImageModal"
            class="whitespace-nowrap button-ghost hover:button-gradient hover:text-neutral-200 group/ssnbtn"
            @click="showCustomizeImageModal"
          >
            <span v-if="!loadingImageModal" class="flex">
              <SparklesIcon
                class="h-5 w-5 mr-2 rotate-180 group-hover/ssnbtn:rotate-0 transition-all"
              />
              <span>Add Session Image</span>
            </span>
            <span v-else class="flex">
              <Spinner class="w-5 h-5 mr-2" />
              <span>Generating suggested prompt...</span>
            </span>
          </button>
        </div>
      </div>
      <div v-else>
        <CustomizableImage
          :editable="currentUserRole === CampaignRole.DM"
          :image="primaryImage"
          class="rounded-md w-full md:w-[25em]"
          :type="sessionType"
          :linking="{ sessionId: session.id }"
        />
      </div>
      <div class="grow">
        <div class="bg-surface-2 h-full rounded-[8px] p-4">
          <div class="flex align-center justify-between text-xl mb-2">
            <div class="self-center">Summary</div>
            <div v-if="session.summary" class="flex gap-2">
              <button
                class="button-ghost text-sm py-1 flex"
                :disabled="emailLoading || summaryLoading"
                @click="emailSummary"
              >
                <span v-if="emailLoading" class="flex">Emailing Summary</span>
                <span v-else-if="emailSent">Email Sent!</span>
                <span v-else>Email Summary To Players</span>
                <span class="relative">
                  <EnvelopeIcon
                    class="h-5 w-5 ml-2 transition-all"
                    :class="{
                      'rotate-0 opacity-1': !emailLoading && !emailSent,
                      'rotate-180 opacity-0': emailLoading || emailSent,
                    }"
                  />
                  <Spinner
                    class="absolute top-0 ml-2 transition-all"
                    :class="{
                      'opacity-0': !emailLoading,
                      'opacity-1': emailLoading,
                    }"
                  />
                  <EnvelopeOpenIcon
                    class="absolute top-0 h-5 w-5 ml-2 transition-all"
                    :class="{
                      'rotate-0 opacity-1': !emailLoading && emailSent,
                      'rotate-180 opacity-0': emailLoading || !emailSent,
                    }"
                  />
                </span>
              </button>
              <button
                :disabled="summaryLoading"
                class="button-ghost py-1"
                @click="generateSummary"
              >
                <ArrowPathIcon
                  class="h-5 w-5"
                  :class="{ 'animate-spin': summaryLoading }"
                />
              </button>
            </div>
          </div>
          <div
            v-if="session.summary"
            class="text-neutral-300 max-h-[16em] overflow-y-auto bg-surface-2 pr-2"
          >
            {{ session.summary }}
          </div>
          <div
            v-else-if="currentUserRole !== CampaignRole.DM"
            class="text-sm text-neutral-500 text-center max-w-[20em] h-[12em] pt-[5em] mx-auto"
          >
            No summary has been created
          </div>
          <div
            v-else
            class="h-[12em] flex flex-col justify-center text-neutral-200"
          >
            <div class="flex justify-center">
              <div class="text-center">
                <div v-if="!summaryLoading" class="mb-2">
                  No summary has been generated yet.
                </div>
                <button
                  class="button-gradient"
                  :disabled="summaryLoading"
                  @click="generateSummary"
                >
                  <span v-if="summaryLoading" class="flex"
                    >Generating Summary<Spinner class="ml-1"
                  /></span>
                  <span v-else>Generate Summary From Recap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bg-surface-2 h-full rounded-[8px] p-4 mt-4">
      <div class="flex align-center text-xl mb-2">
        <div>Recap</div>
      </div>
      <div
        v-if="session.recap"
        class="text-neutral-300 bg-surface-2 pr-2 whitespace-pre-wrap"
      >
        {{ session.recap }}
      </div>
      <div
        v-else
        class="text-sm text-neutral-500 text-center max-w-[20em] h-[12em] pt-[5em] mx-auto"
      >
        No recap has been provided
      </div>
    </div>
    <div v-if="session.audioUri" class="mt-4">
      <div class="bg-surface-2 rounded-[8px] p-4">
        <div class="flex align-center text-xl mb-2">
          <div>Audio</div>
        </div>
        <ViewSessionTranscription read-only />
      </div>
    </div>
  </template>
  <div
    v-else
    class="bg-surface-2 p-6 text-center rounded-[20px] text-neutral-400 mt-6"
  >
    <div v-if="session.isOver">
      Check back later once your GM adds more session info.
    </div>
    <div v-else>
      This is an upcoming session scheduled for
      <div class="text-lg text-neutral-200 my-4">{{ sessionDate }}</div>
      Check back here again later after the session is over and your GM has
      added a session recap and/or session audio.
    </div>
  </div>
</template>
