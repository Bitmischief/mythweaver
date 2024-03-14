<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import {
  deleteConjurationRelationship,
  getConjurationRelationships,
} from '@/api/relationships.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import {
  ArrowDownOnSquareStackIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  HomeIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import ModalAlternate from '@/components/ModalAlternate.vue';
import QuickViewConjuration from '@/components/Conjuration/QuickViewConjuration.vue';
import { toPascalCase } from '@/lib/util.ts';
import { useEventBus } from '@/lib/events.ts';

const eventBus = useEventBus();
const props = defineProps<{
  startNodeId: number;
  startNodeType: ConjurationRelationshipType;
}>();
const relationships = ref<any[]>([]);
const relationshipHistory = ref<any[]>([]);

onMounted(async () => {
  await fetchRelationships(props.startNodeId, props.startNodeType);
  eventBus.$on('relationship-created', async (nodeInfo: any) => {
    if (
      nodeInfo.nodeId === props.startNodeId &&
      nodeInfo.nodeType === props.startNodeType
    ) {
      await fetchRelationships(props.startNodeId, props.startNodeType);
    }
  });
});

onUnmounted(() => {
  eventBus.$off('relationship-created');
});

async function fetchRelationships(
  nodeId: number,
  type: ConjurationRelationshipType,
) {
  try {
    const response = await getConjurationRelationships(nodeId, type);
    relationships.value = response.data.filter(
      (d: any) =>
        d.previousNodeId === nodeId &&
        (d.nextType === props.startNodeType
          ? d.nextNodeId !== props.startNodeId
          : true) &&
        !relationshipHistory.value.some((rh) => rh.nextNodeId === d.nextNodeId),
    );
  } catch (e: any) {
    showError({
      message:
        'Something went wrong fetching session relationships. Please refresh the page to try again.',
    });
  }
}

async function clickNode(relationship: any) {
  relationshipHistory.value.push(relationship);
  await fetchRelationships(relationship.nextNodeId, relationship.nextType);
}

async function clickHistory(history: any) {
  const historyIndex = relationshipHistory.value.findIndex(
    (h) => h.id === history.id,
  );
  relationshipHistory.value = relationshipHistory.value.slice(
    0,
    historyIndex + 1,
  );
  await fetchRelationships(history.nextNodeId, history.nextType);
}

async function clearHistory() {
  relationshipHistory.value = [];
  await fetchRelationships(props.startNodeId, props.startNodeType);
}

const currentlyViewingRelationship = ref<any>(null);
const showViewModal = ref(false);
async function viewNode(relationship: any) {
  currentlyViewingRelationship.value = relationship;
  showViewModal.value = true;
}

async function removeRelationship(relationship: any) {
  try {
    await deleteConjurationRelationship(relationship.id);
    showSuccess({ message: 'Relationship removed.' });
    await fetchRelationships(
      relationship.previousNodeId,
      relationship.previousType,
    );
  } catch (e) {
    showError({
      message:
        'Something went wrong removing the relationship. Please try again.',
    });
  }
}

function getBadge(relationship: any) {
  if (relationship.nextType === ConjurationRelationshipType.CONJURATION) {
    if (relationship.entitydata.conjurerCode === 'monsters') {
      return 'Monster';
    } else if (relationship.entitydata.conjurerCode === 'locations') {
      return 'Location';
    } else if (relationship.entitydata.conjurerCode === 'characters') {
      return 'NPC';
    } else {
      return '';
    }
  } else {
    return toPascalCase(relationship.nextType);
  }
}
</script>

<template>
  <div
    v-if="relationshipHistory.length"
    class="flex shrink py-1 px-2 bg-surface-2 rounded-full mb-2 text-neutral-400 overflow-x-auto whitespace-nowrap"
  >
    <div class="flex px-2 hover:underline hover:cursor-pointer">
      <HomeIcon
        class="h-5 w-5 self-center hover:text-neutral-200"
        @click="clearHistory"
      />
      <ArrowRightIcon class="h-5 w-5 ml-4 self-center" />
    </div>
    <div
      v-for="(history, i) in relationshipHistory"
      :key="`history_${i}`"
      class="flex px-2 hover:underline hover:cursor-pointer"
      @click="clickHistory(history)"
    >
      {{ history.entitydata.name }}
      <ArrowRightIcon class="h-5 w-5 ml-4 self-center" />
    </div>
  </div>
  <div
    v-if="relationships.length"
    class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
  >
    <div
      v-for="relationship in relationships"
      :key="`r_${relationship.id}`"
      class="bg-surface-2 p-3 rounded-[12px]"
    >
      <div class="relative">
        <img
          :src="relationship.entitydata.imageUri"
          alt="relationship img"
          class="rounded-[10px]"
        />
        <div
          class="absolute top-2 left-2 rounded-full bg-white/70 text-black text-sm px-2"
        >
          {{ getBadge(relationship) }}
        </div>
        <div class="absolute bottom-2 right-2 left-2">
          <div class="flex justify-between">
            <div class="relative flex group cursor-pointer mx-2">
              <TrashIcon
                class="h-8 w-8"
                @click="removeRelationship(relationship)"
              />
              <div
                class="absolute -top-10 -left-5 invisible group-hover:visible bg-surface-3 rounded-full whitespace-nowrap px-2 py-1"
              >
                Remove Relationship
              </div>
            </div>
            <div class="relative flex group cursor-pointer mx-2">
              <ArrowTopRightOnSquareIcon
                class="h-8 w-8"
                @click="viewNode(relationship)"
              />
              <div
                class="absolute -top-10 left-1/2 -translate-x-1/2 invisible group-hover:visible bg-surface-3 rounded-full whitespace-nowrap px-2 py-1"
              >
                Open for viewing
              </div>
            </div>
            <div class="relative flex group cursor-pointer mx-2">
              <ArrowDownOnSquareStackIcon
                class="h-8 w-8"
                @click="clickNode(relationship)"
              />
              <div
                class="absolute -top-10 -right-5 invisible group-hover:visible bg-surface-3 rounded-full whitespace-nowrap px-2 py-1"
              >
                View relationships
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center">
        <div class="mt-1 text-lg">
          {{ relationship.entitydata.name }}
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center my-10">No Relationships Found</div>
  <ModalAlternate
    :show="showViewModal"
    extra-dark
    @close="showViewModal = false"
  >
    <div
      class="bg-surface rounded-[12px] w-[90vw] h-[90vh] overflow-y-auto p-6"
    >
      <QuickViewConjuration
        v-if="
          currentlyViewingRelationship.nextType ===
          ConjurationRelationshipType.CONJURATION
        "
        :conjuration="currentlyViewingRelationship.entitydata"
        @close="showViewModal = false"
      />
    </div>
  </ModalAlternate>
</template>

<style scoped></style>
