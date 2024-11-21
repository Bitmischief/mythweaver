<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import MeteorShower from '@/components/Core/MeteorShower.vue';
import GeneratorSelect from '@/components/Conjure/GeneratorSelect.vue';
import { Conjurer, getConjurers } from '@/api/generators.ts';
import DescribeConjuration from '@/components/Conjure/DescribeConjuration.vue';
import { Conjuration, getConjuration } from '@/api/conjurations.ts';
import EditConjurationDetails from '@/components/Conjure/EditConjurationDetails.vue';
import GenerateImage from '@/modules/images/components/GenerateImage.vue';
import { generateArbitrary } from '@/lib/generation';
import Loader from '@/components/Core/Loader.vue';

const current = ref<'generator' | 'conjure' | 'edit' | 'image'>('generator');
const router = useRouter();
const route = useRoute();

const generator = ref<Conjurer>();
const generators = ref<Conjurer[]>([]);
const conjuration = ref<Conjuration>();
const defaultPrompt = ref('');
const generatedImagePrompt = ref('');
const loading = ref(false);
watch(route, () => {
  if (route.fullPath === '/conjure') {
    current.value = 'generator';
    defaultPrompt.value = '';
  }
});

onMounted(async () => {
  await loadGenerators();

  if (route.query.code) {
    generator.value = generators.value.find((g) => g.code === route.query.code);
  } else {
    generator.value = generators.value[0];
  }
  if (route.query.prompt) {
    defaultPrompt.value = route.query.prompt as string;
  }

  if (route.query.id) {
    await loadConjuration(route.query.id);
    current.value = 'edit';
  } else if (route.query.code) {
    current.value = 'conjure';
  } else {
    current.value = 'generator';
  }
});

const back = () => {
  switch (current.value) {
    case 'conjure':
      current.value = 'generator';
      router.push({ query: {} });
      break;
    case 'edit':
      current.value = 'conjure';
      router.push({
        query: {
          code: generator.value?.code,
          prompt: conjuration.value?.prompt,
        },
      });
      break;
    case 'image':
      current.value = 'edit';
      router.push({
        query: {
          code: generator.value?.code,
          prompt: conjuration.value?.prompt,
          id: conjuration.value?.id,
        },
      });
      break;
  }
};

const next = async () => {
  switch (current.value) {
    case 'generator':
      current.value = 'conjure';
      router.push({ query: { code: generator.value?.code } });
      break;
    case 'conjure':
      current.value = 'edit';
      router.push({
        query: {
          code: generator.value?.code,
          prompt: conjuration.value?.prompt,
          id: conjuration.value?.id,
        },
      });
      break;
    case 'edit':
      if (!generatedImagePrompt.value) {
        loading.value = true;
        const promptResponse = await generateArbitrary({
          prompt:
            'Generate me a stable diffusion image prompt for this conjuration. Keep the description short (less than 300 characters), punchy and light on details. For fantasy races (like dragonborn, etc), please adjust the prompt with the description "anthropomorphic {{bear, dragon, horse, etc}} humanoid", for example, in the prompt.',
          context:
            'Return just a prompt used to generate AI images in a system like Stable Diffusion. I am generating an image for a tabletop roleplaying session.',
          background: conjuration.value,
        });

        generatedImagePrompt.value = promptResponse.text;

        loading.value = false;
      }

      current.value = 'image';
      router.push({
        query: {
          code: generator.value?.code,
          prompt: conjuration.value?.prompt,
          id: conjuration.value?.id,
        },
      });
      break;
  }
};

async function loadGenerators() {
  const generatorsResponse = await getConjurers();
  generators.value = generatorsResponse.data.data;
}

async function loadConjuration(id: any) {
  const conjurationResponse = await getConjuration(id);
  conjuration.value = conjurationResponse.data;
}

const handlePrimaryImageSet = () => {
  router.push(`/conjurations/view/${conjuration.value?.id}`);
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
        :default-prompt="defaultPrompt"
        @back="back"
        @next="next"
      />
    </div>
    <div v-if="current === 'edit' && !loading && generator && conjuration">
      <EditConjurationDetails
        v-model="conjuration"
        :generator="generator"
        @back="back"
        @next="next"
      />
    </div>
    <div v-if="current === 'edit' && loading">
      <div class="md:p-24">
        <Loader />
      </div>
    </div>
    <div v-if="current === 'image' && generator && conjuration">
      <div class="mb-4 text-xl">
        Generate the perfect image for your
        <span class="gradient-text">{{ generator.name }}</span>
      </div>
      <div class="flex justify-between mb-6">
        <button class="button-primary" @click="back">Back</button>
      </div>
      <GenerateImage
        allow-edits
        :linking="{ conjurationId: conjuration.id }"
        :prompt="generatedImagePrompt"
        @primary-image-set="handlePrimaryImageSet"
      />
    </div>
  </div>
</template>
