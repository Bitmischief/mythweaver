<script setup lang="ts">
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import {
  saveConjuration,
  Conjuration,
  removeConjuration,
} from '@/api/conjurations.ts';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { showSuccess } from '@/lib/notifications.ts';
import DeleteModal from '@/components/Core/General/DeleteModal.vue';

const props = defineProps<{
  conjuration: Conjuration | undefined;
  skeleton?: boolean;
}>();

const emit = defineEmits(['add-conjuration', 'remove-conjuration', 'drag']);

const router = useRouter();

const isSaved = (conjuration: any) => conjuration.saved;

async function handleAddConjuration(conjurationId: number) {
  await saveConjuration(conjurationId);

  emit('add-conjuration', { conjurationId });
}

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}

async function clickDeleteConjuration() {
  if (!props.conjuration || !isSaved(props.conjuration)) return;

  const conjurationId = props.conjuration?.copies?.length
    ? props.conjuration?.copies[0].id
    : props.conjuration?.id;

  await removeConjuration(conjurationId);
  showSuccess({ message: 'Successfully removed conjuration' });

  emit('remove-conjuration', {
    conjurationId,
    parentConjurationId: props.conjuration?.id,
  });
  showDeleteModal.value = false;
}

const showDeleteModal = ref(false);

async function dragStart() {
  emit('drag', {});
}
async function dragging() {
  emit('drag', {});
}
async function dragend() {
  emit('drag', {});
}
</script>

<template>
  <div
    v-if="conjuration"
    class="mr-6 mb-6"
    draggable="true"
    @dragstart="dragStart"
    @drag="dragging"
    @dragend="dragend"
  >
    <div
      class="relative md:max-w-[23rem] 3xl:max-w-[40rem] flex cursor-pointer flex-col justify-end rounded-t-xl shadow-xl"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div>
        <img
          v-if="conjuration.imageUri"
          :src="conjuration.imageUri"
          :alt="conjuration.name"
          class="rounded-t-xl"
        />
        <div v-else class="w-full flex justify-center h-full bg-gray-900/75">
          <div
            class="self-center text-center text-[2rem] text-white animate-pulse"
          >
            Conjuring image...
          </div>
        </div>
      </div>

      <div
        v-if="isSaved(conjuration)"
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-green-500 hover:bg-red-500 transition-all hover:scale-110 group"
      >
        <XMarkIcon
          class="h-8 w-8 hidden group-hover:flex self-center text-white"
          @click.stop="showDeleteModal = true"
        />
        <CheckIcon
          class="h-8 w-8 self-center text-white flex group-hover:hidden"
        />
      </div>
      <div
        v-else
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-gray-800 hover:bg-green-500 transition-all hover:scale-110"
        @click.stop="handleAddConjuration(conjuration.id)"
      >
        <button class="self-center">
          <PlusIcon class="h-8 w-8 text-white" />
        </button>
      </div>

      <div class="flex w-full justify-between rounded-b-lg bg-surface-2 p-4">
        <div>
          <div class="text-xl font-bold">{{ conjuration.name }}</div>
          <div class="flex flex-wrap">
            <div
              v-for="tag of conjuration.tags"
              :key="`${conjuration.id}-${tag}`"
              class="mr-1 mt-1 rounded-xl bg-gray-800 px-2 py-1 text-xs"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="skeleton">
    <div
      class="w-full flex justify-center bg-gray-900/75 rounded-xl h-[42rem] md:h-[52rem] 3xl:h-[62rem]"
    >
      <div class="self-center text-center text-[3rem] text-white animate-pulse">
        Conjuring...
      </div>
    </div>
  </div>

  <DeleteModal v-model="showDeleteModal">
    <div class="text-center text-8xl">Wait!</div>
    <div class="mt-8 text-center text-3xl">
      Are you sure you want to remove this conjuration from your list?
    </div>

    <div class="mt-12 flex justify-center">
      <button
        class="mr-6 rounded-xl border border-green-500 px-6 py-3"
        @click="showDeleteModal = false"
      >
        No, keep conjuration
      </button>
      <button
        class="rounded-xl bg-red-500 px-6 py-3"
        @click="clickDeleteConjuration"
      >
        Remove Conjuration
      </button>
    </div>
  </DeleteModal>
</template>
