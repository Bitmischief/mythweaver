<script setup lang="ts">
import {
  postMoveCollectionConjuration,
  saveCollectionConjuration,
} from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { ref } from 'vue';
import CollectionMoveTree from '@/components/Collections/CollectionMoveTree.vue';

const emit = defineEmits(['close']);
const props = defineProps<{
  data: any;
  collectionId: number | undefined;
}>();

const conjuration = ref(props.data);
const selectedMoveLocation = ref();

const moveConjuration = async () => {
  if (!selectedMoveLocation.value || !conjuration.value) return;
  try {
    if (!props.collectionId) {
      await saveCollectionConjuration(selectedMoveLocation.value.id, {
        conjurationId: conjuration.value.id,
      });
    } else {
      await postMoveCollectionConjuration(
        props.collectionId,
        conjuration.value.id,
        {
          collectionId: selectedMoveLocation.value.id,
        },
      );
    }
    showSuccess({
      message: `${conjuration.value.name} was ${!props.collectionId ? 'added' : 'moved'} to ${selectedMoveLocation.value.name}`,
    });
    emit('close');
  } catch {
    showError({ message: 'Failed to move conjuration. Please try again.' });
  }
};
</script>

<template>
  <div
    class="flex flex-col bg-surface-3 rounded-[20px] p-6 max-h-[90vh] md:min-w-[50vw]"
  >
    <div class="flex flex-wrap md:flex-nowrap gap-2 m-2">
      <div class="self-center">
        {{ !collectionId ? 'Add' : 'Moving' }}
      </div>
      <div class="gradient-text text-lg self-center flex">
        <div>{{ conjuration.name }}</div>
      </div>
      <div v-if="selectedMoveLocation" class="flex gap-2">
        <div class="self-center">to</div>
        <div class="gradient-text text-lg self-center">
          {{ selectedMoveLocation?.name }}
        </div>
      </div>
    </div>
    <hr class="mb-2 border-neutral-600" />
    <div class="overflow-auto pr-2">
      <CollectionMoveTree
        v-model="selectedMoveLocation"
        :collection-id="undefined"
        :parent-id="undefined"
      />
    </div>
    <div
      v-if="selectedMoveLocation && selectedMoveLocation.id === collectionId"
      class="text-sm text-neutral-500 mx-2 mt-4"
    >
      {{ conjuration.name }} is already in this collection.
    </div>
    <div class="flex gap-4 mt-4">
      <button
        class="button-secondary basis-1/2"
        @click="
          selectedMoveLocation = undefined;
          emit('close');
        "
      >
        Cancel
      </button>
      <button
        class="button-gradient basis-1/2"
        :disabled="
          !selectedMoveLocation || selectedMoveLocation.id === collectionId
        "
        @click="moveConjuration"
      >
        Confirm
      </button>
    </div>
  </div>
</template>

<style scoped></style>
