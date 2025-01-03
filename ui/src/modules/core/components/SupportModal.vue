<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import { useSupportModal } from '@/modules/core/composables/useSupportModal';
import SelectButton from 'primevue/selectbutton';
import { computed, ref, watch } from 'vue';
import { postSupportRequest } from '@/api/support';
import Loader from '@/components/Core/Loader.vue';

const { showModal } = useSupportModal();

const selectedSupportType = ref('Image Generation');
const description = ref('');
const loading = ref(false);
const submitted = ref(false);

const submitSupportRequest = async () => {
  loading.value = true;

  await postSupportRequest(selectedSupportType.value, description.value);

  loading.value = false;
  submitted.value = true;
};

watch(showModal, () => {
  if (!showModal.value) {
    selectedSupportType.value = 'Image Generation';
    description.value = '';
    loading.value = false;
    submitted.value = false;
  }
});

const submitDisabled = computed(() => {
  return (
    loading.value ||
    description.value.length === 0 ||
    selectedSupportType.value.length === 0
  );
});
</script>

<template>
  <ModalAlternate :show="showModal" :z="35" @close="showModal = false">
    <div
      class="flex flex-col gap-4 bg-surface-3 rounded-[20px] p-4 min-w-[50vw]"
    >
      <div class="flex justify-center">
        <div class="text-neutral-400 text-xl">Support Center</div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showModal = false"
        />
      </div>

      <div
        v-if="!submitted && !loading"
        class="flex flex-col gap-4 text-neutral-300"
      >
        <div class="mt-2 text-2xl text-neutral-200">
          Need help? Our clerics can cast Healing Word.
        </div>

        <div class="-mb-2">What type of issue are you having?</div>
        <SelectButton
          v-model="selectedSupportType"
          :options="[
            'Image Generation',
            'Image Editing',
            'Sessions',
            'Billing',
            'Other',
          ]"
        />

        <div class="-mb-2">Describe your issue</div>
        <Textarea
          v-model="description"
          auto-resize
          placeholder="Describe the issue you're encountering in detail, including what you expected to happen, and what actually happened. As much detail as you can provide really helps us track down, fix and resolve your issue as quickly as possible."
        />

        <button
          class="bg-fuchsia-600 text-white rounded-md p-2"
          :class="{
            'opacity-50 cursor-not-allowed': submitDisabled,
          }"
          :disabled="submitDisabled"
          @click="submitSupportRequest"
        >
          Submit Support Request
        </button>
      </div>

      <div v-if="loading" class="flex flex-col gap-4 text-neutral-300">
        <Loader />
      </div>

      <div
        v-if="submitted"
        class="flex flex-col gap-4 text-neutral-300 text-center"
      >
        <span class="text-2xl">
          Your ticket was submitted. We'll get back to you as soon as possible.
        </span>
        <button
          class="bg-fuchsia-600 text-white rounded-md p-2"
          @click="showModal = false"
        >
          Close
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
