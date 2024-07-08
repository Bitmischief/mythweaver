<script setup lang="ts">
import { postMoveCollection } from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { ref } from 'vue';
import CollectionMoveTree from '@/components/Collections/CollectionMoveTree.vue';

const emit = defineEmits(['close']);
const props = defineProps<{
  data: any;
}>();

const collection = ref(props.data);
const selectedMoveLocation = ref();

const moveCollection = async () => {
  if (!selectedMoveLocation.value || !collection.value) return;
  try {
    await postMoveCollection(collection.value.id, {
      parentCollectionId: selectedMoveLocation.value.id,
    });
    showSuccess({
      message: `${collection.value.name} was moved to ${selectedMoveLocation.value.name}`,
    });
    emit('close');
  } catch {
    showError({ message: 'Failed to move collection. Please try again.' });
  }
};
</script>

<template>
  <div
    class="flex flex-col bg-surface-3 rounded-[20px] p-6 min-w-[90vw] max-h-[90vh] md:min-w-[50vw]"
  >
    <div class="flex flex-wrap md:flex-nowrap gap-2 m-2">
      <div class="self-center">Moving</div>
      <div class="gradient-text text-lg self-center flex">
        <div>{{ collection.name }}</div>
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
        :collection-id="collection.id"
        :parent-id="undefined"
      />
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
        :disabled="!selectedMoveLocation"
        @click="moveCollection"
      >
        Confirm
      </button>
    </div>
  </div>
</template>

<style scoped></style>
