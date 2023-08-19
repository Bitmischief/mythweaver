<template>
  <TransitionRoot as="template" :show="show" v-bind="$attrs">
    <Dialog as="div" class="relative z-50" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-surface bg-opacity-90 transition-opacity"
        />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex w-full justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative w-[72rem] transform overflow-hidden rounded-lg bg-surface bg-cover bg-center bg-no-repeat text-left shadow-xl transition-all"
              :style="backgroundImageInlineStyle()"
            >
              <div class="z-50 px-4 pb-6 pt-4 md:pt-6">
                <div class="mb-6 flex items-center justify-between">
                  <DialogTitle
                    v-if="title"
                    as="h3"
                    class="text-3xl font-bold text-[#fff]/[0.87]"
                  >
                    {{ title }}
                  </DialogTitle>
                  <slot v-else name="title"></slot>
                  <XMarkIcon
                    class="h-6 w-6 cursor-pointer bg-opacity-75 text-[#fff]/[0.7]"
                    @click="emit('close')"
                  />
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

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  bgImage: {
    type: String,
    default: undefined,
  },
  bgOpacity: {
    type: Number,
    default: 100,
  },
});

const emit = defineEmits(["close"]);

const backgroundImageInlineStyle = (): string => {
  const imageUri = props.bgImage ?? "";

  if (!imageUri) {
    return "";
  }

  return `background-image: url('${imageUri}');`;
};
</script>
