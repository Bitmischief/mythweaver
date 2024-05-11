<script setup lang="ts">
import { Conjuration, saveConjuration } from '@/api/conjurations.ts';
import { useRouter, useRoute } from 'vue-router';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/20/solid';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/vue/24/outline';
import { PlusIcon, ArrowRightIcon } from '@heroicons/vue/24/solid';
import { computed, ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';

const props = defineProps<{
  data: Conjuration | undefined;
  skeleton?: boolean;
  showSaves?: boolean;
  condensedView?: boolean;
}>();

const conjuration = ref(props.data);
const router = useRouter();
const route = useRoute();

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}

function getConjurationDescription(conjuration: Conjuration) {
  let text = '';
  if (conjuration.conjurerCode === 'characters') {
    text = conjuration.data.background;
  } else if (conjuration.conjurerCode === 'locations') {
    text = conjuration.data.history;
  } else if (conjuration.conjurerCode === 'monsters') {
    text = conjuration.data.description;
  } else if (conjuration.conjurerCode === 'items') {
    text = conjuration.data.description;
  }
  return text;
}

function conjurationType(conjuration: Conjuration) {
  if (conjuration.conjurerCode === 'monsters') {
    return 'Monster';
  } else if (conjuration.conjurerCode === 'locations') {
    return 'Location';
  } else if (conjuration.conjurerCode === 'characters') {
    return 'NPC';
  } else if (conjuration.conjurerCode === 'items') {
    return 'Magic Item';
  } else {
    return '';
  }
}

const showBookmarkIcon = computed(() => {
  return route.hash === '#history';
});

async function addConjuration() {
  if (conjuration.value && !conjuration.value.saved) {
    try {
      await saveConjuration(conjuration.value.id);
      showSuccess({ message: 'Successfully saved conjuration!' });
      conjuration.value.saves += 1;
      conjuration.value.saved = true;
    } catch (e) {
      showError({
        message: 'Something went wrong saving conjuration. Please try again.',
      });
    }
  }
}

const primaryImageUri = computed(() => {
  if (conjuration.value?.images?.length) {
    return conjuration.value.images.find((i) => i.primary).uri;
  }
  switch (conjuration.value?.conjurerCode) {
    case 'characters':
      return '/images/conjurations/character-no-image.png';
    case 'locations':
      return '/images/conjurations/location-no-image.png';
    case 'monsters':
      return '/images/conjurations/monster-no-image.png';
    case 'items':
      return '/images/conjurations/item-no-image.png';
    default:
      return '';
  }
});
</script>

