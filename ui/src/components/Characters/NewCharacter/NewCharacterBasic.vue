<script lang="ts" setup>
import { computed } from 'vue';
import { Character } from '@/api/characters.ts';
import NewCharacterField from '@/components/Characters/NewCharacter/NewCharacterField.vue';

const props = defineProps<{
  modelValue: Character;
}>();

const emit = defineEmits(['update:modelValue', 'complete']);

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
  <FormKit type="form" @submit="submit">
    <div class="mt-8">
      <div class="flex justify-between">
        <div class="w-[48%]">
          <NewCharacterField
            required
            :character="value"
            :value="value.name"
            title="Name"
            type="input"
            placeholder="Enter your character's name"
          />
        </div>
        <div class="w-[48%]">
          <div class="flex justify-between mb-1">
            <div class="text-xl self-center">Age</div>
          </div>
          <FormKit
            v-model="value.age"
            type="text"
            name="age"
            validation="required|number"
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
          <FormKit
            v-model="value.race"
            type="text"
            name="race"
            validation="required"
            class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
            placeholder="Enter your character's race"
          />
        </div>
        <div class="w-[48%]">
          <div class="flex justify-between">
            <div class="text-xl">Class</div>
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
      </div>
    </div>
  </FormKit>
</template>
