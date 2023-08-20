<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";
import DeleteModal from "@/components/Core/General/DeleteModal.vue";
import {
  addConjuration,
  Conjuration,
  deleteConjuration,
} from "@/api/conjurations.ts";
import { showSuccess } from "@/lib/notifications.ts";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentUserId, useQuickConjure } from "@/lib/hooks.ts";

const props = defineProps<{
  conjuration: Conjuration;
}>();

const emit = defineEmits(["add-conjuration"]);

const router = useRouter();
const route = useRoute();
const quickConjure = useQuickConjure();
const currentUserId = useCurrentUserId();

const showDeleteModal = ref(false);

const isQuickConjure = computed(() => {
  return route.query.quick === "true";
});

const userOwnsConjuration = computed(() => {
  return props.conjuration?.userId === currentUserId.value;
});

async function handleAddConjuration(conjurationId: number) {
  await addConjuration(conjurationId);
  emit("add-conjuration");
}

async function navigateToConjurations() {
  await router.push("/conjurations");
}

async function handleRemoveConjuration() {
  showDeleteModal.value = true;
}

async function clickDeleteConjuration() {
  if (!props.conjuration) return;

  await deleteConjuration(props.conjuration.id);
  showSuccess({ message: "Successfully removed conjuration" });

  setTimeout(async () => {
    await navigateToConjurations();
  }, 250);
}
</script>

<template>
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
        <ArrowPathIcon class="mr-2 h-5 w-5 self-center" /> Retry Quick Conjure
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
