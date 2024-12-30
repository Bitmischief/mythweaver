<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConjurationPrimaryImage } from '@/modules/conjurations/composables/useConjurationPrimaryImage';

const props = defineProps<{
  items: any[];
  command: (item: any) => void;
}>();

const { getPrimaryImage } = useConjurationPrimaryImage();

const selectedIndex = ref(0);

watch(props.items, () => {
  selectedIndex.value = 0;
});

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    upHandler();
    return true;
  }

  if (event.key === 'ArrowDown') {
    downHandler();
    return true;
  }

  if (event.key === 'Enter') {
    enterHandler();
    return true;
  }

  return false;
};

defineExpose({ onKeyDown });

function upHandler() {
  selectedIndex.value =
    (selectedIndex.value + props.items.length - 1) % props.items.length;
}

function downHandler() {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
}

function enterHandler() {
  selectItem(selectedIndex.value);
}

function selectItem(index: number) {
  const item = props.items[index];

  if (item) {
    props.command({ id: item.id, label: item.name });
  }
}
</script>

<template>
  <div class="dropdown-menu">
    <template v-if="items.length">
      <button
        v-for="(item, index) in items"
        :key="index"
        :class="{ 'is-selected': index === selectedIndex }"
        @click="selectItem(index)"
      >
        <div class="flex items-center gap-2">
          <div class="flex-shrink-0">
            <img
              :src="getPrimaryImage(item).uri"
              :alt="item.name"
              class="w-10 h-10 rounded-lg"
            />
          </div>
          <div class="flex-grow">{{ item.name }}</div>
        </div>
      </button>
    </template>
    <div class="item" v-else>No result</div>
  </div>
</template>

<style>
@tailwind components;
@layer components {
  .dropdown-menu {
    @apply bg-surface-2 border border-surface-3 rounded-lg shadow-sm flex flex-col gap-1 p-2 overflow-auto relative text-neutral-300;

    button {
      @apply items-center bg-transparent flex gap-1 text-left w-full p-1 my-0.5 rounded;

      &:hover,
      &:hover.is-selected {
        @apply bg-fuchsia-500/25;
      }

      &.is-selected {
        @apply bg-fuchsia-500/25;
      }
    }
  }
}
</style>
