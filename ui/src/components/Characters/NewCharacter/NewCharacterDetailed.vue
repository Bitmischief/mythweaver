<script setup lang="ts">
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/solid';

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

    <NewCharacterField
      :value="value.looks"
      class="mt-8"
      title="Looks"
      :character="value"
      required
      placeholder="Describe your characters looks"
      :length="500"
    />

    <div class="flex justify-between mt-8">
      <button class="button-ghost-primary mb-4 flex" @click="emit('back')">
        <ArrowLeftIcon class="w-4 mr-1 self-center" />
        Back
      </button>
      <div>
        <!-- prettier-ignore -->
        <FormKit
          type="submit"
          label="Next"
          input-class="$reset button-ghost flex"
          :disabled="(disabled as boolean)"
        >
          <template #suffixIcon>
            <ArrowRightIcon class="w-4 ml-1 self-center" />
          </template>
        </FormKit>
      </div>
    </div>
  </FormKit>
</template>
