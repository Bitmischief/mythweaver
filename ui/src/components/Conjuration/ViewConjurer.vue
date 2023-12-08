<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { getConjurer, Conjurer } from '@/api/generators.ts';
import { useRoute } from 'vue-router';
import SummoningLoader from '@/components/Conjuration/ConjuringLoader.vue';
import ConfigureConjure from '@/components/Conjuration/ViewConjurer/ConfigureConjure.vue';
import CustomizeConjuration from '@/components/Conjuration/ViewConjuration/CustomizeConjuration.vue';
import ConfigureConjureActions from '@/components/Conjuration/ViewConjurer/ConfigureConjureActions.vue';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { pusher, ServerEvent } from '@/lib/serverEvents.ts';
import { showError } from '@/lib/notifications.ts';

const route = useRoute();
const userId = useCurrentUserId();

const summoner = ref<Conjurer | undefined>(undefined);

const generating = ref(false);
const animationDone = ref(false);

const conjurationRequestId = ref<number | undefined>(undefined);

const createdConjuration = ref<any>(undefined);
const conjuration = computed(() => {
  if (!createdConjuration.value) return undefined;

  return {
    ...createdConjuration.value,
    saved: true,
    published: true,
  };
});
const conjurationId = computed(() => conjuration.value?.id);

onMounted(async () => {
  const getGeneratorResponse = await getConjurer(
    route.params.summonerCode.toString(),
  );
  summoner.value = getGeneratorResponse.data;
});

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  animationDone.value = false;
  generating.value = true;

  document.getElementById('conjuration')?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });

  conjurationRequestId.value = data.conjurationRequestId;

  if (!userId.value) {
    throw new Error('No userId to bind server events to!');
  }

  const channel = pusher.subscribe(userId.value.toString());
  channel.bind(ServerEvent.ConjurationCreated, function (data: any) {
    generating.value = false;
    createdConjuration.value = data;
  });

  channel.bind(ServerEvent.ConjurationError, function () {
    generating.value = false;
    showError({
      message:
        'There was a server error creating your conjuration. Reach out to support for help resolving this issue.',
    });
  });

  channel.bind(ServerEvent.ImageCreated, function (data: any) {
    createdConjuration.value.imageUri = data.uri;
  });

  channel.bind(ServerEvent.ImageError, function () {
    showError({
      message:
        'There was a server error creating your image. Reach out to support for help resolving this issue.',
    });
  });
}
</script>

<template>
  <div v-if="summoner" class="relative flex">
    <div class="z-10 h-full w-full rounded-xl p-4">
      <ConfigureConjureActions
        class=""
        :summoned-items="!!conjuration"
        :conjuration-id="conjurationId"
      />

      <div class="block 3xl:flex">
        <div
          class="bg-surface-2 w-full 3xl:w-[25rem] h-full md:p-8 p-4 rounded-md"
        >
          <ConfigureConjure
            :summoner="summoner"
            @begin-conjuring="handleBeginConjuring"
          />
        </div>

        <ConfigureConjureActions
          class="flex 3xl:hidden mt-6"
          :summoned-items="!!conjuration"
          :conjuration-id="conjurationId"
        />

        <div
          id="conjuration"
          class="mt-8 3xl:mt-0 3xl:ml-8 bg-surface-2 w-full rounded-md"
        >
          <div
            v-if="!generating && !conjuration"
            class="flex min-h-[20rem] justify-center h-full"
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
        class="flex 3xl:hidden mt-6"
        :summoned-items="!!conjuration"
        :conjuration-id="conjurationId"
      />
    </div>
  </div>
</template>
