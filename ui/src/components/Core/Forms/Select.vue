<script setup lang="ts">
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/vue/20/solid/index.js";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { computed } from "vue";

const props = defineProps<{
  modelValue: string | null | undefined;
  options: any[];
  valueProp: string;
  displayProp: string;
  allowNone?: boolean;
  noIcon?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("change", value);
    emit("update:modelValue", value);
  },
});

const allOptions = computed(() => {
  if (props.allowNone) {
    return [
      {
        [props.valueProp]: null,
        [props.displayProp]: "None",
      },
      ...props.options,
    ];
  }

  return props.options;
});
</script>

<template>
  <Listbox v-model="value">
    <div class="relative">
      <ListboxButton
        class="gradient-border-no-opacity relative h-10 w-full cursor-pointer rounded-xl border bg-black px-4 text-left text-white"
      >
        <span class="block truncate"
          >{{
            !value && allowNone
              ? "None"
              : allOptions.find((o) => o[valueProp] === value)
              ? allOptions.find((o) => o[valueProp] === value)[displayProp]
              : ""
          }}
        </span>
        <span
          v-if="!noIcon"
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="gradient-border-no-opacity absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="option in allOptions"
            v-slot="{ active }"
            :key="option[valueProp] || valueProp"
            :value="option[valueProp]"
            as="template"
          >
            <li
              :class="[
                active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                'relative cursor-default select-none py-2',
                !noIcon ? 'pl-10 pr-4' : '',
              ]"
            >
              <span
                :class="[
                  option[valueProp] === value ? 'font-medium' : 'font-normal',
                  'block truncate',
                ]"
                >{{ option[displayProp] }}</span
              >
              <span
                v-if="option[valueProp] === value && !noIcon"
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-300"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
