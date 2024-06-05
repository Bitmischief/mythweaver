<script setup lang="ts">
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { onMounted, ref } from 'vue';
import { Conjuration, getConjuration } from '@/api/conjurations.ts';
import { showError } from '@/lib/notifications.ts';
import { ArrowsRightLeftIcon, ArrowsUpDownIcon } from '@heroicons/vue/20/solid';
import { getSession, SessionBase } from '@/api/sessions.ts';
import { getCampaign } from '@/api/campaigns.ts';
import CreateSessionRelationship from '@/components/Relationships/Create/CreateSessionRelationship.vue';
import CreateConjurationRelationship from '@/components/Relationships/Create/CreateConjurationRelationship.vue';
import CreateCampaignRelationship from '@/components/Relationships/Create/CreateCampaignRelationship.vue';

defineEmits(['close']);

const props = defineProps<{
  relationshipType: ConjurationRelationshipType;
  nodeId: number;
  nodeType: ConjurationRelationshipType;
}>();

let loading = ref(true);
let conjuration = ref<Conjuration | undefined>();
let session = ref<SessionBase | undefined>();
let campaign = ref<any | undefined>();

onMounted(async () => {
  try {
    loading.value = true;
    switch (props.nodeType) {
      case ConjurationRelationshipType.SESSION:
        await fetchSession();
        break;
      case ConjurationRelationshipType.CAMPAIGN:
        await fetchCampaign();
        break;
      case ConjurationRelationshipType.CHARACTER:
      case ConjurationRelationshipType.CONJURATION:
        await fetchConjuration();
        break;
      default:
        showError({
          message: `Unknown relationship type: ${props.relationshipType}`,
        });
        break;
    }
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

async function fetchConjuration() {
  const response = await getConjuration(props.nodeId);
  conjuration.value = response.data;
}

async function fetchSession() {
  const response = await getSession(props.nodeId);
  session.value = response.data;
}

async function fetchCampaign() {
  const response = await getCampaign(props.nodeId);
  campaign.value = response.data;
}

const primaryImageUri = (data: any) => {
  if (data?.images?.length) {
    return data.images?.find((i: any) => i.primary)?.uri;
  }
  return undefined;
};
</script>

<template>
  <div class="max-h-full">
    <div class="flex justify-between mb-2 h-[2em]">
      <div class="text-lg self-center">Create Relationship</div>
      <div class="self-center">
        <button class="button-primary" @click="$emit('close')">Close</button>
      </div>
    </div>
    <div
      class="md:flex md:flex-row justify-around h-[calc(90vh-6em)] overflow-y-auto md:overflow-y-visible"
    >
      <div v-if="!loading" class="flex justify-center max-h-full">
        <div
          v-if="
            (nodeType === ConjurationRelationshipType.CONJURATION ||
              nodeType === ConjurationRelationshipType.CHARACTER) &&
            !!conjuration
          "
          class="flex"
        >
          <div class="bg-surface-3 rounded-[20px] p-2 my-auto text-center">
            <img
              :src="primaryImageUri(conjuration)"
              alt="conjuration"
              class="min-w-[250px] max-w-[300px] rounded-[18px]"
            />
            <div class="mt-2 text-lg">{{ conjuration.name }}</div>
          </div>
        </div>
        <div
          v-if="nodeType === ConjurationRelationshipType.SESSION && !!session"
          class="flex"
        >
          <div
            class="bg-surface-3 rounded-[20px] p-2 overflow-x-hidden my-auto"
          >
            <img
              :src="primaryImageUri(session) || '/images/session_bg_square.png'"
              alt="session"
              class="min-w-[250px] max-w-[300px] w-full rounded-[18px]"
            />
            <div class="text-center truncate">{{ session.name }}</div>
          </div>
        </div>
        <div
          v-if="nodeType === ConjurationRelationshipType.CAMPAIGN && !!campaign"
          class="flex"
        >
          <div
            class="bg-surface-3 rounded-[20px] p-2 overflow-x-hidden my-auto"
          >
            <img
              src="/images/generators/campaign.png"
              alt="campaign"
              class="min-w-[250px] max-w-[300px] w-full rounded-[18px]"
            />
            <div class="text-center truncate mx-6">{{ campaign.name }}</div>
          </div>
        </div>
      </div>
      <div class="flex justify-center my-4 md:my-auto mx-4">
        <ArrowsUpDownIcon class="md:hidden h-8 w-8" />
        <ArrowsRightLeftIcon class="hidden md:block h-8 w-8" />
      </div>
      <div v-if="relationshipType === ConjurationRelationshipType.SESSION">
        <CreateSessionRelationship :node-type="nodeType" :node-id="nodeId" />
      </div>
      <div v-if="relationshipType === ConjurationRelationshipType.CONJURATION">
        <CreateConjurationRelationship
          :node-type="nodeType"
          :node-id="nodeId"
        />
      </div>
      <div v-if="relationshipType === ConjurationRelationshipType.CAMPAIGN">
        <CreateCampaignRelationship :node-type="nodeType" :node-id="nodeId" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
