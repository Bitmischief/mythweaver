<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Character, getCurrentCampaignCharacters } from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError } from '@/lib/notifications.ts';
import { useCurrentUserId, useSelectedCampaignId } from '@/lib/hooks.ts';
import { useRouter } from 'vue-router';
import { PlusIcon } from '@heroicons/vue/20/solid';
import { useEventBus } from '@/lib/events.ts';

const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();
const characters = ref<Character[] | []>([]);
const createNewCharacter = ref(false);
const loading = ref(false);
const currentUserId = useCurrentUserId();

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
  await router.push(`/character/${id}`);
}
</script>

<template>
  <div v-if="characters.length && !loading">
    <div class="w-full flex justify-end">
      <router-link class="button-ghost" to="/character/new">
        Create New Character
      </router-link>
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
      <div class="flex overflow-x-auto">
        <div
          v-for="(char, i) in myCharacters"
          :key="`char_${i}`"
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer max-w-[15em] mr-6 overflow-hidden"
          @click="viewCharacter(char.id)"
        >
          <div class="relative">
            <img
              :src="char.imageUri || 'images/character_bg_square.png'"
              alt="character portrait"
              class="rounded-[20px]"
              :class="{ 'blur-sm': !char.imageUri }"
            />
            <div
              v-if="!char.imageUri"
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
      <div class="flex overflow-x-auto">
        <div
          v-for="(char, i) in campaignCharacters"
          :key="`char_${i}`"
          class="bg-surface-3 rounded-[25px] p-1 cursor-pointer min-w-[10em] max-w-[15em] mr-6 overflow-hidden"
          @click="viewCharacter(char.id)"
        >
          <div class="relative">
            <img
              :src="char.imageUri"
              alt="character portrait"
              class="rounded-[20px]"
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
          Characters you and your party members create for the selected campaign
          will appear on this screen. Try creating your first character using
          the button below.
        </div>
        <router-link
          class="flex justify-center self-center button-gradient mx-auto text-lg my-6"
          to="/character/new"
        >
          <PlusIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Create Your First Character</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
