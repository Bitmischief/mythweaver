<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { useRoute } from 'vue-router';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import ViewSessionTranscription from '@/components/Sessions/ViewSessionTranscription.vue';
import { format } from 'date-fns';
import { generateArbitraryProperty } from '@/lib/generation.ts';
import Spinner from '@/components/Core/Spinner.vue';
import { SparklesIcon } from '@heroicons/vue/24/solid';

const route = useRoute();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const session = ref<SessionBase>({} as SessionBase);

const sessionImageUri = ref('');
const sessionSuggestedImagePrompt = ref('');
const sessionId = computed(() => parseInt(route.params.sessionId.toString()));

onMounted(async () => {
  await init();

  channel.bind(ServerEvent.SessionUpdated, async function () {
    await init();
  });

  eventBus.$on(
    'updated-conjuration-image',
    async (payload: { imageUri: string }) => {
      sessionImageUri.value = payload.imageUri;
      await saveSession('image');
    },
  );
});

onUnmounted(() => {
  channel.unbind_all();
  eventBus.$off('session-summary-panel-updated');
  eventBus.$off('updated-conjuration-image');
});

async function init() {
  const response = await getSession(sessionId.value);

  session.value = response.data as SessionBase;
  sessionImageUri.value = session.value.imageUri || '';
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

async function saveSession(updated?: string) {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    campaignId: session.value.campaignId,
    imageUri: sessionImageUri.value,
    suggestedImagePrompt: sessionSuggestedImagePrompt.value,
  });

  if (putSessionResponse.status === 200) {
    if (updated) {
      showSuccess({ message: `Session ${updated} saved!` });
    }
  } else {
    showError({ message: 'Failed to save session' });
  }
}

const sessionDate = computed(() => {
  return session.value && session.value.date
    ? format(session.value.date, 'MMM dd, yyyy @ h:mm a')
    : 'TBD';
});

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
    prompt: sessionSuggestedImagePrompt.value,
    linking: {
      sessionId: session.value.id,
    },
  });
  loadingImageModal.value = false;
}
</script>

<template>
  <template v-if="session.completed">
    <div
      class="flex gap-4 mt-4 flex-wrap lg:flex-nowrap justify-center items-stretch"
    >
      <div v-if="!sessionImageUri">
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
          :image-uri="sessionImageUri"
          :prompt="sessionSuggestedImagePrompt"
          class="rounded-md w-full md:w-[20em]"
          :type="sessionType"
          :linking="{ sessionId: session.id }"
          @set-image="
            sessionImageUri = $event.imageUri;
            sessionSuggestedImagePrompt = $event.prompt;
          "
        />
      </div>
      <div class="grow">
        <div class="bg-surface-2 h-full rounded-[8px] p-4">
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
      </div>
    </div>
    <div v-if="session.summary" class="mt-4">
      <div class="bg-surface-2 h-full rounded-[8px] p-4">
        <div class="flex align-center text-xl mb-2">
          <div>Summary</div>
        </div>
        <div
          v-if="session.summary"
          class="text-neutral-300 max-h-[16em] overflow-y-auto bg-surface-2 pr-2"
        >
          {{ session.summary }}
        </div>
        <div
          v-else
          class="text-sm text-neutral-500 text-center max-w-[20em] h-[12em] pt-[5em] mx-auto"
        >
          Summary will be available once this session is completed
        </div>
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
