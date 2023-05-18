<script setup lang="ts">
const navItems = [
  {
    name: 'Characters',
    path: '/characters',
  },
];
</script>

<template>
  <router-link v-for="navItem in navItems" class="text-gray-300 text-lg" :to="navItem.path">
    {{navItem.name}}
  </router-link>
</template>

<style scoped>

</style>
