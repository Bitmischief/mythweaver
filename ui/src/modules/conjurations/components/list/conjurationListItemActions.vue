<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { Conjuration } from '@/modules/conjurations/types';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import {
  Eye,
  EyeOff,
  PlusCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-vue-next';
import { useConjurationStore } from '@/modules/conjurations/store/conjuration.store';
import { showSuccess, showError } from '@/lib/notifications.ts';

const props = defineProps<{
  conjuration: Conjuration;
}>();

const emit = defineEmits(['togglePreview']);

const conjurationStore = useConjurationStore();
const currentUserId = useCurrentUserId();
const { condensed } = useCondensedView();

const saving = ref(false);
const saved = ref(false);
const preview = ref(false);

const showSave = computed(() => {
  return props.conjuration.userId !== currentUserId.value;
});

function togglePreview() {
  preview.value = !preview.value;
  emit('togglePreview', preview.value);
}

async function addConjuration(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  if (props.conjuration) {
    try {
      saving.value = true;
      await conjurationStore.saveConjuration(props.conjuration.id);
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
</script>

<template>
  <div class="flex gap-2 grow items-end">
    <div v-if="showSave" class="grow items-center">
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
        <ArrowRight class="h-5 w-5 ml-2" />
      </Button>
    </div>
    <div v-if="!condensed" class="items-center">
      <Button
        class="button-secondary hover:bg-purple-500/25 py-1"
        @click.prevent="togglePreview"
      >
        <Eye v-if="!preview" class="h-5 w-5" />
        <EyeOff v-else class="h-5 w-5" />
      </Button>
    </div>
  </div>
</template>
