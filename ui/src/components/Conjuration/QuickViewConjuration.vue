<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed } from 'vue';

defineEmits(['close']);

const router = useRouter();
const props = defineProps<{
  conjuration: any;
}>();

async function gotoConjuration() {
  await router.push(`/conjurations/view/${props.conjuration.id}`);
}

const dataArray = computed(() => {
  if (!props.conjuration) {
    return [];
  }

  return Object.keys(props.conjuration.data).map((key) => {
    return {
      key,
      value: props.conjuration.data[key],
    };
  });
});

function normalizeKeyName(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}
</script>

<template>
  <div class="flex justify-end mb-4">
    <button class="button-ghost" @click="gotoConjuration">
      View Full Conjuration
    </button>
    <button class="button-primary ml-2" @click="$emit('close')">Close</button>
  </div>
  <div class="flex">
    <div>
      <img :src="conjuration.imageUri" class="max-w-[500px] rounded-[12px]" />
      <div class="text-xl text-center">
        {{ conjuration.name }}
      </div>
    </div>
    <div class="grow">
      <div class="w-full mt-4 md:mt-0 md:ml-4">
        <div
          v-for="(data, i) in dataArray"
          :key="`data-${i}`"
          :class="{ 'mb-8': i !== dataArray.length - 1 }"
          class="bg-surface-2 rounded-[12px]"
        >
          <div class="mb-1 text-lg text-white pt-3 px-3">
            {{ normalizeKeyName(data.key) }}
          </div>
          <FormKit
            v-model="data.value"
            type="textarea"
            inner-class="border-none"
            input-class="$reset input-primary border-none dark:text-neutral-400 focus:ring-fuchsia-500 pointer-events-none"
            auto-height
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
