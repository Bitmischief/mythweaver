<script setup lang="ts">
import { CheckIcon, PlusIcon } from "@heroicons/vue/20/solid";
import { addConjuration } from "@/api/conjurations.ts";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { useRouter } from "vue-router";

defineProps({
  conjuration: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add-conjuration"]);

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
</script>

<template>
  <div
    class="relative flex h-[20rem] cursor-pointer flex-col justify-end rounded-lg bg-cover bg-top shadow-xl md:h-[20rem] 3xl:h-[30rem]"
    :style="backgroundImageInlineStyle(conjuration.imageUri)"
    @click="navigateToViewConjuration(conjuration.id)"
  >
    <div
      v-if="isMyConjuration(conjuration)"
      class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-green-500"
    >
      <CheckIcon class="h-8 w-8 self-center text-white" />
    </div>
    <div
      v-else
      class="absolute right-2 top-2 flex h-12 w-12 justify-center rounded-full bg-gray-800 hover:bg-gray-500"
      @click="handleAddConjuration(conjuration.id)"
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
</template>
