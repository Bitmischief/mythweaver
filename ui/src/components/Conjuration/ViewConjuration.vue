<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import {
  addConjuration,
  Conjuration,
  getConjuration,
  patchConjuration,
} from "@/api/conjurations.ts";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeftIcon, BoltIcon, PlusIcon } from "@heroicons/vue/24/solid";
import { CheckIcon } from "@heroicons/vue/20/solid";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { showSuccess } from "@/lib/notifications.ts";

const route = useRoute();
const router = useRouter();
const currentUserId = useCurrentUserId();

const conjuration = ref<Conjuration | null>(null);
const dataArray = computed(() => {
  if (!conjuration.value) {
    return [];
  }

  return Object.keys(conjuration.value.data).map((key) => {
    return {
      key,
      value: conjuration.value?.data[key],
    };
  });
});

const editDataKey = ref<string | undefined>(undefined);

onMounted(async () => {
  await loadConjuration();
});

const conjurationId = computed(() =>
  parseInt(route.params.conjurationId.toString())
);

async function loadConjuration() {
  const response = await getConjuration(conjurationId.value);
  conjuration.value = response.data;

  if (conjuration.value?.copies?.length) {
    await router.push(`/conjurations/view/${conjuration.value.copies[0].id}`);
    await loadConjuration();
  }
}

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  return `background-image: url("${imageUri}");`;
};

async function handleAddConjuration(conjurationId: number) {
  await addConjuration(conjurationId);
  await loadConjuration();
}

const userOwnsConjuration = computed(() => {
  return conjuration.value?.userId === currentUserId.value;
});

function enableEdit(key: string, event: MouseEvent) {
  if (!userOwnsConjuration.value) return;

  editDataKey.value = key;
  event.stopPropagation();
}

async function saveData() {
  if (!conjuration.value) return;

  const data = Object.fromEntries(dataArray.value.map((x) => [x.key, x.value]));
  await patchConjuration(conjuration.value.id, { data });

  showSuccess({ message: "Updated conjuration!" });
}
</script>

<template>
  <div
    v-if="conjuration"
    class="relative h-full w-full rounded-lg bg-contain bg-top"
    :style="backgroundImageInlineStyle(conjuration.imageUri)"
    @click="editDataKey = undefined"
  >
    <div
      class="h-full w-full overflow-y-auto bg-gradient-to-b from-surface/95 to-surface p-12"
    >
      <div class="mb-6 flex justify-between">
        <router-link
          :to="`/conjurations`"
          class="bg-surface-2 flex rounded-xl border-2 border-gray-600/50 p-3"
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          <span class="self-center">Back to list</span>
        </router-link>

        <div class="flex">
          <button
            v-if="conjuration.conjurerCode === 'characters'"
            class="mr-2 flex rounded-xl bg-purple-500 p-3 text-lg font-bold shadow-lg"
          >
            <BoltIcon class="mr-2 h-5 w-5 self-center" /> Chat
          </button>
          <div
            v-if="userOwnsConjuration"
            class="flex rounded-xl border border-green-500 bg-surface p-3 text-lg font-bold shadow-lg"
          >
            <CheckIcon class="mr-2 h-5 w-5 self-center text-white" />
            <span class="self-center">Added</span>
          </div>
          <button
            v-else
            class="flex rounded-xl border border-green-500 bg-surface p-3 text-lg font-bold shadow-lg"
            @click="handleAddConjuration(conjuration.id)"
          >
            <PlusIcon class="mr-2 h-5 w-5 self-center" /> Add
          </button>
        </div>
      </div>

      <div class="text-5xl">
        {{ conjuration.name }}
      </div>

      <div class="mb-12 mt-4 flex">
        <div
          v-for="tag of conjuration.tags"
          :key="`${conjuration.id}-${tag}`"
          class="mr-2 rounded-xl bg-gray-700 px-3 py-1 text-lg"
        >
          {{ tag }}
        </div>
      </div>

      <div v-for="(data, i) in dataArray" :key="`data-${i}`">
        <div class="mt-8 text-2xl">
          {{ data.key }}
        </div>
        <div
          v-show="editDataKey !== data.key"
          class="mt-2 cursor-pointer text-lg text-gray-400"
          @click="enableEdit(data.key, $event)"
        >
          {{ data.value }}
        </div>
        <textarea
          v-show="editDataKey === data.key"
          v-model="data.value"
          class="h-[20rem] w-full rounded-xl border border-green-500 bg-surface p-3 text-lg shadow-lg"
          @click="$event.stopPropagation()"
          @blur="saveData"
        />
      </div>
    </div>
  </div>
</template>
