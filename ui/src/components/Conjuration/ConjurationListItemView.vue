<script setup lang="ts">
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/vue/20/solid";
import { addConjuration, deleteConjuration } from "@/api/conjurations.ts";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { showSuccess } from "@/lib/notifications.ts";
import DeleteModal from "@/components/Core/General/DeleteModal.vue";

var props = defineProps({
  conjuration: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add-conjuration", "remove-conjuration"]);

const router = useRouter();
const currentUserId = useCurrentUserId();

const isMyConjuration = (conjuration: any) =>
  conjuration.copies?.length || conjuration.userId === currentUserId.value;

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  return `background-image: url("${imageUri}");`;
};

async function handleAddConjuration(conjurationId: number) {
  await addConjuration(conjurationId);

  emit("add-conjuration", conjurationId);
}

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}

async function clickDeleteConjuration() {
  if (!props.conjuration || !isMyConjuration(props.conjuration)) return;

  var conjurationId = props.conjuration.copies?.length
    ? props.conjuration.copies[0].id
    : props.conjuration.id;
  await deleteConjuration(conjurationId);
  showSuccess({ message: "Successfully removed conjuration" });

  emit("remove-conjuration", conjurationId);
  showDeleteModal.value = false;
}

var iconHover = ref(false);
const showDeleteModal = ref(false);
</script>

<template>
  <div
    class="relative flex h-[20rem] cursor-pointer flex-col justify-end rounded-lg bg-cover bg-top shadow-xl md:h-[30rem] 3xl:h-[40rem]"
    :style="backgroundImageInlineStyle(conjuration.imageUri)"
    @click="navigateToViewConjuration(conjuration.id)"
  >
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
    <div class="flex justify-between rounded-b-lg bg-black/50 p-4">
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
