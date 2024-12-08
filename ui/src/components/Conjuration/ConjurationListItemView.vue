<script setup lang="ts">
import { saveConjuration } from '@/modules/conjurations/api';
import { useRoute } from 'vue-router';
import { ArrowRightIcon } from '@heroicons/vue/24/solid';
import { computed, ref, unref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { mapConjurationType, mapNoImage } from '@/lib/util.ts';
import { useDrag } from 'vue3-dnd';
import { postMoveCollectionConjuration } from '@/api/collections.ts';
import { Eye, EyeOff, PlusCircle, CheckCircle } from 'lucide-vue-next';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { Conjuration } from '@/modules/conjurations/types';

const props = defineProps<{
  data: Conjuration | undefined;
  skeleton?: boolean;
  showSaves?: boolean;
  condensedView?: boolean;
  draggable?: boolean;
  collectionId?: number;
  highlightText?: string;
  hideTags?: boolean;
  hasActions?: boolean;
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

const currentUserId = useCurrentUserId();
const preview = ref(false);
const isDragging = computed(() => collect.value.isDragging);
const opacity = computed(() => (unref(isDragging) ? 0.25 : 1));

const conjuration = ref(props.data);
const route = useRoute();
const saved = ref(false);
const saving = ref(false);

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

const showAdd = computed(() => {
  return (
    conjuration.value?.userId !== currentUserId.value &&
    route.hash === '#gallery'
  );
});

async function addConjuration(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  if (conjuration.value) {
    try {
      saving.value = true;
      await saveConjuration(conjuration.value.id);
      showSuccess({ message: 'Conjuration saved!' });
      saved.value = true;
    } catch (e) {
      showError({
        message: 'Something went wrong saving conjuration. Please try again.',
      });
    } finally {
      saving.value = false;
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
    class="h-full relative rounded-[20px] shadow-xl bg-surface-2"
  >
    <slot v-if="hasActions" name="actions" />
    <router-link
      class="h-full flex cursor-pointer group relative"
      :class="{
        'flex-row': condensedView,
        'flex-col justify-end': !condensedView,
        'active:border border-fuchsia-500': draggable,
      }"
      :to="{
        path: `/conjurations/view/${conjuration.id}`,
        query: { from: route.fullPath },
      }"
    >
      <div
        class="relative m-2 transition-all"
        :class="{
          'basis-1/3 my-auto': condensedView,
          'basis-1': !condensedView,
        }"
      >
        <img
          v-if="primaryImage?.uri"
          :src="primaryImage?.uri"
          :alt="conjuration.name"
          class="rounded-[16px] aspect-square pointer-events-none w-full h-full object-cover object-center"
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
      </div>

      <div
        class="flex grow justify-between px-3 pb-2 rounded-[20px] bg-surface-2 group-hover:grow transition-all"
        :class="{
          'basis-1': !condensedView,
          'basis-2/3 pt-2 overflow-hidden': condensedView,
        }"
      >
        <div class="max-w-[100%] grow flex flex-col">
          <div
            v-safe-html="conjurationName"
            class="relative text-md truncate"
          ></div>
          <div
            v-if="hideTags !== true"
            class="flex overflow-y-hidden overflow-x-hidden hover:overflow-x-auto items-center"
            :class="{
              'max-h-[3.5em] flex-wrap': condensedView,
              'max-h-[3em] flex-nowrap': !condensedView,
            }"
          >
            <div class="tag whitespace-nowrap bg-white/75 text-black flex">
              <span class="self-center">
                {{ conjurationType(conjuration) }}
              </span>
            </div>
            <div
              v-for="(tag, i) in conjuration.tags"
              :key="`${i}_${conjuration.id}_tag`"
              class="tag whitespace-nowrap"
            >
              {{ tag }}
            </div>
          </div>
          <div class="flex mt-2 gap-2 grow items-end">
            <div v-if="showAdd" class="grow items-center">
              <Button
                class="button-primary hover:bg-purple-500/25 py-1"
                :disabled="saving || saved"
                @click.prevent="addConjuration"
              >
                <div v-if="saving">
                  <Spinner class="h-4 w-4" />
                </div>
                <div v-else class="flex items-center gap-2">
                  <PlusCircle v-if="!saved" class="h-4 w-4" />
                  <CheckCircle v-else class="h-4 w-4" />
                  {{ saved ? 'Saved' : 'Save' }}
                </div>
              </Button>
            </div>
            <div v-else class="grow items-center">
              <Button class="button-primary hover:bg-purple-500/25 py-1">
                View Conjuration
                <ArrowRightIcon class="h-5 w-5 ml-2" />
              </Button>
            </div>
            <div v-if="!condensedView" class="items-center">
              <Button
                class="button-secondary hover:bg-purple-500/25 py-1"
                @click.prevent="preview = !preview"
              >
                <Eye v-if="!preview" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <div
          class="bg-surface-2 rounded-[20px] flex flex-col absolute bottom-10 right-0 left-0 opacity-100 data-[expanded=false]:top-full data-[expanded=true]:top-0 transition-all"
          :class="{ 'left-[35%]': condensedView }"
          :data-expanded="preview"
        >
          <div
            class="p-3 relative h-full text-sm text-neutral-400 overflow-hidden shrink overflow-ellipsis"
            :class="{
              block: preview,
              hidden: !preview,
            }"
          >
            <div
              class="preview-image"
              :class="{ 'w-[40%]': !condensedView, 'w-0': condensedView }"
            >
              <img :src="primaryImage?.uri" :alt="conjuration.name" />
            </div>
            <div
              class="text-lg text-white mb-1"
              :class="{ 'mr-12': hasActions }"
            >
              {{ conjuration.name }}
            </div>
            {{ getConjurationDescription(conjuration) }}

            <div
              class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-2"
            ></div>
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

<style scoped>
.preview-image img {
  border-radius: 12px;
  margin-right: 10px;
  aspect-ratio: 1/1;
  text-align: center;
  float: left;
  object-fit: cover;
  shape-outside: square();
}
</style>
