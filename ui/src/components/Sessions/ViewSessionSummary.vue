<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  getSession,
  patchSession,
  postSessionSummaryEmail,
  SessionBase,
} from '@/api/sessions.ts';
import { useRoute } from 'vue-router';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import ViewSessionTranscription from '@/components/Sessions/ViewSessionTranscription.vue';
import { format } from 'date-fns';
import Spinner from '@/components/Core/Spinner.vue';
import { EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/vue/24/outline';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { SparklesIcon } from '@heroicons/vue/24/solid';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages.ts';
import { postGenerateArbitraryFromPrompt } from '@/api/generators';
import { generateArbitrary } from '@/lib/generation';

const route = useRoute();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();
const {
  showModal: showGenerateImageModal,
  setLinkingContext,
  setPresetImageSettings,
} = useGenerateImages();

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
    showError({ message: 'Failed to email summary. Please try again.' });
  } finally {
    emailLoading.value = false;
  }
};

const loadingImageModal = ref(false);

async function showNewImageModal() {
  loadingImageModal.value = true;
  const promptResponse = await generateArbitrary({
    prompt: `Generate me a stable diffusion image prompt for a pivotal scene from this session. If representing characters, please include the 
    gender, race, and any other relevant details from the provided information, in the new prompt. Keep the prompt short and concise.`,
    context: `Return just a prompt used to generate AI images in a system like Stable Diffusion. I am generating an image for 
            a tabletop roleplaying session.`,
    background: session.value,
  });
  sessionSuggestedImagePrompt.value = promptResponse.text;
  setLinkingContext({ sessionId: sessionId.value });
  setPresetImageSettings({
    prompt: sessionSuggestedImagePrompt.value,
  });
  showGenerateImageModal.value = true;
  loadingImageModal.value = false;
}

const primaryImage = computed(() => {
  if (session.value.images?.length) {
    return session.value.images.find((i) => i.primary);
  }
  return undefined;
});

const loadingSummary = ref(false);
async function regenerateSummary() {
  try {
    loadingSummary.value = true;
    const summaryResponse = await postGenerateArbitraryFromPrompt({
      background: session.value.recap,
      context:
        'You are a helpful assistant that generates summaries for tabletop roleplaying game sessions.',
      prompt:
        'Generate a summary of the session, based on the recap, keeping the tone and style of the recap, and limiting the summary to a paragraph in length.',
    });
    session.value.summary = summaryResponse.data.text;

    await saveSummary();
  } catch {
    showError({ message: 'Failed to regenerate summary. Please try again.' });
  } finally {
    loadingSummary.value = false;
  }
}

async function saveSummary() {
  await patchSession({
    id: session.value.id,
    summary: session.value.summary,
  });
}
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
            @click="showNewImageModal"
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

            <div class="flex gap-2">
              <div class="flex justify-end">
                <button
                  class="button-ghost text-sm py-1 flex"
                  @click="regenerateSummary"
                  :disabled="loadingSummary"
                >
                  <span v-if="!session.summary">Generate Summary</span>
                  <span v-else>Re-generate Summary</span>
                </button>
              </div>

              <div v-if="session.summary" class="flex gap-2">
                <button
                  class="button-ghost text-sm py-1 flex"
                  :disabled="emailLoading || loadingSummary || !session.summary"
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
              </div>
            </div>
          </div>
          <div
            v-if="currentUserRole === CampaignRole.DM"
            class="text-neutral-300 max-h-[16em] overflow-y-auto bg-surface-2 pr-2"
          >
            <Textarea
              v-if="!loadingSummary"
              v-model="session.summary"
              placeholder="Write a summary of the session here..."
              auto-resize
              @change="saveSummary"
            />
            <Loader v-else />
          </div>
          <div
            v-else-if="currentUserRole === CampaignRole.Player"
            class="text-sm text-neutral-500 text-center max-w-[20em] h-[12em] pt-[5em] mx-auto"
          >
            No summary has been created
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
