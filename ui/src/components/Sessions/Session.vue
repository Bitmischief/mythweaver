<script lang="ts" setup>
import { SessionBase } from "@/api/sessions.ts";
import { format, parseISO } from "date-fns";
import { computed } from "vue";

const props = defineProps<{
  session: SessionBase;
}>();

const whenString = computed(() => format(parseISO(props.session.when), "PP"));
</script>

<template>
  <div class="flex rounded-xl bg-gray-800 p-3">
    <div class="w-full text-center text-xl">
      {{ whenString }}
    </div>
  </div>
</template>
