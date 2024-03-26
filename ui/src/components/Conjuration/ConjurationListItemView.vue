<script setup lang="ts">
import { Conjuration, saveConjuration } from '@/api/conjurations.ts';
import { useRouter, useRoute } from 'vue-router';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/20/solid';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/vue/24/outline';
import { PlusIcon } from '@heroicons/vue/24/solid';
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
</script>

<template>
  <div v-if="conjuration">
    <div
      class="h-full flex cursor-pointer rounded-[20px] shadow-xl bg-surface-2"
      :class="{
        'flex-row': condensedView,
        'flex-col justify-end': !condensedView,
      }"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div
        class="relative m-2 grow"
        :class="{
          'basis-1/3 my-auto': condensedView,
          'basis-1': !condensedView,
        }"
      >
        <img
          v-if="conjuration.imageUri"
          :src="conjuration.imageUri"
          :alt="conjuration.name"
          class="rounded-[16px] pointer-events-none"
        />
        <div v-else class="w-full flex justify-center h-full bg-gray-900/75">
          <div
            class="self-center text-center text-[2rem] text-white animate-pulse"
          >
            Conjuring image...
          </div>
        </div>
        <div
          class="absolute flex justify-center items-center rounded-full bg-white/50 group text-black text-xs font-bold"
          :class="{
            'left-0 top-0 h-4 px-2': condensedView,
            'left-2 top-2 h-6 px-4': !condensedView,
          }"
        >
          {{ conjurationType(conjuration) }}
        </div>
        <div
          v-if="showBookmarkIcon"
          class="absolute text-white/75 group"
          :class="{
            'right-0 top-0 h-4': condensedView,
            'right-2 top-2 h-6': !condensedView,
          }"
        >
          <div class="relative">
            <BookmarkIconSolid v-if="conjuration.saved" class="w-5 h-5" />
            <BookmarkIconOutline v-else class="w-5 h-5" />
            <div
              class="absolute bottom-[105%] right-0 whitespace-nowrap invisible group-hover:visible text-neutral-300 bg-surface-2 rounded-full px-2 py-1"
            >
              <span v-if="conjuration.saved">In My Conjurations</span>
              <span v-else>Not in My Conjurations</span>
            </div>
          </div>
        </div>
        <div
          v-if="showSaves"
          class="group absolute"
          :class="{
            'cursor-default': conjuration.saved,
            'right-0 -top-1 w-5': condensedView,
            'right-0 top-0 h-6': !condensedView,
          }"
          @click.stop="addConjuration"
        >
          <div class="flex justify-center items-center text-xs font-bold">
            <div class="relative">
              <BookmarkIconSolid
                v-if="conjuration.saved"
                class="h-8 w-8 text-fuchsia-500"
              />
              <BookmarkIconSolid
                v-else
                class="h-8 w-8 text-white/50 group-hover:text-white/75"
              />
              <div
                class="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
                :class="{
                  'text-black group-hover:rotate-180 transition-transform':
                    !conjuration.saved,
                }"
              >
                <div
                  class="block"
                  :class="{ 'group-hover:hidden': !conjuration.saved }"
                >
                  {{ conjuration.saves > 99 ? '99+' : conjuration.saves }}
                </div>
                <div
                  class="hidden"
                  :class="{ 'group-hover:block': !conjuration.saved }"
                >
                  <PlusIcon class="h-4 w-4 stroke-black" />
                </div>
              </div>
            </div>
          </div>
          <div
            class="absolute bottom-[98%] text-sm font-bold text-center invisible min-w-[200px] overflow-visible group-hover:visible text-neutral-300 bg-surface-3 rounded-[12px] px-2 py-1 z-20"
            :class="{ 'right-0': !condensedView, 'left-0': condensedView }"
          >
            <span
              >{{ conjuration.saves }}
              {{
                conjuration.saves === 1 ? 'adventurer has' : 'adventurers have'
              }}
              added this to their conjurations</span
            >
            <span v-if="!conjuration.saved" class="text-sm text-neutral-500">
              (click to add)
            </span>
          </div>
        </div>
      </div>

      <div
        class="flex justify-between px-3 pb-2"
        :class="{
          'basis-1': !condensedView,
          'basis-2/3 pt-2 overflow-hidden': condensedView,
        }"
      >
        <div class="max-w-[100%]">
          <div class="relative text-md truncate">
            {{ conjuration.name }}
          </div>
          <div class="text-sm text-neutral-500 truncate-2-line">
            {{ getConjurationDescription(conjuration) }}
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
