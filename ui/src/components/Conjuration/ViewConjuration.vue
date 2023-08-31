<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Conjuration, getConjuration } from "@/api/conjurations.ts";
import { useRoute, useRouter } from "vue-router";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue";
import ViewConjurationActions from "@/components/Conjuration/ViewConjuration/ViewConjurationActions.vue";
import ViewConjurationHeader from "@/components/Conjuration/ViewConjuration/ViewConjurationHeader.vue";
import ViewConjurationInfo from "@/components/Conjuration/ViewConjuration/ViewConjurationInfo.vue";
import { useEventBus } from "@/lib/events.ts";
import ViewConjurationRelated from "@/components/Conjuration/ViewConjuration/ViewConjurationRelated.vue";

const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();

const conjuration = ref<Conjuration | null>(null);

const tabs = ref([
  {
    name: "Info",
    highlight: false,
  },
  {
    name: "Related",
    highlight: true,
    highlightColor: "bg-blue-500",
  },
  {
    name: "Quests",
    soon: true,
    disabled: true,
  },
  // {
  //   name: "Inventory",
  //   soon: true,
  // },
]);

const conjurationId = computed(() =>
  parseInt(route.params.conjurationId?.toString()),
);

onMounted(async () => {
  await loadConjuration();
});

watch(conjurationId, async () => {
  await loadConjuration();
});

async function loadConjuration() {
  const response = await getConjuration(conjurationId.value);
  conjuration.value = response.data;

  if (conjuration.value?.copies?.length) {
    await router.push(`/conjurations/view/${conjuration.value.copies[0].id}`);
    await loadConjuration();
  }
}

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  return `background-image: url("${imageUri}");`;
};

function emitSaveInfo() {
  eventBus.$emit("conjuration-save-info", undefined);
}
</script>

<template>
  <div
    v-if="conjuration"
    class="relative h-full w-full rounded-lg bg-contain bg-top"
    :style="backgroundImageInlineStyle(conjuration.imageUri)"
    @click="emitSaveInfo"
  >
    <div
      class="h-full w-full overflow-y-auto bg-gradient-to-b from-surface/95 to-surface p-12"
    >
      <ViewConjurationActions
        :conjuration="conjuration"
        @add-conjuration="loadConjuration"
      />

      <ViewConjurationHeader
        :conjuration="conjuration"
        @tags-changed="loadConjuration"
      />

      <div class="mt-6 block">
        <TabGroup>
          <TabList class="flex w-auto space-x-1 rounded-xl bg-black/25 p-2">
            <Tab
              v-for="tab of tabs"
              :key="`tab-${tab}`"
              v-slot="{ selected }"
              :disabled="tab.disabled"
            >
              <div
                class="relative w-full rounded-lg px-6 py-4 text-xl font-medium leading-5 text-white ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                :class="[
                  selected
                    ? 'bg-gray-800 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                ]"
              >
                <div
                  v-if="!selected && tab.highlight"
                  class="absolute right-1 top-1 h-3 w-3 animate-bounce rounded-full"
                  :class="tab.highlightColor"
                ></div>
                <div
                  v-if="!selected && tab.soon"
                  class="absolute right-1 top-1 rounded-xl bg-purple-500 px-2 text-xs"
                >
                  soon
                </div>
                <span :class="{ 'mr-8': tab.soon }">
                  {{ tab.name }}
                </span>
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ViewConjurationInfo :conjuration="conjuration" />
            </TabPanel>
            <TabPanel>
              <ViewConjurationRelated :conjuration="conjuration" />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  </div>
</template>
