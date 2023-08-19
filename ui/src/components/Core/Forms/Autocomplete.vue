<script lang="ts" setup>
import { computed, ref } from "vue";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  ComboboxButton,
} from "@headlessui/vue";
import { debounce } from "lodash";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/vue/20/solid";

const props = defineProps<{
  modelValue: string | string[] | null | undefined;
  options: any[];
  valueProp: string;
  displayProp: string;
  allowNone?: boolean;
  noIcon?: boolean;
  multiple?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue", "change", "queryChange"]);

const openButton = ref<HTMLElement | null>(null);
const optionsList = ref(null);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("change", value);
    emit("update:modelValue", value);
  },
});

const emitQueryChange = debounce(async (term) => {
  emit("queryChange", term);
}, 100);

function openOptions() {
  if (!optionsList.value) {
    openButton.value?.click();
  }
}
</script>

<template>
  <Combobox
    v-model="value"
    as="div"
    class="gradient-border-no-opacity relative h-10 w-full cursor-pointer rounded-xl border bg-black text-left text-white"
    :multiple="multiple"
    nullable
  >
    <ComboboxInput
      as="input"
      class="mr-4 h-10 w-full bg-transparent px-4"
      placeholder="Search tags to filter by"
      @change="emitQueryChange($event.target.value)"
      @focus="openOptions"
      @click="openOptions"
    />

    <ComboboxButton
      ref="openButton"
      class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
    >
      <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
    </ComboboxButton>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <ComboboxOptions
        ref="optionsList"
        class="gradient-border-no-opacity absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md px-4 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
      >
        <ComboboxOption
          v-for="option in options"
          :key="option[valueProp] || valueProp"
          v-slot="{ selected }"
          :value="option[valueProp] || option"
          as="template"
        >
          <li class="flex text-lg">
            <CheckIcon
              v-show="selected"
              class="mr-2 h-4 w-4 self-center text-purple-400"
            />
            {{ option[displayProp] || option }}
          </li>
        </ComboboxOption>
        <ComboboxOption v-if="!options.length" :disabled="true">
          No tags exist with that name
        </ComboboxOption>
      </ComboboxOptions>
    </transition>
  </Combobox>
</template>
