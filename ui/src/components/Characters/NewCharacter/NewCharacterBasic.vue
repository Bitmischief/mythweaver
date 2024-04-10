<script lang="ts" setup>
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/solid';

export interface _props {
  modelValue: Character;
  showBack?: boolean;
  backText?: string;
}
const props = withDefaults(defineProps<_props>(), {
  showBack: false,
  backText: 'Back',
});

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
    <div class="mt-8 mb-6">
      <NewCharacterField
        required
        :character="value"
        :value="value.name"
        title="Name"
        type="input"
        placeholder="Enter your character's name"
      />
      <div class="flex justify-between">
        <div class="text-sm text-neutral-400 px-1">Age</div>
      </div>
      <FormKit
        v-model="value.age"
        type="number"
        number
        name="age"
        validation="required|number"
        class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
        placeholder="Enter your character's age"
      />
      <div class="flex justify-between">
        <div class="text-sm text-neutral-400 px-1">Race</div>
      </div>
      <FormKit
        v-model="value.race"
        type="text"
        name="race"
        validation="required"
        class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
        placeholder="Enter your character's race"
      />

      <div class="flex justify-between mt-2">
        <div class="text-sm text-neutral-400 px-1">Class</div>
      </div>
      <FormKit
        v-model="value.class"
        type="text"
        name="class"
        validation="required"
        class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
        placeholder="Enter your character's class"
      />
    </div>
    <div class="flex justify-between">
      <button
        v-if="showBack"
        class="button-ghost-primary mb-4 flex"
        @click="emit('back')"
      >
        <ArrowLeftIcon class="w-4 mr-1 self-center" />
        {{ backText }}
      </button>
      <div>
        <FormKit
          type="submit"
          label="Save And Continue"
          input-class="$reset button-ghost flex"
          :disabled="disabled as boolean"
        >
          <template #suffixIcon>
            <ArrowRightIcon class="w-4 ml-1 self-center" />
          </template>
        </FormKit>
      </div>
    </div>
  </FormKit>
</template>
