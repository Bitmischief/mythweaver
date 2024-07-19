<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import MeteorShower from '@/components/Core/MeteorShower.vue';
import GeneratorSelect from '@/components/Conjure/GeneratorSelect.vue';
import { Conjurer, getConjurers } from '@/api/generators.ts';
import DescribeConjuration from '@/components/Conjure/DescribeConjuration.vue';
import { Conjuration, getConjuration } from '@/api/conjurations.ts';
import EditConjurationDetails from '@/components/Conjure/EditConjurationDetails.vue';
import CreateConjurationImage from '@/components/Conjure/CreateConjurationImage.vue';

const current = ref<'generator' | 'conjure' | 'edit' | 'image'>('generator');
const router = useRouter();
const route = useRoute();

const generator = ref<Conjurer>();
const generators = ref<Conjurer[]>([]);
const conjuration = ref<Conjuration>();
const defaultPrompt = ref('');

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

const next = () => {
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
