<script lang="ts" setup>
import { getSession, patchSession, SessionBase } from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserRole } from '@/lib/hooks.ts';
import { CampaignRole } from '@/api/campaigns.ts';

const route = useRoute();
const currentUserRole = useCurrentUserRole();

const session = ref<SessionBase>({} as SessionBase);

onMounted(async () => {
  await init();
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  session.value = response.data as SessionBase;
}

async function clickSaveSession() {
  const putSessionResponse = await patchSession({
    ...session.value,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session saved' });
  } else {
    showError({ message: 'Failed to save session' });
  }
}
</script>

<template>
  <FormKit
    v-model="session.planning"
    label="Planning"
    type="textarea"
    :disabled="currentUserRole !== CampaignRole.DM"
    auto-height
    placeholder="Last Session Recap:
- Discovered the ancient map leading to the Lost Temple.
- Escaped the ambush set by the Crimson Bandit Guild.

This Session Goals:
- Begin with the party arriving at the temple outskirts.
- Navigate traps and puzzles inside the temple.
- Encounter the guardian of the temple's main chamber.

Encounters:
1. Forest Ambush: Bandit Guild's final attempt to stop the party.
2. Temple Puzzles: Decipher ancient riddles and mechanisms.
3. Guardian Battle: A challenging fight with a mystical guardian.

NPCs to Highlight:
- Aric, the wise hermit who knows the temple's secrets.
- Zara, the guild spy posing as an ally.

Loot/Items:
- Ancient artifacts, rare gems, healing potions.

Notes/Reminders:
- Adjust puzzle difficulty based on party's past performance.
- Be ready for possible peaceful resolution with the guardian.

Post-Session:
- Gather feedback, particularly about puzzle design and combat balance."
  />

  <div class="flex mt-6 justify-end">
    <button
      class="rounded-md bg-green-500 text-lg py-1 px-3"
      @click="clickSaveSession"
    >
      Save Changes
    </button>
  </div>
</template>
