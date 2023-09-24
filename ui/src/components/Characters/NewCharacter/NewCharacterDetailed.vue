<script setup lang="ts">
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';

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
  <NewCharacterField
    v-model="value.background"
    class="mt-8"
    title="Backstory"
    property-override="background"
    placeholder="Enter your character's backstory"
    :generate-property="generateProperty"
    :is-property-generating="isPropertyGenerating"
  />

  <NewCharacterField
    v-model="value.personality"
    class="mt-8"
    title="Personality"
    placeholder="Enter your character's personality"
    :generate-property="generateProperty"
    :is-property-generating="isPropertyGenerating"
  />
</template>
