<template>
  <div class="p-4">
    <div class="mb-4 flex justify-between">
      <router-link to="/sessions/list">
        <div class="text-2xl">Sessions</div>
      </router-link>

      <router-link to="/sessions/create">
        <button
          class="text-md gradient-border-focused flex cursor-pointer rounded bg-black px-4 py-1 text-white hover:bg-gray-600"
        >
          <span class="self-center"> Add New Session </span>
        </button>
      </router-link>
    </div>

    <router-view></router-view>
  </div>
</template>
<script setup lang="ts"></script>
