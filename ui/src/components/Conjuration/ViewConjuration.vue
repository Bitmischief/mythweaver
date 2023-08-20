<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  addConjuration,
  Conjuration,
  deleteConjuration,
  getConjuration,
  patchConjuration,
} from "@/api/conjurations.ts";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/solid";
import { useCurrentUserId, useQuickConjure } from "@/lib/hooks.ts";
import { showSuccess } from "@/lib/notifications.ts";
import DeleteModal from "@/components/Core/General/DeleteModal.vue";

const route = useRoute();
const router = useRouter();
const quickConjure = useQuickConjure();
const currentUserId = useCurrentUserId();
const viewImage = ref(false);
const showDeleteModal = ref(false);

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

const conjurationId = computed(() =>
  parseInt(route.params.conjurationId?.toString())
);

const isQuickConjure = computed(() => {
  return route.query.quick === "true";
});

onMounted(async () => {
  await loadConjuration();
});

watch(conjurationId, async () => {
  await loadConjuration();
});

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

async function handleRemoveConjuration() {
  showDeleteModal.value = true;
}

async function clickDeleteConjuration() {
  if (!conjuration.value) return;

  await deleteConjuration(conjuration.value.id);
  showSuccess({ message: "Successfully removed conjuration" });

  setTimeout(async () => {
    await navigateToConjurations();
  }, 250);
}

async function navigateToConjurations() {
  await router.push("/conjurations");
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
      <div class="mb-6 md:flex md:justify-between">
        <router-link
          class="bg-surface-2 mb-2 flex rounded-xl border border-gray-600/50 p-3 md:mb-0"
          to="/conjurations"
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          <span class="self-center">Back to list</span>
        </router-link>

        <div class="flex">
          <button
            v-if="isQuickConjure"
            class="mr-2 flex rounded-xl bg-amber-500 p-3 text-lg font-bold shadow-lg"
            @click="quickConjure(conjuration.conjurerCode)"
          >
            <ArrowPathIcon class="mr-2 h-5 w-5 self-center" /> Retry Quick
            Conjure
          </button>
          <!--          <button-->
          <!--            v-if="conjuration.conjurerCode === 'characters'"-->
          <!--            class="mr-2 flex rounded-xl bg-purple-500 p-3 text-lg font-bold shadow-lg"-->
          <!--          >-->
          <!--            <BoltIcon class="mr-2 h-5 w-5 self-center" /> Chat-->
          <!--          </button>-->
          <button
            v-if="userOwnsConjuration"
            class="flex rounded-xl border border-red-500 bg-surface p-3 text-lg font-bold shadow-lg"
            @click="handleRemoveConjuration()"
          >
            <XMarkIcon class="mr-2 h-5 w-5 self-center text-white" />
            <span class="self-center">Remove</span>
          </button>
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
      <div class="md:flex">
        <div class="mb-3 mr-3 md:mb-0">
          <img
            :src="conjuration.imageUri"
            class="h-[10rem] w-auto cursor-pointer rounded-full hover:opacity-60"
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
