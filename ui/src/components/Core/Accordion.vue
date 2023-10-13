<script setup lang="ts">
import { ChevronUpIcon } from '@heroicons/vue/20/solid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

defineProps<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
}>();
</script>

<template>
  <Disclosure v-slot="{ open }">
    <DisclosureButton class="text-white text-lg font-semibold self-center">
      <div class="flex">
        <span>{{ title }}</span>
        <ChevronUpIcon
          :class="open ? 'rotate-180 transform' : ''"
          class="h-5 w-5 self-center ml-2 transition-all duration-300 ease-in-out"
        />
      </div>
    </DisclosureButton>
    <transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-300 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <DisclosurePanel>
        <div v-if="subtitle" class="mt-1 text-left text-sm text-neutral-500">
          {{ subtitle }}
        </div>
        <div class="pt-4">
          <slot></slot>
        </div>
      </DisclosurePanel>
    </transition>
  </Disclosure>
</template>
