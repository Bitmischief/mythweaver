<template>
  <TransitionRoot as="template" :show="show" v-bind="$attrs">
    <Dialog as="div" class="relative" @close="emit('close')">
      <TransitionChild
        as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex justify-center w-full p-4 text-center">
          <TransitionChild
            as="template" enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel
              class="w-[72rem] relative rounded-lg text-left overflow-hidden shadow-xl transform transition-all bg-gray-600">
              <div class="px-4 pt-4 md:pt-6 pb-6">
                <div class="flex justify-between items-center">
                  <DialogTitle v-if="title" as="h3" class="text-xl text-[#fff]/[0.87] font-bold">
                    {{ title }}
                  </DialogTitle>
                  <slot v-else name="title"></slot>
                  <XMarkIcon class="w-6 h-6 cursor-pointer text-[#fff]/[0.7]" @click="emit('close')" />
                </div>
                <slot></slot>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { XMarkIcon } from "@heroicons/vue/24/outline"
import { defineEmits } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';

defineProps({
  title: {
    type: String,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);
</script>
