<script setup lang="ts">
import {
  Collection,
  // patchCollection,
  // getCollections,
} from '@/api/collections.ts';
import { computed, onUpdated, ref } from 'vue';
// import { remove } from 'lodash';
// import { useEventBus } from '@/lib/events.ts';
// import { AxiosError } from 'axios';
import { useCurrentUserId } from '@/lib/hooks.ts';
// import CustomizableImage from '@/components/Images/CustomizableImage.vue';

const props = defineProps<{
  collection: Collection;
}>();

// const eventBus = useEventBus();
const currentUserId = useCurrentUserId();

const editableCollection = ref(props.collection);
// const addingTag = ref(false);
// const tagText = ref('');
// const showCustomizeImageModal = ref(false);
// const tagInput = ref<HTMLElement | null>(null);

const editable = computed(
  () => props.collection?.userId === currentUserId.value,
);

// onMounted(async () => {

// });

onUpdated(() => {
  // if (!editableCollection.value.imageUri) {
  //   editableCollection.value.imageUri = props.collection.imageUri;
  // }
  // if (props.collection.id !== editableCollection.value.id) {
  //   editableCollection.value = props.collection;
  // }
});

// async function saveCollection() {
//   try {
//     //   await patchCollection(props.collection.id, {
//     //     ...editableCollection.value,
//     //     data: Object.fromEntries(dataArray.value.map((x) => [x.key, x.value])),
//     //   });
//     //   showSuccess({ message: 'Successfully saved collection' });
//   } catch (e) {
//     //   const err = e as AxiosError;
//     //   showError({
//     //     message: (err?.response?.data as any)?.message?.toString() || '',
//     //   });
//   }
// }
</script>

<template>
  <div v-if="collection" class="w-full">
    <div class="max-w-[35rem] overflow-hidden rounded-md md:mr-6">
      <div class="mt-4 text-4xl font-bold">
        <div class="text-xl">Collection Name</div>
        <FormKit
          v-model="editableCollection.name"
          type="text"
          validation="length:0,50"
          placeholder="Collection Name"
          auto-height
          :disabled="!editable"
        />
      </div>
    </div>
    <div class="rounded-md md:mr-6">
      <div class="mt-4 text-4xl font-bold">
        <div class="text-xl">Description</div>
        <FormKit
          v-model="editableCollection.description"
          type="textarea"
          validation="length:0,50"
          placeholder="Collection Name"
          auto-height
          :disabled="!editable"
        />
      </div>
    </div>
  </div>
</template>
