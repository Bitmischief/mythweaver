<script setup lang="ts">
const navItems = [
  {
    name: "Characters",
    path: "/characters",
  },
];
</script>

<template>
  <router-link
    v-for="navItem in navItems"
    :key="navItem.name"
    class="text-lg text-gray-300"
    :to="navItem.path"
  >
    {{ navItem.name }}
  </router-link>
</template>

<style scoped></style>
