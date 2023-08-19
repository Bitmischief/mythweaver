<script lang="ts" setup>
import { SessionBase } from "@/api/sessions.ts";
import { format, parseISO } from "date-fns";
import { computed } from "vue";

const props = defineProps<{
  session: SessionBase;
}>();

const whenString = computed(() => format(parseISO(props.session.when), "PP"));
const whenTimeString = computed(() =>
  format(parseISO(props.session.when), "p")
);
</script>

<template>
  <div class="rounded-xl bg-gray-800 p-3">
    <div class="w-full text-center text-xl">
      {{ whenString }}
    </div>
    <div class="text-md w-full text-center text-gray-400">
      {{ whenTimeString }}
    </div>

    <div class="mt-4 text-center text-sm text-gray-400">
      {{ props.session.description || "No description provided" }}
    </div>
  </div>
</template>
