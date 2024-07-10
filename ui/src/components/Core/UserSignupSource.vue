<script lang="ts" setup>
import { ref } from 'vue';
import { showError } from '@/lib/notifications.ts';

const emit = defineEmits(['finish-onboarding']);

const sources = ref([
  {
    id: 'friend',
    name: 'Friend',
  },
  {
    id: 'google',
    name: 'Google',
  },
  {
    id: 'meta',
    name: 'Facebook or Instagram',
  },
  {
    id: 'influencer',
    name: 'Influencer',
  },
  {
    id: 'reddit',
    name: 'Reddit',
  },
]);

const influencers = ref([
  {
    id: 'totu',
    name: 'Theatre of the Unaligned',
  },
  {
    id: 'punkrockjenny',
    name: 'PunkRockJenny',
  },
  {
    id: 'dumbestdnd',
    name: 'dumbestdnd',
  },
  {
    id: 'tawny',
    name: 'Tawny Platis',
  },
  {
    id: 'vatara',
    name: 'Vatara',
  },
  {
    id: 'other',
    name: 'Other',
  },
]);

const selectedSource = ref({ id: '', name: '' });
const selectedInfluencer = ref({ id: '', name: '' });

function submitSourceInfo() {
  if (!selectedSource?.value?.id) {
    showError({ message: 'Please select a signup source and submit again!' });
    return;
  }

  if (
    selectedSource?.value?.id === 'influencer' &&
    !selectedInfluencer?.value?.id
  ) {
    showError({ message: 'Please select an influencer and submit again!' });
    return;
  }

  emit('finish-onboarding', {
    source: selectedSource?.value?.id,
    influencer: selectedInfluencer?.value?.id,
  });
}
</script>

<template>
  <div class="text-3xl">How did you find us?</div>
  <div class="text-lg text-neutral-400">
    Help our small business by taking a moment to let us know how you found us!
    This helps a ton!
  </div>

  <div class="mt-4">
    <div class="flex flex-col space-y-4">
      <div
        v-for="source in sources"
        :key="source.id"
        class="flex items-center space-x-4"
      >
        <input
          :id="source.id"
          v-model="selectedSource"
          type="radio"
          :value="source"
          class="form-radio h-6 w-6 text-primary-500"
        />
        <label :for="source.id" class="text-lg text-neutral-400">
          {{ source.name }}
        </label>
      </div>
    </div>

    <div v-if="selectedSource.id === 'influencer'" class="mt-8">
      <div class="text-3xl">Which Influencer?</div>
      <div class="text-lg text-neutral-400">
        Help us show your favorite influencer some love!
      </div>
      <div class="mt-4 flex flex-col space-y-4">
        <div
          v-for="influencer in influencers"
          :key="influencer.id"
          class="flex items-center space-x-4"
        >
          <input
            :id="influencer.id"
            v-model="selectedInfluencer"
            type="radio"
            :value="influencer"
            class="form-radio h-6 w-6 text-primary-500"
          />
          <label :for="influencer.id" class="text-lg text-neutral-400">
            {{ influencer.name }}
          </label>
        </div>
      </div>
    </div>
  </div>

  <button class="mt-4 button-ghost" @click="submitSourceInfo">Submit</button>
</template>
