<script setup lang="ts">
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import {
  addConjuration,
  Conjuration,
  deleteConjuration,
} from '@/api/conjurations.ts';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { showSuccess } from '@/lib/notifications.ts';
import DeleteModal from '@/components/Core/General/DeleteModal.vue';

const props = defineProps<{
  conjuration: Conjuration | undefined;
  skeleton?: boolean;
}>();

const emit = defineEmits(['add-conjuration', 'remove-conjuration']);

const router = useRouter();
const currentUserId = useCurrentUserId();

const isMyConjuration = (conjuration: any) =>
  conjuration.copies?.length || conjuration.userId === currentUserId.value;

async function handleAddConjuration(conjurationId: number) {
  await addConjuration(conjurationId);

  emit('add-conjuration', conjurationId);
}

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}

async function clickDeleteConjuration() {
  if (!props.conjuration || !isMyConjuration(props.conjuration)) return;

  var conjurationId = props.conjuration?.copies?.length
    ? props.conjuration?.copies[0].id
    : props.conjuration?.id;
  await deleteConjuration(conjurationId);
  showSuccess({ message: 'Successfully removed conjuration' });

  emit('remove-conjuration', conjurationId);
  showDeleteModal.value = false;
}

let iconHover = ref(false);
const showDeleteModal = ref(false);
</script>

<template>
  <div v-if="conjuration">
    <div
      class="relative flex cursor-pointer flex-col justify-end rounded-lg shadow-xl"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div
        class="h-[20rem] md:h-[30rem] 3xl:h-[40rem] overflow-hidden rounded-t-xl"
      >
        <img
          v-if="conjuration.imageUri"
          :src="conjuration.imageUri"
          :alt="conjuration.name"
          class=""
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
        v-if="isMyConjuration(conjuration)"
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-green-500 hover:bg-gray-500"
        @mouseover="iconHover = true"
        @mouseout="iconHover = false"
      >
        <XMarkIcon
          v-if="iconHover"
          class="h-8 w-8 self-center text-white"
          @click.stop="showDeleteModal = true"
        />
        <CheckIcon v-else class="h-8 w-8 self-center text-white" />
      </div>
      <div
        v-else
        class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-gray-800 hover:bg-gray-500"
        @click.stop="handleAddConjuration(conjuration.id)"
      >
        <button class="self-center">
          <PlusIcon class="h-8 w-8 text-white" />
        </button>
      </div>

      <div
        class="flex w-full justify-between rounded-b-lg bg-black/50 p-4 h-[22rem]"
      >
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
          <div class="mt-4 min-h-[12rem] max-h-[14rem] overflow-y-auto">
            <template v-if="conjuration.conjurerCode === 'characters'">
              <div class="self-center mb-2">Background</div>
              <div class="text-gray-400 pr-6">
                {{ conjuration.data.background }}
              </div>
            </template>
            <template v-if="conjuration.conjurerCode === 'locations'">
              <div class="self-center mb-2">History</div>
              <div class="text-gray-400 pr-6">
                {{ conjuration.data.history }}
              </div>
            </template>
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
        Delete Conjuration
      </button>
    </div>
  </DeleteModal>
</template>
