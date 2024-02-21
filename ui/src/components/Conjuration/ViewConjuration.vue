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

async function routeBack() {
  router.go(-1);
  await router.push('/conjurations#saved');
}
</script>

<template>
  <template v-if="conjuration">
    <div class="flex justify-between mb-6">
      <div class="flex grow">
        <button class="button-primary flex" @click="routeBack">
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          <span class="self-center">Back</span>
        </button>

        <div v-if="conjuration.saved && !editable" class="input-primary ml-4">
          <span class="self-center">
            You must make a copy of this conjuration to make changes to it.
          </span>
        </div>

        <div
          v-if="!conjuration.saved && !editable"
          class="mx-auto text-fuchsia-500"
        >
          <span class="self-center">
            This conjuration has not been saved yet.
          </span>
        </div>
      </div>

      <div class="flex mt-2 mt-0">
        <button
          v-if="isQuickConjure"
          class="button-gradient flex"
          @click="quickConjure(conjuration.conjurerCode)"
        >
          <ArrowPathIcon class="mr-2 h-5 w-5 self-center" /> Retry Quick Conjure
        </button>

        <button
          v-if="editable"
          class="button-ghost flex"
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
          class="button-ghost flex"
          @click="handleCopyConjuration"
        >
          <DocumentDuplicateIcon class="h-5 w-5 mr-2" />
          <span class="self-center">Copy Conjuration</span>
        </button>
        <button
          v-if="!conjuration.saved"
          class="button-ghost flex"
          @click="handleSaveConjuration"
        >
          <HeartIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Save Conjuration</span>
        </button>

        <button
          v-if="conjuration.saved"
          class="button-primary flex ml-2"
          @click="handleRemoveConjuration"
        >
          Delete
        </button>
      </div>
    </div>

    <CustomizeConjuration
      :conjuration="conjuration"
      :image-conjuration-failed="conjuration.imageGenerationFailed"
    />
  </template>
</template>
