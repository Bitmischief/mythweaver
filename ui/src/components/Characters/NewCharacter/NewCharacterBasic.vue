<script lang="ts" setup>
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';

const props = defineProps<{
  modelValue: Character;
  generateProperty: (propertyName: string) => void;
  isPropertyGenerating: (propertyName: string) => boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});
</script>

<template>
  <div class="mt-8">
    <div class="flex justify-between">
      <div class="w-[48%]">
        <NewCharacterField
          v-model="value.name"
          title="Name"
          type="input"
          placeholder="Enter your character's name"
          :generate-property="generateProperty"
          :is-property-generating="isPropertyGenerating"
        />
      </div>
      <div class="w-[48%]">
        <div class="flex justify-between">
          <div class="text-xl">Age</div>
        </div>
        <input
          v-model="value.age"
          class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
          placeholder="Enter your character's age"
        />
      </div>
    </div>
  </div>

  <div class="mt-8">
    <div class="flex justify-between">
      <div class="w-[48%]">
        <div class="flex justify-between">
          <div class="text-xl">Race</div>
        </div>
        <input
          v-model="value.race"
          class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
          placeholder="Enter your character's race"
        />
      </div>
      <div class="w-[48%]">
        <div class="flex justify-between">
          <div class="text-xl">Class</div>
        </div>
        <input
          v-model="value.class"
          class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
          placeholder="Enter your character's class"
        />
      </div>
    </div>
  </div>
</template>
