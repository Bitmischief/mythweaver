<script setup lang="ts">
import { Conjuration, saveConjuration } from '@/api/conjurations.ts';
import { useRoute } from 'vue-router';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/vue/20/solid';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/vue/24/outline';
import { PlusIcon, ArrowRightIcon } from '@heroicons/vue/24/solid';
import { computed, ref, unref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { mapConjurationType, mapNoImage } from '@/lib/util.ts';
import { useDrag } from 'vue3-dnd';
import { postMoveCollectionConjuration } from '@/api/collections.ts';

const props = defineProps<{
  data: Conjuration | undefined;
  skeleton?: boolean;
  showSaves?: boolean;
  condensedView?: boolean;
  draggable?: boolean;
  collectionId?: number;
  highlightText?: string;
  hideTags?: boolean;
}>();

const [collect, drag] = useDrag(() => ({
  type: 'Conjuration',
  item: () => ({
    id: props.data?.id,
    name: props.data?.name,
    type: 'Conjuration',
    collectionId: props.collectionId,
  }),
  end: async (item, monitor) => {
    const dropResult = monitor.getDropResult<{
      id: number;
      name: string;
      type: string;
    }>();
    if (item && dropResult) {
      if (
        item.type === 'Conjuration' &&
        dropResult.type === 'Collection' &&
        item.id &&
        dropResult.id
      ) {
        if (item.collectionId) {
          await postMoveCollectionConjuration(item.collectionId, item.id, {
            collectionId: dropResult.id,
          });
        }
      }
    }
  },
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
    handlerId: monitor.getHandlerId(),
  }),
}));
const isDragging = computed(() => collect.value.isDragging);
const opacity = computed(() => (unref(isDragging) ? 0.25 : 1));

const conjuration = ref(props.data);
const route = useRoute();

function getConjurationDescription(conjuration: Conjuration) {
  return (
    conjuration?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'backstory',
    )?.data.text ||
    conjuration?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'description',
    )?.data.text ||
    conjuration?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'history',
    )?.data.text ||
    conjuration?.data?.blocks?.find(
      (b: any) => b.data?.label?.toLowerCase() === 'background',
    )?.data.text ||
    conjuration?.data?.blocks[0]?.data.text
  );
}

function conjurationType(conjuration: Conjuration) {
  return mapConjurationType(conjuration.conjurerCode);
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

const primaryImage = computed(() => {
  if (conjuration.value?.images?.length) {
    return conjuration.value.images?.find((i) => i.primary === true);
  } else {
    switch (conjuration.value?.conjurerCode) {
      case 'characters':
        return { uri: '/images/conjurations/character-no-image.png' };
      case 'locations':
        return { uri: '/images/conjurations/location-no-image.png' };
      case 'monsters':
        return { uri: '/images/conjurations/monster-no-image.png' };
      case 'items':
        return { uri: '/images/conjurations/item-no-image.png' };
      default:
        return { uri: '' };
    }
  }
});

const conjurationName = computed(() => {
  if (props.highlightText) {
    return conjuration.value?.name.replace(
      new RegExp(props.highlightText, 'gi'),
      (match) => {
        return '<mark>' + match + '</mark>';
      },
    );
  }
  return conjuration.value?.name;
});
</script>

<template>
  <div
    v-if="conjuration"
    :ref="draggable ? drag : undefined"
    :style="{ opacity }"
    class="h-full"
  >
    <router-link
      class="h-full flex cursor-pointer rounded-[20px] shadow-xl bg-surface-2 group relative"
      :class="{
        'flex-row py-2': condensedView,
        'flex-col justify-end': !condensedView,
        'active:border border-fuchsia-500': draggable,
      }"
      :to="{
        path: `/conjurations/view/${conjuration.id}`,
        query: { from: route.fullPath },
      }"
    >
      <div
        class="relative m-2 group-hover:mx-6 transition-all"
        :class="{
          'basis-1/3 my-auto': condensedView,
          'basis-1': !condensedView,
        }"
      >
        <img
          v-if="primaryImage?.uri"
          :src="primaryImage?.uri"
          :alt="conjuration.name"
          class="rounded-[16px] aspect-square pointer-events-none"
          :class="{ 'blur-sm': !conjuration.images?.length }"
        />
        <div
          v-else-if="primaryImage?.failed"
          class="w-full flex aspect-square justify-center h-full bg-gray-900/75 rounded-[16px]"
        >
          <div class="self-center text-center text-lg">
            Image Conjuration Timed Out
          </div>
        </div>
        <div
          v-else-if="primaryImage?.generating"
          class="w-full flex aspect-square justify-center h-full bg-gray-900/75"
        >
          <div
            class="self-center text-center text-[2rem] gradient-text animate-pulse"
          >
            Conjuring image...
          </div>
        </div>
        <img
          v-else
          :src="mapNoImage(conjuration.conjurerCode)"
          :alt="conjuration.name"
          class="rounded-[16px] aspect-square pointer-events-none"
        />
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
        class="flex grow justify-between px-3 pb-2 rounded-[20px] bg-surface-2 group-hover:grow transition-all"
        :class="{
          'basis-1': !condensedView,
          'basis-2/3 pt-2 overflow-hidden': condensedView,
        }"
      >
        <div class="max-w-[100%]">
          <div
            v-safe-html="conjurationName"
            class="relative text-md truncate"
          ></div>
          <div
            v-if="hideTags !== true"
            class="flex flex-wrap max-h-[3.5em] overflow-hidden"
          >
            <div class="tag bg-white/75 text-black flex group group-hover:pr-2">
              <span class="self-center">
                {{ conjurationType(conjuration) }}
              </span>
            </div>
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
            <div class="truncate text-lg mt-1 mb-2 mr-14">
              {{ conjuration.name }}
            </div>
            <div
              v-if="showBookmarkIcon"
              class="absolute text-white/75 group/bookmark py-1"
              :class="{
                'right-4 top-4 min-w-5': condensedView,
                'right-6 top-4 h-6': !condensedView,
              }"
            >
              <div class="relative">
                <BookmarkIconSolid v-if="conjuration.saved" class="w-5 h-5" />
                <BookmarkIconOutline v-else class="w-5 h-5" />
                <div
                  class="absolute -top-9 -right-6 whitespace-nowrap invisible group-hover/bookmark:visible text-neutral-300 bg-surface-3/75 rounded-full px-2 py-1"
                >
                  <span v-if="conjuration.saved">In My Conjurations</span>
                  <span v-else>Not in My Conjurations</span>
                </div>
              </div>
            </div>
            <div
              v-if="showSaves"
              class="absolute rounded-[4px] group/bookmark"
              :class="{
                'right-2 top-2 min-w-5': condensedView,
                'right-6 top-4 h-6': !condensedView,
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
              <div class="self-center truncate">View conjuration</div>
              <div class="self-center">
                <ArrowRightIcon class="h-5 w-5 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </router-link>
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
