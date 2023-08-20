<script lang="ts" setup>
import { Conjuration, patchConjuration } from "@/api/conjurations.ts";
import { showSuccess } from "@/lib/notifications.ts";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useCurrentUserId } from "@/lib/hooks.ts";
import { useEventBus } from "@/lib/events.ts";
import { Tab } from "@headlessui/vue";

const props = defineProps<{
  conjuration: Conjuration;
}>();

const eventBus = useEventBus();
const currentUserId = useCurrentUserId();

const userOwnsConjuration = computed(() => {
  return props.conjuration?.userId === currentUserId.value;
});

const dataArray = computed(() => {
  if (!props.conjuration) {
    return [];
  }

  return Object.keys(props.conjuration.data).map((key) => {
    return {
      key,
      value: props.conjuration.data[key],
    };
  });
});

const editDataKey = ref<string | undefined>(undefined);

onMounted(() => {
  eventBus.$on("conjuration-save-info", async () => {
    if (editDataKey.value) {
      editDataKey.value = undefined;
      await saveData();
    }
  });
});

onUnmounted(() => {
  eventBus.$off("conjuration-save-info");
});

function enableEdit(key: string, event: MouseEvent) {
  if (!userOwnsConjuration.value) return;

  editDataKey.value = key;
  event.stopPropagation();
}

async function saveData() {
  if (!props.conjuration) return;

  const data = Object.fromEntries(dataArray.value.map((x) => [x.key, x.value]));
  await patchConjuration(props.conjuration.id, { data });

  showSuccess({ message: "Updated conjuration!" });
}

function textareaGrow(e: any) {
  e.target.style.height = "5px";
  e.target.style.height =
    Math.max(e.target.style.minHeight, e.target.scrollHeight) + "px";
}
</script>

<template>
  <div v-for="(data, i) in dataArray" :key="`data-${i}`">
    <div class="mt-8 text-2xl">
      {{ data.key }}
    </div>
    <div
      v-show="editDataKey !== data.key"
      class="mt-2 cursor-pointer whitespace-pre-wrap text-lg text-gray-400"
      @click="enableEdit(data.key, $event)"
    >
      {{ data.value }}
    </div>
    <textarea
      v-show="editDataKey === data.key"
      v-model="data.value"
      class="min-h-[20rem] w-full overflow-hidden rounded-xl border border-green-500 bg-surface p-3 text-lg shadow-lg"
      @click="$event.stopPropagation()"
      @blur="saveData"
      @input="textareaGrow"
    />
  </div>
</template>
