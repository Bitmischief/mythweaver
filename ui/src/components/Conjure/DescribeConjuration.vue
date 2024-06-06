<script setup lang="ts">
import { showError, showInfo } from '@/lib/notifications.ts';
import { Conjurer, postConjure } from '@/api/generators.ts';
import { AxiosError } from 'axios';
import {
  useCurrentUserPlan,
  useSelectedCampaignId,
  useWebsocketChannel,
} from '@/lib/hooks.ts';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { BillingPlan } from '@/api/users.ts';
import { Conjuration } from '@/api/conjurations.ts';
import Loader from '@/components/Core/Loader.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const emit = defineEmits(['update:modelValue', 'next', 'back']);
const props = defineProps<{
  modelValue: Conjuration | undefined;
  defaultPrompt?: string;
  generator: Conjurer;
}>();

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const channel = useWebsocketChannel();
const currentUserPlan = useCurrentUserPlan();
const selectedCampaignId = useSelectedCampaignId();
// const quickConjure = useQuickConjure();

const generating = ref(false);
const conjurationRequestId = ref<number | undefined>(undefined);
const prompt = ref<string>(props.defaultPrompt || '');
const examples = ref<string[]>([]);

onMounted(async () => {
  examples.value = generatorExamples();
});

async function generate() {
  if (!props.generator) {
    return;
  }

  if (!selectedCampaignId.value) {
    showInfo({ message: 'Please select a campaign first.' });
    return;
  }

  let generateResponse;
  try {
    generateResponse = await postConjure(props.generator.code, {
      count: 1,
      campaignId: selectedCampaignId.value || 0,
      prompt: prompt.value,
      type: 'text',
    });
  } catch (e: any) {
    const err = e as AxiosError;
    if (err.response?.status === 400) {
      showError({
        message: (err.response?.data as any)?.message,
      });
      return;
    }

    showError({
      message: `We encountered an error conjuring this ${props.generator.name}. Please try again.`,
    });
    return;
  }

  handleBeginConjuring(generateResponse.data);
}

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  generating.value = true;
  conjurationRequestId.value = data.conjurationRequestId;

  channel.bind(ServerEvent.ConjurationCreated, conjurationCreatedHandler);
  channel.bind(ServerEvent.ConjurationError, conjurationErrorHandler);
}

function conjurationCreatedHandler(data: any) {
  value.value = data;
  emit('next');
  generating.value = false;
}

function conjurationErrorHandler() {
  generating.value = false;
  showError({
    message: `There was a server error creating your ${props.generator.name}. Please try again, or reach out to support if the problem persists.`,
  });
}

onUnmounted(() => {
  channel.unbind(ServerEvent.ConjurationCreated, conjurationCreatedHandler);
  channel.unbind(ServerEvent.ConjurationError, conjurationErrorHandler);
});

const selectedIsProOnly = computed(() => {
  return props.generator ? proOnly(props.generator) : false;
});

const proOnly = (gen: Conjurer) => {
  return (
    gen.proOnly &&
    currentUserPlan.value !== BillingPlan.Trial &&
    currentUserPlan.value !== BillingPlan.Pro
  );
};

const generatorExamples = () => {
  const descriptions = props.generator.examples;
  const shuffled = descriptions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};
</script>

<template>
  <div v-if="generating" class="p-12">
    <div class="text-center my-12">
      <Loader />
      <div class="text-3xl mt-4">Conjuring</div>
      <div class="text-lg text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
  </div>
  <div v-else>
    <FormKit :actions="false" type="form" @submit="generate">
      <div class="text-xl">
        Give us a description of the
        <span class="gradient-text">{{ generator.name }}</span>
        you want to conjure
      </div>
      <div class="text-sm text-neutral-500 mb-4">
        {{ generator.customizationHelpPrompt }}
      </div>
      <div class="mb-4 flex gap-2 justify-between">
        <button class="button-primary flex gap-2" @click="emit('back')">
          <ArrowLeftIcon class="h-5 w-5 self-center" />
          <span class="self-center">Back</span>
        </button>

        <button class="button-gradient flex gap-2">
          <img
            src="@/assets/icons/wand.svg"
            alt="wand"
            class="h-5 self-center"
          />
          <span class="self-center">Conjure</span>
        </button>
      </div>
      <div
        class="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow"
      >
        <div class="flex flex-col p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
          <div class="relative pb-1 grow">
            <FormKit
              v-model="prompt"
              :placeholder="`Enter ${generator?.name} Description`"
              inner-class="border-none"
              input-class="$reset input-secondary border-none focus:ring-fuchsia-500 resize-none md:pr-[8em]"
              help-class="px-1"
              name="prompt"
              type="textarea"
              validation="length:0,1000"
              rows="10"
              :disabled="selectedIsProOnly"
            />
            <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
              {{ prompt.length }} / 1000
            </div>
          </div>
        </div>
      </div>
      <div class="text-lg mt-12 text-center">Examples</div>
      <div
        class="grid grid-cols-1 xl:grid-cols-3 text-neutral-500 mx-auto gap-4 mt-4 justify-around"
      >
        <div
          v-for="(des, i) in examples"
          :key="`sample_npc_${i}`"
          class="rounded-[20px] bg-surface-2 p-4 flex flex-col"
        >
          <div class="mb-2">{{ des }}</div>
          <button
            class="button-ghost-primary mt-auto"
            @click.prevent="prompt = des"
          >
            Copy example
          </button>
        </div>
      </div>
    </FormKit>
  </div>
</template>

<style scoped></style>
