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
import { CheckIcon, XMarkIcon } from "@heroicons/vue/20/solid";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { showSuccess } from "@/lib/notifications.ts";
import RemoveConjuration from "@/components/Conjuration/RemoveConjuration.vue";

const route = useRoute();
const router = useRouter();
const currentUserId = useCurrentUserId();
const viewImage = ref(false);

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

async function handleRemoveConjuration() {
  if (!conjuration.value) return;

  await router.push(`/conjurations/view/${conjuration.value.originalId}`);
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

function textareaGrow(e: any) {
  e.target.style.height = "5px";
  e.target.style.height =
    Math.max(e.target.style.minHeight, e.target.scrollHeight) + "px";
}

var confirmRemove = ref(false);
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
          <div
            v-if="userOwnsConjuration"
            class="ml-2 flex rounded-xl border border-red-500 bg-surface p-3 text-lg font-bold shadow-lg hover:cursor-pointer"
            @click="confirmRemove = true"
          >
            <XMarkIcon class="h-5 w-5 self-center text-white" />
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
      <div class="flex flex-wrap">
        <div class="mr-3">
          <img
            :src="conjuration.imageUri"
            class="cursor-pointer rounded-full hover:opacity-60"
            height="100"
            width="100"
            @click="viewImage = true"
          />
        </div>
        <div>
          <div class="text-5xl">
            {{ conjuration.name }}
          </div>

          <div class="mb-12 mt-3 flex flex-wrap">
            <div
              v-for="tag of conjuration.tags"
              :key="`${conjuration.id}-${tag}`"
              class="mr-2 mt-1 rounded-xl bg-gray-700 px-3 py-1 text-lg"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>

      <div v-for="(data, i) in dataArray" :key="`data-${i}`">
        <div class="mt-8 text-2xl">
          {{ data.key }}
        </div>
        <div
          v-show="editDataKey !== data.key"
          class="mt-2 cursor-pointer whitespace-pre-wrap text-lg text-gray-400"
          @click="enableEdit(data.key, $event)"
        >
          {{ data.value }}
        </div>
        <textarea
          v-show="editDataKey === data.key"
          v-model="data.value"
          class="min-h-[20rem] w-full overflow-hidden rounded-xl border border-green-500 bg-surface p-3 text-lg shadow-lg"
          @click="$event.stopPropagation()"
          @blur="saveData"
          @input="textareaGrow"
        />
      </div>
    </div>

    <RemoveConjuration
      v-show="confirmRemove"
      :conjuration="conjuration"
      @close="confirmRemove = false"
      @remove-conjuration="handleRemoveConjuration()"
    />
  </div>
</template>
