<script setup lang="ts">
import { ref } from 'vue';
import {
  deleteConjurationRelationship,
  patchConjurationRelationship,
} from '@/api/relationships.ts';
import { showError, showInfo, showSuccess } from '@/lib/notifications.ts';
import { useRoute, useRouter } from 'vue-router';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { TrashIcon, EllipsisHorizontalIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();

const emit = defineEmits(['deleted']);
const props = defineProps<{
  data: any;
}>();

const relationship = ref(props.data);
const editComment = ref(!relationship.value.comment);

async function clickNode() {
  await router.push({
    path: `/conjurations/view/${relationship.value.entitydata.id}`,
    query: { from: route.fullPath },
  });
}

async function removeRelationship() {
  try {
    await deleteConjurationRelationship(relationship.value.id);
    showSuccess({ message: 'Relationship removed.' });
    emit('deleted');
  } catch (e) {
    showError({
      message:
        'Something went wrong removing the relationship. Please try again.',
    });
  }
}

function noImage() {
  if (relationship.value.entitydata?.conjurerCode) {
    const conjurerCode = relationship.value.entitydata?.conjurerCode;
    if (conjurerCode === 'monsters') {
      return '/images/conjurations/monster-no-image.png';
    } else if (conjurerCode === 'locations') {
      return '/images/conjurations/location-no-image.png';
    } else if (conjurerCode === 'characters') {
      return '/images/conjurations/character-no-image.png';
    } else if (conjurerCode === 'items') {
      return '/images/conjurations/item-no-image.png';
    } else if (conjurerCode === 'players') {
      return '/images/conjurations/player-character-no-image.png';
    } else {
      return '/images/no-image.png';
    }
  } else {
    return null;
  }
}

const updateRelationship = async () => {
  if (!relationship.value.comment) {
    showInfo({ message: 'Please add a relationship.' });
    return;
  }

  try {
    await patchConjurationRelationship(relationship.value.id, {
      comment: relationship.value.comment,
    });
    showSuccess({ message: 'Relationship updated.' });
    editComment.value = false;
  } catch {
    showError({
      message:
        'Something went wrong updating the relationship. Please try again.',
    });
  }
};
</script>

<template>
  <div class="lg:flex min-w-0 gap-2 p-2">
    <div class="flex mb-2 lg:mb-0 self-center">
      <div v-if="editComment" class="flex">
        <div class="self-center">
          <div class="text-xs text-neutral-400">What is the relationship?</div>
          <FormKit
            v-model="relationship.comment"
            type="text"
            placeholder="e.g. 'friends with'"
            outer-class="$reset"
            autofocus
            @keydown.enter="updateRelationship"
          />
        </div>
        <div class="flex flex-col justify-end">
          <button class="button-gradient" @click="updateRelationship">
            Done
          </button>
        </div>
      </div>
      <div
        v-else
        class="text-purple-500 bg-violet-500/25 px-2 py-1 rounded-full cursor-pointer truncate"
        @click="editComment = true"
      >
        {{ relationship.comment }}
      </div>
    </div>
    <div
      class="flex min-w-0 gap-2 hover:bg-violet-800/25 rounded-[12px] px-1 cursor-pointer"
      @click="clickNode"
    >
      <div class="relative self-center">
        <img
          :src="
            relationship.entitydata?.imageUri ||
            noImage ||
            '/images/no-image.png'
          "
          alt="relationship img"
          class="rounded-[10px] aspect-square min-w-16 max-w-16"
        />
        <div
          v-if="!relationship.entitydata?.imageUri && !noImage"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          No Image
        </div>
      </div>
      <div class="text-center self-center min-w-0">
        <div class="mt-1 text-lg truncate">
          {{ relationship.entitydata?.name }}
        </div>
      </div>
    </div>
  </div>
  <div class="mt-2 lg:mt-0 lg:self-center">
    <Menu class="cursor-pointer">
      <div>
        <MenuButton class="button-ghost-primary p-1 mx-4">
          <EllipsisHorizontalIcon class="h-6 w-6 text-neutral-300" />
        </MenuButton>
      </div>

      <MenuItems>
        <div class="absolute right-0 bg-surface-3 z-10 py-2 rounded-[12px]">
          <MenuItem @click.prevent="removeRelationship">
            <div class="menu-item">
              <button
                class="button-text text-red-500 flex gap-2 whitespace-nowrap"
              >
                <span>
                  <TrashIcon class="h-5 w-5" />
                </span>
                Remove Relationship
              </button>
            </div>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  </div>
</template>

<style scoped></style>
