<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import {
  getConjurer,
  Conjurer,
  getConjurationRequest,
} from '@/api/generators.ts';
import { useRoute } from 'vue-router';
import SummoningLoader from '@/components/Conjuration/ConjuringLoader.vue';
import { useEventBus } from '@/lib/events.ts';
import ConfigureConjure from '@/components/Conjuration/ViewConjurer/ConfigureConjure.vue';
import CustomizeConjuration from '@/components/Conjuration/ViewConjuration/CustomizeConjuration.vue';
import ConfigureConjureActions from '@/components/Conjuration/ViewConjurer/ConfigureConjureActions.vue';

const route = useRoute();
const eventBus = useEventBus();

const summoner = ref<Conjurer | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);
const summonedItems = ref<any[]>([]);

const conjurationRequestId = ref<number | undefined>(undefined);
const pollingIntervalId = ref<number | undefined>(undefined);

const conjuration = computed(() => {
  if (!summonedItems.value.length) return undefined;

  return {
    ...summonedItems.value[0],
    saved: true,
    published: true,
  };
});

onMounted(async () => {
  const getGeneratorResponse = await getConjurer(
    route.params.summonerCode.toString(),
  );
  summoner.value = getGeneratorResponse.data;
});

onUnmounted(() => {
  if (pollingIntervalId.value) {
    clearInterval(pollingIntervalId.value);
  }
});

async function loadConjurationRequest() {
  if (!conjurationRequestId.value) return;

  const conjurationRequestResponse = await getConjurationRequest(
    conjurationRequestId.value,
  );

  summonedItems.value = conjurationRequestResponse.data.conjurations;
}

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  animationDone.value = false;
  generating.value = true;

  conjurationRequestId.value = data.conjurationRequestId;

  pollingIntervalId.value = setInterval(async () => {
    await loadConjurationRequest();

    if (summonedItems.value.length > 0) {
      processConjuringPartiallyComplete();
    }
    if (
      summonedItems.value.length &&
      summonedItems.value.every((c: any) => c.imageUri)
    ) {
      processConjuringComplete();
    }
  }, 5 * 1000) as unknown as number;
}

function processConjuringPartiallyComplete() {
  generating.value = false;
  eventBus.$emit('summoningDone', {});

  eventBus.$on('summoningAnimationDone', () => {
    animationDone.value = true;
  });
}

function processConjuringComplete() {
  clearInterval(pollingIntervalId.value);
}
</script>

<template>
  <div v-if="summoner" class="relative flex">
    <div class="z-10 h-full w-full rounded-xl p-4">
      <ConfigureConjureActions
        class=""
        :summoned-items="summonedItems.length > 0"
        :conjuration-id="
          summonedItems.length > 0 ? summonedItems[0].id : undefined
        "
      />

      <div class="block 3xl:flex">
        <div
          class="bg-surface-2 w-full md:w-[25rem] h-full md:p-8 p-4 rounded-md"
        >
          <ConfigureConjure
            :summoner="summoner"
            @begin-conjuring="handleBeginConjuring"
          />
        </div>
        <div class="mt-8 md:mt-0 md:ml-8 bg-surface-2 w-full rounded-md">
          <div
            v-if="!generating && !conjuration"
            class="flex justify-center h-full"
          >
            <div class="self-center">
              <div class="text-neutral-700 text-center text-3xl">
                Let's make something magical...
              </div>
              <div class="mt-2 text-neutral-700 text-center text-md">
                Your conjuration will appear here
              </div>
            </div>
          </div>
          <template v-if="generating">
            <div class="p-4">
              <SummoningLoader class="h-[10rem] w-[15rem]" />
            </div>
          </template>
          <template v-else-if="conjuration">
            <div class="p-4">
              <CustomizeConjuration :conjuration="conjuration" />
            </div>
          </template>
        </div>
      </div>

      <ConfigureConjureActions
        class="flex md:hidden mt-6"
        :summoned-items="summonedItems.length > 0"
        :conjuration-id="
          summonedItems.length > 0 ? summonedItems[0].id : undefined
        "
      />
    </div>
  </div>
</template>
