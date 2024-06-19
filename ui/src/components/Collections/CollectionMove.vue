<script setup lang="ts">
import { HomeIcon } from '@heroicons/vue/24/outline';
import { CheckCircleIcon } from '@heroicons/vue/20/solid';
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
      <div
        v-if="collection.parentCollectionId !== null"
        class="p-4 border border-neutral-800 rounded-[12px] flex justify-between grow cursor-pointer mb-4"
        :class="{
          'border-fuchsia-500 bg-fuchsia-500/10':
            selectedMoveLocation && selectedMoveLocation.id === undefined,
        }"
        @click="selectedMoveLocation = { id: undefined, name: 'Home' }"
      >
        <div class="flex gap-2 text-neutral-300">
          <HomeIcon class="h-6 w-6" />
          <div class="truncate">Home</div>
        </div>
        <div
          v-if="selectedMoveLocation && selectedMoveLocation.id === undefined"
          class="text-violet-500 self-center"
        >
          <CheckCircleIcon class="h-6 w-6 self-center" />
        </div>
      </div>
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
