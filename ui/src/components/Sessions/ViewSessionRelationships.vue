<script setup lang="ts">
import { computed } from 'vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { useRoute } from 'vue-router';
import ViewRelationships from '@/components/Relationships/ViewRelationships.vue';

const route = useRoute();
const sessionId = computed(() => parseInt(route.params.sessionId.toString()));
</script>

<template>
  <ViewRelationships
    :start-node-id="sessionId"
    :start-node-type="ConjurationRelationshipType.SESSION"
    class="overflow-visible"
  />
</template>

<style scoped></style>
