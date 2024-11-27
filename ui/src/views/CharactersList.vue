<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Character, getCurrentCampaignCharacters } from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserId, useSelectedCampaignId } from '@/lib/hooks.ts';
import { useRoute, useRouter } from 'vue-router';
import { XCircleIcon } from '@heroicons/vue/20/solid';
import { useEventBus } from '@/lib/events.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { Conjuration, getConjurations } from '@/api/conjurations.ts';
import {
  deleteCampaignConjuration,
  getCampaign,
  postCampaignConjuration,
} from '@/api/campaigns.ts';
import Spinner from '@/components/Core/Spinner.vue';

const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();
const route = useRoute();
const characters = ref<Character[] | []>([]);
const createNewCharacter = ref(false);
const loading = ref(false);
const currentUserId = useCurrentUserId();
const campaign = ref();

onMounted(async () => {
  if (!selectedCampaignId.value) {
    await router.push('/campaigns/new');
  }

  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

onUnmounted(() => {
  eventBus.$off('campaign-selected');
});

async function init() {
  if (!selectedCampaignId.value) return;

  loading.value = true;
  try {
    const campaignResponse = await getCampaign(selectedCampaignId.value);
    campaign.value = campaignResponse.data;
    const response = await getCurrentCampaignCharacters();
    characters.value = response.data;
    createNewCharacter.value = false;
  } catch (err) {
    const e = err as AxiosError;
    if (e.response?.status === 404) {
      createNewCharacter.value = true;
    } else {
      showError({ message: 'Failed to load characters' });
    }
  } finally {
    loading.value = false;
  }
}

const myCharacters = computed(() => {
  if (characters.value.length && !!currentUserId.value) {
    return characters.value.filter((c) => c.userId === currentUserId.value);
  }
  return [];
});

const campaignCharacters = computed(() => {
  if (characters.value.length && !!currentUserId.value) {
    return characters.value.filter((c) => c.userId !== currentUserId.value);
  }
  return [];
});

async function viewCharacter(id: number) {
  await router.push({
    path: `/conjurations/view/${id}`,
    query: { from: route.fullPath },
  });
}

function primaryImage(char: any) {
  if (char.images?.some((i: any) => i.primary && i.uri)) {
    return char.images.find((i: any) => i.primary)?.uri;
  }
  return null;
}

const showAddCharacter = ref(false);
const characterToEditList = ref<any[]>([]);
const showRemoveCharacter = ref(false);

const showAddCharacterModal = async () => {
  await loadCharacters();
  showAddCharacter.value = true;
};

const showRemoveCharacterModal = async () => {
  characterToEditList.value = myCharacters.value;
  showRemoveCharacter.value = true;
};

const loadCharacters = async () => {
  try {
    const response = await getConjurations({
      campaignId: selectedCampaignId.value || 0,
      mine: true,
      saved: true,
      conjurerCodes: ['players'],
      offset: 0,
      limit: 200,
    });
    characterToEditList.value = response.data.data?.sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    );
  } catch {
    showError({ message: 'Failed to load characters. Please try again.' });
  }
};

const loadingAddToCampaign = ref(false);
const addCharacterToCampaign = async (character: any) => {
  try {
    loadingAddToCampaign.value = true;
    await postCampaignConjuration(selectedCampaignId.value || 0, character.id);
    await init();
    await loadCharacters();
    showSuccess({ message: 'Character added to campaign' });
  } catch {
    showError({
      message: 'Failed to add character to campaign. Please try again.',
    });
  } finally {
    loadingAddToCampaign.value = false;
  }
};

const loadingRemoveFromCampaign = ref(false);
const removeCharacterFromCampaign = async (character: any) => {
  try {
    loadingRemoveFromCampaign.value = true;
    await deleteCampaignConjuration(
      selectedCampaignId.value || 0,
      character.id,
    );
    await init();
    showRemoveCharacter.value = false;
    showSuccess({ message: 'Character removed from campaign' });
  } catch {
    showError({
      message: 'Failed to remove character from campaign. Please try again.',
    });
  } finally {
    loadingRemoveFromCampaign.value = false;
  }
};

const notInCampaign = (character: any) => {
  return !characters.value.some((c) => c.id === character.id);
};

function characterDescription(character: Conjuration) {
  return (
    character?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'backstory',
    )?.data.text ||
    character?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'looks',
    )?.data.text
  );
}
</script>

