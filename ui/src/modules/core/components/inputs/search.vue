<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search } from 'lucide-vue-next';

const model = defineModel<string>();

const searchText = ref(model.value);

watch(model, (value) => {
  searchText.value = value;
});

const update = () => {
  model.value = searchText.value;
};
</script>

<template>
  <div class="flex grow">
    <InputText
      v-model="searchText"
      type="text"
      name="search"
      placeholder="Search names & tags"
      class="grow rounded-r-none"
      @keydown.enter="update"
    />
    <button
      class="button-gradient rounded-tl-none rounded-bl-none"
      @click="update"
    >
      <Search class="h-5 w-5" />
    </button>
  </div>
</template>
