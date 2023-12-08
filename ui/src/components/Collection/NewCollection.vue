<script lang="ts" setup>
import { Collection, postCollection } from '@/api/collections.ts';
import { ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';

import { useRouter } from 'vue-router';
// import { useEventBus } from '@/lib/events.ts';

const emit = defineEmits(['close', 'created']);

const router = useRouter();
// const eventBus = useEventBus();

const collection = ref<Collection>({} as Collection);
// const conjureImageDone = ref(false);

async function createCollection() {
  const response = await postCollection(collection.value);
  if (response.status === 201) {
    showSuccess({ message: 'collection created' });
    await router.push(`/conjurations`);
  } else {
    showError({
      message: 'Failed to create collection. Please try again in a moment.',
    });
  }
}
</script>

<template>
  <div
    class="flex h-full p-2 overflow-y-auto pr-6 pb-1 flex-col justify-between"
  >
    <div class="text-3xl">
      Create your collection to start grouping your conjurations
    </div>

    <FormKit type="form" @submit="createCollection">
      <div class="mt-8">
        <div class="flex justify-between">
          <div class="w-[48%]">
            <div class="flex justify-between">
              <div class="text-xl">Name</div>
            </div>
            <FormKit
              v-model="collection.name"
              type="text"
              name="name"
              validation="required|text"
              class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
              placeholder="Enter your collection's name"
            />
          </div>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex justify-between">
          <div class="w-[48%]">
            <div class="flex justify-between">
              <div class="text-xl">Description</div>
            </div>
            <FormKit
              v-model="collection.description"
              type="textarea"
              name="Description"
              validation="required"
              class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
              placeholder="Enter a description for your collection"
            />
          </div>
        </div>
      </div>
    </FormKit>
  </div>
</template>
