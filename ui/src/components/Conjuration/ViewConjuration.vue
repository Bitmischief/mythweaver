<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  Conjuration,
  copyConjuration,
  getConjuration,
  removeConjuration,
  saveConjuration,
} from '@/api/conjurations.ts';
import { useRoute, useRouter } from 'vue-router';
import { useEventBus } from '@/lib/events.ts';
import CustomizeConjuration from '@/components/Conjuration/ViewConjuration/CustomizeConjuration.vue';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/vue/24/solid';
import { HeartIcon } from '@heroicons/vue/20/solid';
import { useCurrentUserId, useQuickConjure } from '@/lib/hooks.ts';
import { showSuccess } from '@/lib/notifications.ts';

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const quickConjure = useQuickConjure();
const currentUserId = useCurrentUserId();

const conjuration = ref<Conjuration | null>(null);

const conjurationId = computed(() =>
  parseInt(route.params.conjurationId?.toString()),
);

const editable = computed(
  () =>
    conjuration.value?.saved &&
    conjuration.value?.userId === currentUserId.value,
);

const isQuickConjure = computed(() => {
  return route.query.quick === 'true';
});

onMounted(async () => {
  await loadConjuration();
});

watch(conjurationId, async () => {
  await loadConjuration();
});

async function loadConjuration() {
  if (conjurationId.value) {
    const response = await getConjuration(conjurationId.value);
    conjuration.value = response.data;

    if (conjuration.value?.copies?.length) {
      await router.push(`/conjurations/view/${conjuration.value.copies[0].id}`);
      await loadConjuration();
    }
  }
}

async function handleSaveConjuration() {
  await saveConjuration(conjurationId.value);
  showSuccess({ message: 'Successfully saved conjuration!' });
  await loadConjuration();
}

async function handleRemoveConjuration() {
  if (confirm('Are you sure you want to delete this conjuration?')) {
    await removeConjuration(conjurationId.value);
    showSuccess({ message: 'Successfully removed conjuration!' });
    await router.push('/conjurations');
  }
}

async function handleCopyConjuration() {
  const response = await copyConjuration(conjurationId.value);
  showSuccess({ message: 'Successfully copied conjuration!' });
  await router.push(`/conjurations/view/${response.data.id}`);
}
</script>

<template>
  <template v-if="conjuration">
    <div class="md:flex justify-between mb-6">
      <div class="md:flex">
        <router-link
          :to="`/conjurations`"
          class="bg-surface-2 flex rounded-md border border-gray-600/50 p-3"
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back
        </router-link>

        <div
          v-if="conjuration.saved && !editable"
          class="md:ml-2 mt-2 md:mt-0 border border-blue-500 rounded-md px-4 flex"
        >
          <span class="self-center"
            >You must make a copy of this conjuration to make changes to
            it.</span
          >
        </div>
      </div>

      <div class="md:flex mt-2 md:mt-0">
        <button
          v-if="isQuickConjure"
          class="mr-2 flex rounded-md bg-amber-500 px-4 py-3 transition-all hover:scale-110"
          @click="quickConjure(conjuration.conjurerCode)"
        >
          <ArrowPathIcon class="mr-2 h-5 w-5 self-center" /> Retry Quick Conjure
        </button>

        <button
          v-if="editable"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="
            eventBus.$emit('save-conjuration', {
              conjurationId: conjuration.id,
            })
          "
        >
          <span class="self-center">Save Changes</span>
        </button>

        <button
          v-if="conjuration.saved && !editable"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="handleCopyConjuration"
        >
          <DocumentDuplicateIcon class="h-5 w-5 mr-2" />
          <span class="self-center">Copy Conjuration</span>
        </button>

        <button
          v-if="!conjuration.saved"
          class="md:w-auto md:ml-auto flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-green-400 to-green-600 px-4 py-3 transition-all hover:scale-110"
          @click="handleSaveConjuration"
        >
          <HeartIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Save Conjuration</span>
        </button>

        <button
          v-if="conjuration.saved"
          class="md:ml-2 mt-2 md:mt-0 h-12 flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-red-400 to-red-600 px-4 py-3 transition-all hover:scale-110"
          @click="handleRemoveConjuration"
        >
          Delete
        </button>
      </div>
    </div>

    <CustomizeConjuration :conjuration="conjuration" />
  </template>
</template>