<template>
  <div v-if="conjuration">
    <div
      class="h-full flex cursor-pointer rounded-[20px] shadow-xl bg-surface-2 group relative"
      :class="{
        'flex-row py-2': condensedView,
        'flex-col justify-end': !condensedView,
      }"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div
        class="relative m-2 grow group-hover:mx-6 transition-all"
        :class="{
          'basis-1/3 my-auto': condensedView,
          'basis-1': !condensedView,
        }"
      >
        <img
          v-if="primaryImageUri"
          :src="primaryImageUri"
          :alt="conjuration.name"
          class="rounded-[16px] pointer-events-none"
          :class="{ 'blur-sm': !conjuration.images?.length }"
        />
        <div v-else class="w-full flex justify-center h-full bg-gray-900/75">
          <div
            class="self-center text-center text-[2rem] text-white animate-pulse"
          >
            Conjuring image...
          </div>
        </div>
        <div
          class="absolute flex justify-center items-center rounded-full bg-white/50 text-black text-xs font-bold"
          :class="{
            'left-1 top-1 h-4 px-2': condensedView,
            'left-2 top-2 h-6 px-4': !condensedView,
          }"
        >
          {{ conjurationType(conjuration) }}
        </div>
        <div
          v-if="showBookmarkIcon"
          class="absolute text-white/75 group/bookmark"
          :class="{
            'right-0 top-0 h-4': condensedView,
            'right-2 top-2 h-6': !condensedView,
          }"
        >
          <div class="relative">
            <BookmarkIconSolid v-if="conjuration.saved" class="w-5 h-5" />
            <BookmarkIconOutline v-else class="w-5 h-5" />
            <div
              class="absolute bottom-[105%] right-0 whitespace-nowrap invisible group-hover/bookmark:visible text-neutral-300 bg-surface-2 rounded-full px-2 py-1"
            >
              <span v-if="conjuration.saved">In My Conjurations</span>
              <span v-else>Not in My Conjurations</span>
            </div>
          </div>
        </div>
        <div
          v-if="showSaves"
          class="absolute rounded-[4px]"
          :class="{
            'right-1 top-1 min-w-5': condensedView,
            'right-2 top-2 h-6': !condensedView,
            'bg-white/50': !conjuration.saved,
            'bg-fuchsia-500/90': conjuration.saved,
          }"
          @click.stop="addConjuration"
        >
          <div class="flex h-full justify-center text-xs font-bold">
            <BookmarkIconSolid
              class="min-h-5 min-w-5 self-center"
              :class="{
                'text-neutral-600': !conjuration.saved,
                'text-neutral-200': conjuration.saved,
              }"
            />
            <div
              class="pl-1 pr-2 self-center"
              :class="{
                'text-neutral-800': !conjuration.saved,
                'text-neutral-200': conjuration.saved,
              }"
            >
              {{ conjuration.saves }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex justify-between px-3 pb-2 rounded-[16px] bg-surface-2 group-hover:grow transition-all"
        :class="{
          'basis-1': !condensedView,
          'basis-2/3 pt-2 overflow-hidden': condensedView,
        }"
      >
        <div class="max-w-[100%]">
          <div class="relative text-md truncate">
            {{ conjuration.name }}
          </div>
          <div class="flex flex-wrap max-h-[3.5em] overflow-hidden">
            <div
              v-for="(tag, i) in conjuration.tags"
              :key="`${i}_${conjuration.id}_tag`"
              class="tag"
            >
              {{ tag }}
            </div>
          </div>
        </div>
        <div
          class="bg-surface-2 rounded-[20px] opacity-0 p-3 flex-col absolute bottom-0 right-0 left-0 top-[100px] group-hover:opacity-100 group-hover:flex group-hover:top-0 transition-all"
        >
          <div>
            <div class="truncate text-lg my-2 mr-12">
              {{ conjuration.name }}
            </div>
            <div
              v-if="showSaves"
              class="absolute rounded-[4px] group/bookmark"
              :class="{
                'right-2 top-2 min-w-5': condensedView,
                'right-4 top-4 h-6': !condensedView,
                'bg-white/50 hover:bg-white/60': !conjuration.saved,
                'bg-fuchsia-500/90': conjuration.saved,
              }"
              @click.stop="addConjuration"
            >
              <div class="flex h-full justify-center text-xs font-bold">
                <div class="relative self-center">
                  <BookmarkIconSolid
                    class="min-h-5 min-w-5 self-center"
                    :class="{
                      'text-neutral-200': conjuration.saved,
                      'text-neutral-600 group-hover/bookmark:text-neutral-800':
                        !conjuration.saved,
                    }"
                  />
                  <PlusIcon
                    v-if="!conjuration.saved"
                    class="invisible group-hover/bookmark:visible absolute text-neutral-100 h-2 w-2 bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2"
                  />
                </div>
                <div
                  class="pl-1 pr-2 self-center"
                  :class="{
                    'text-neutral-800': !conjuration.saved,
                    'text-neutral-200': conjuration.saved,
                  }"
                >
                  {{ conjuration.saves }}
                </div>
              </div>
              <div
                class="absolute bottom-[100%] text-sm font-bold text-center invisible min-w-[200px] overflow-visible group-hover/bookmark:visible text-neutral-300 bg-surface-3 rounded-[12px] px-2 py-1 mb-2 z-20"
                :class="{ 'right-0': !condensedView, 'left-0': condensedView }"
              >
                <span
                  >{{ conjuration.saves }}
                  {{
                    conjuration.saves === 1
                      ? 'adventurer has'
                      : 'adventurers have'
                  }}
                  added this to their conjurations</span
                >
                <span
                  v-if="!conjuration.saved"
                  class="text-sm text-neutral-500"
                >
                  (click to add)
                </span>
              </div>
            </div>
          </div>
          <div
            class="relative h-full text-sm text-neutral-400 hidden group-hover:block overflow-hidden shrink overflow-ellipsis"
          >
            {{ getConjurationDescription(conjuration) }}

            <div
              class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-2"
            ></div>
          </div>
          <div class="mt-2">
            <div class="flex text-fuchsia-500">
              View conjuration
              <ArrowRightIcon class="h-5 w-5 ml-2 self-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="skeleton">
    <div
      class="w-full flex justify-center bg-gray-900/75 rounded-xl h-[42rem] md:h-[52rem] 3xl:h-[62rem]"
    >
      <div class="self-center text-center text-[3rem] text-white animate-pulse">
        Conjuring...
      </div>
    </div>
  </div>
</template>