<template>
  <div>
    <div class="w-full flex flex-wrap gap-2 justify-between mb-2">
      <div class="text-xl self-center gradient-text">Campaign Characters</div>
      <div class="flex gap-2">
        <div>
          <button class="button-gradient" @click="showAddCharacterModal">
            Add Existing Character
          </button>
        </div>
        <router-link
          class="button-ghost text-center"
          to="/conjure?code=players"
        >
          Create New Character
        </router-link>
        <div>
          <button class="button-primary" @click="showRemoveCharacterModal">
            Remove Characters
          </button>
        </div>
      </div>
    </div>
    <div v-if="myCharacters.length && !loading" class="mb-12">
      <div class="flex mb-4">
        <div class="mr-1">My Characters</div>
        <div
          class="text-xs bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full px-2 py-1"
        >
          {{ myCharacters.length }}
        </div>
      </div>
      <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <div
          v-for="(char, i) in myCharacters"
          :key="`char_${i}`"
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer w-full mr-6 overflow-hidden"
          @click="viewCharacter(char.id)"
        >
          <div class="relative">
            <img
              :src="
                primaryImage(char) ||
                '/images/conjurations/player-character-no-image.png'
              "
              alt="character portrait"
              class="rounded-[20px] aspect-square object-cover"
              :class="{ 'filter blur-sm': !primaryImage(char) }"
            />
            <div
              v-if="!primaryImage(char)"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 text-neutral-300 text-lg"
            >
              No Image
            </div>
          </div>
          <div class="py-1 px-2 text-center truncate">
            {{ char.name }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="campaignCharacters.length && !loading">
      <div class="flex mb-4">
        <div class="mr-1">Campaign Characters</div>
        <div
          class="text-xs bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full px-2 py-1"
        >
          {{ campaignCharacters.length }}
        </div>
      </div>
      <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <div
          v-for="(char, i) in campaignCharacters"
          :key="`char_${i}`"
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer w-full mr-6 overflow-hidden"
          @click="viewCharacter(char.id)"
        >
          <div class="relative">
            <img
              :src="primaryImage(char)"
              alt="character portrait"
              class="rounded-[20px] aspect-square object-cover"
            />
          </div>
          <div class="py-1 px-2 text-center truncate">
            {{ char.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="!characters.length && !loading">
    <div class="flex justify-center h-full items-center">
      <div class="flex flex-col text-center">
        <div class="self-center text-2xl mt-12 mb-4">
          No characters created for this campaign yet.
        </div>
        <div class="text-neutral-500 mb-8 max-w-[40em]">
          Characters you and your party members add to the selected campaign
          will appear on this page.
        </div>
      </div>
    </div>
  </div>

  <ModalAlternate :show="showAddCharacter || showRemoveCharacter">
    <div
      class="bg-surface-2 rounded-[20px] p-6 min-w-[50vw] max-w-[95vw] lg:max-w-[75vw] xl:max-w-[60vw]"
    >
      <div class="mb-4 flex flex-wrap justify-between">
        <div>
          {{
            showAddCharacter
              ? 'Add your characters to'
              : 'Remove characters from'
          }}
          <span class="gradient-text">{{ campaign.name }}</span>
        </div>
        <div
          class="cursor-pointer"
          @click="
            showAddCharacter = false;
            showRemoveCharacter = false;
          "
        >
          <XCircleIcon class="h-5 w-5" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          v-for="(character, i) in characterToEditList"
          :key="`char_add_${i}_${character.id}`"
          class="flex flex-wrap bg-surface-3 rounded-[16px]"
        >
          <div class="basis-1/3 p-2 relative">
            <img
              :src="
                primaryImage(character) ||
                '/images/conjurations/player-character-no-image.png'
              "
              alt="character portrait"
              class="rounded-[20px]"
              :class="{ 'filter blur-sm': !primaryImage(character) }"
            />
            <div
              v-if="!primaryImage(character)"
              class="absolute top-1/2 -translate-y-1/2 inset-x-0 text-center text-neutral-300 text-lg"
            >
              No Image
            </div>
          </div>
          <div class="basis-2/3 relative">
            <div class="flex flex-col absolute inset-2">
              <div class="flex justify-between">
                <div class="text-xl self-center truncate">
                  {{ character.name }}
                </div>
              </div>
              <div
                class="relative h-full text-sm text-neutral-400 overflow-hidden shrink overflow-ellipsis"
              >
                {{
                  characterDescription(character) || 'No character description'
                }}
                <div
                  class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-3"
                ></div>
              </div>
            </div>
          </div>
          <div class="basis-full p-2 pt-0">
            <div v-if="showAddCharacter">
              <button
                v-if="notInCampaign(character)"
                class="button-gradient flex justify-center w-full text-center"
                :disabled="loadingAddToCampaign"
                @click="addCharacterToCampaign(character)"
              >
                <span v-if="loadingAddToCampaign" class="flex gap-2 mx-auto">
                  Adding
                  <Spinner v-if="loadingAddToCampaign" />
                </span>
                <span v-else>Add to {{ campaign.name }}</span>
              </button>
              <div v-else class="flex gap-2 justify-center text-neutral-400">
                This character is already in this campaign
              </div>
            </div>
            <div v-if="showRemoveCharacter">
              <button
                class="button-ghost flex justify-center w-full text-center"
                :disabled="loadingRemoveFromCampaign"
                @click="removeCharacterFromCampaign(character)"
              >
                <span
                  v-if="loadingRemoveFromCampaign"
                  class="flex gap-2 mx-auto"
                >
                  Removing
                  <Spinner v-if="loadingRemoveFromCampaign" />
                </span>
                <span v-else>Remove from {{ campaign.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>
