<script setup lang="ts">
import { useConjurationStore } from '../../store/conjuration.store';
import ConjurationPrimaryImage from '../core/conjurationPrimaryImage.vue';
import TipTapEditor from '@/modules/core/components/tipTapEditor.vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const { conjuration } = storeToRefs(useConjurationStore());

const back = () => {
  router.push({
    path: route.query.from ? (route.query.from as string) : '/conjurations',
  });
};
</script>

<template>
  <div>
    <div class="w-full flex mb-2">
      <div>
        <Button class="button-primary" @click="back">Back</Button>
      </div>
    </div>
    <div v-if="conjuration" class="flex">
      <div
        class="lg:min-w-[25rem] lg:w-[25rem] 3xl:min-w-[35rem] 3xl:w-[35rem] shrink rounded-md md:mr-6"
      >
        <div class="text-2xl font-bold">
          {{ conjuration.name }}
        </div>
        <div>
          <ConjurationPrimaryImage
            v-if="conjuration"
            :conjuration="conjuration"
          />
        </div>
      </div>
      <div class="grow min-w-0 mt-4 lg:mt-0 lg:ml-4 relative">
        <TipTapEditor />
      </div>
    </div>
  </div>
</template>
