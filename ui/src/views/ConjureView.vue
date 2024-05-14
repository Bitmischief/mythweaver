<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useLDFlag } from 'launchdarkly-vue-client-sdk';
import { onMounted, ref, watch } from 'vue';
import MeteorShower from '@/components/Core/MeteorShower.vue';
import GeneratorSelect from '@/components/Conjure/GeneratorSelect.vue';
import { Conjurer } from '@/api/generators.ts';
import DescribeConjuration from '@/components/Conjure/DescribeConjuration.vue';
import { Conjuration } from '@/api/conjurations.ts';
import EditConjurationDetails from '@/components/Conjure/EditConjurationDetails.vue';
import CreateConjurationImage from '@/components/Conjure/CreateConjurationImage.vue';

// tabs will probably be generator | conjure | edit | image | summary
const steps = ['generator', 'conjure', 'edit', 'image'];

const current = ref('generator');
const conjureV2 = useLDFlag('conjure-v2');
const router = useRouter();

const generator = ref<Conjurer>();
const conjuration = ref<Conjuration>();

watch(conjureV2, () => {
  checkConjureV2();
});

onMounted(() => {
  checkConjureV2();
});

const checkConjureV2 = () => {
  if (conjureV2.value === false) {
    router.push('conjurations/new');
  }
};

const back = () => {
  const currentIndex = steps.findIndex((step) => step === current.value);
  if (currentIndex > 0) {
    current.value = steps[currentIndex - 1];
  }
};

const next = () => {
  console.log('next hit', current.value);
  const currentIndex = steps.findIndex((step) => step === current.value);
  if (currentIndex < steps.length - 1) {
    current.value = steps[currentIndex + 1];
  }
};
</script>

<template>
  <MeteorShower />
  <div>
    <div v-if="current === 'generator'">
      <GeneratorSelect v-model="generator" @next="next" />
    </div>
    <div v-if="current === 'conjure' && generator">
      <DescribeConjuration
        v-model="conjuration"
        :generator="generator"
        @back="back"
        @next="next"
      />
    </div>
    <div v-if="current === 'edit' && generator && conjuration">
      <EditConjurationDetails
        v-model="conjuration"
        :generator="generator"
        @back="back"
        @next="next"
      />
    </div>
    <div v-if="current === 'image' && generator && conjuration">
      <CreateConjurationImage
        v-model="conjuration"
        :generator="generator"
        @back="back"
        @next="next"
      />
    </div>
  </div>
</template>
