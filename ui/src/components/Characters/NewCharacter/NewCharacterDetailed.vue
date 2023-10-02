<script setup lang="ts">
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';

const props = defineProps<{
  modelValue: Character;
}>();

const emit = defineEmits(['update:modelValue', 'complete', 'back']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

function submit(payload: any) {
  value.value = {
    ...value.value,
    ...payload,
  };
  emit('complete');
}
</script>

<template>
  <FormKit v-slot="{ disabled }" :actions="false" type="form" @submit="submit">
    <NewCharacterField
      :value="value.backstory"
      class="mt-8"
      title="Backstory"
      :character="value"
      property-override="background"
      required
      placeholder="Enter your character's backstory"
    />

    <NewCharacterField
      :value="value.personality"
      class="mt-8"
      title="Personality"
      :character="value"
      required
      placeholder="Enter your character's personality"
    />

    <div class="flex">
      <button
        class="bg-neutral-800 mr-2 mb-4 rounded-md py-2 px-4"
        @click="emit('back')"
      >
        Back
      </button>
      <FormKit type="submit" :disabled="disabled as boolean" label="Continue" />
    </div>
  </FormKit>
</template>
