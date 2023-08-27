<script setup lang="ts">
import { computed, ref } from "vue";
import { Conjuration } from "@/api/conjurations.ts";
import { CheckIcon, XMarkIcon } from "@heroicons/vue/20/solid";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { remove } from "lodash";
import { patchConjuration } from "@/api/conjurations.ts";

const emit = defineEmits(["tags-changed"]);

const props = defineProps<{
  conjuration: Conjuration;
}>();

const currentUserId = useCurrentUserId();
const userOwnsConjuration = computed(() => {
  return props.conjuration?.userId === currentUserId.value;
});

const viewImage = ref(false);
const hover = ref(-1);
const addingTag = ref(false);
const tagText = ref("");

const removeTag = async (tag: string) => {
  if (!props.conjuration.tags) return;

  let tags = [...props.conjuration.tags];
  remove(tags, function (t) {
    return t === tag;
  });
  await patchConjuration(props.conjuration.id, { tags });
  emit("tags-changed");
};
const addTag = async () => {
  if (tagText.value) {
    let tags = [] as string[];
    if (props.conjuration.tags) {
      tags = [...props.conjuration.tags];
    }
    tags.push(tagText.value);

    await patchConjuration(props.conjuration.id, { tags });
    emit("tags-changed");

    tagText.value = "";
  }
};
</script>

<template>
  <div
    v-if="viewImage"
    class="relative z-10"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    ></div>
    <div
      class="fixed inset-0 z-10 cursor-pointer overflow-y-auto"
      @click="viewImage = false"
    >
      <div
        class="flex min-h-full flex-col items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative mb-4 transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all"
        >
          <img
            :src="conjuration.imageUri"
            class="max-h-[80vh] max-w-[80vw]"
            :alt="conjuration.name"
          />
        </div>
        Click anywhere to close
      </div>
    </div>
  </div>

  <div class="md:flex">
    <div class="mb-3 mr-3 md:mb-0">
      <img
        :src="conjuration.imageUri"
        class="h-[10rem] min-w-[10rem] cursor-pointer rounded-full hover:opacity-60"
        :alt="conjuration.name"
        @click="viewImage = true"
      />
    </div>
    <div class="self-center">
      <div class="text-5xl">
        {{ conjuration.name }}
      </div>

      <div class="mt-3 flex flex-wrap">
        <div
          v-for="(tag, i) of conjuration.tags"
          :key="`${conjuration.id}-${tag}`"
          class="mr-2 mt-1 rounded-xl bg-gray-700 px-3 py-1 text-lg flex"
          :class="{ 'hover:pr-1': userOwnsConjuration }"
          @mouseover="hover = i"
          @mouseleave="hover = -1"
        >
          {{ tag }}
          <XMarkIcon
            v-if="userOwnsConjuration && hover === i"
            class="pt-1 h-6 w-6 cursor-pointer text-white"
            @click="removeTag(tag)"
          />
        </div>
        <div v-if="userOwnsConjuration && !addingTag" class="flex items-center">
          <div
            class="h-6 w-6 font-bold text-2xl rounded-xl bg-gray-700 flex items-center justify-center cursor-pointer"
            @click="addingTag = true"
          >
            +
          </div>
        </div>
        <div v-if="addingTag" class="mr-2 mt-1 relative">
          <input
            v-model="tagText"
            class="rounded-xl bg-gray-700 px-3 py-1 text-lg flex pr-[4.5rem]"
            placeholder="Add tag"
            autofocus
            @keydown.enter="addTag"
            @keydown.esc="addingTag = false"
          />
          <XMarkIcon
            class="h-6 cursor-pointer text-white hover:bg-gray-500 absolute right-8 top-1 border border-gray-500 mt-[2px] rounded-l-lg"
            @click="
              tagText = '';
              addingTag = false;
            "
          />
          <CheckIcon
            class="h-6 cursor-pointer text-white hover:bg-purple-500 absolute right-2 top-1 mt-[2px] border border-gray-500 rounded-r-lg"
            @click="addTag"
          />
        </div>
      </div>
    </div>
  </div>
</template>
