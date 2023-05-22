<template>
  <div class="">
    <div class="mb-4 flex justify-between">
      <div class="text-2xl">Characters</div>
      <router-link
        :to="`/characters/new`"
        class="text-md rounded-xl bg-purple-500 px-2"
      >
        Generate Character
      </router-link>
    </div>

    <router-view></router-view>
  </div>
</template>

<script setup lang="ts"></script>
