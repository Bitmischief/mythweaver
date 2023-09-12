<script lang="ts" setup>
import { SessionBase } from '@/api/sessions.ts';
import { format, parseISO } from 'date-fns';
import { computed } from 'vue';

const props = defineProps<{
  session: SessionBase;
}>();

const whenString = computed(() => format(parseISO(props.session.when), 'PP'));
const whenTimeString = computed(() =>
  format(parseISO(props.session.when), 'p'),
);
</script>

<template>
  <div
    class="w-[150px] md:w-[400px] transition-all ease-in-out hover:scale-[105%]"
  >
    <div class="bg-neutral-900 rounded-[10px]">
      <div
        class="relative rounded-tl-[10px] rounded-tr-[10px] bg-neutral-600 flex justify-center"
      >
        <div class="absolute top-2 right-2">
          <div
            v-if="session.status === 1"
            class="bg-fuchsia-500 rounded-xl py-1 px-3 text-sm"
          >
            upcoming
          </div>
          <div
            v-if="session.status === 2"
            class="bg-green-500 rounded-xl py-1 px-3 text-sm"
          >
            completed
          </div>
        </div>
        <img
          :src="session.imageUri || '/images/session_bg_square.png'"
          class="md:w-[400px] md:h-[400px] object-cover rounded-t-[10px]"
        />
      </div>

      <div
        class="p-3 w-full flex-col justify-start items-start gap-2.5 inline-flex"
      >
        <div class="w-full">
          <div class="text-white text-lg font-semibold flex-wrap">
            {{ session.name ? session.name : whenString }}
          </div>
        </div>
        <div class="justify-start items-center gap-3 inline-flex">
          <div
            class="opacity-70 text-gray-200 text-sm font-normal leading-relaxed"
          >
            {{ session.status === 2 ? whenString : whenTimeString }}
          </div>
        </div>
        <div
          class="w-full overflow-hidden text-neutral-500 text-sm font-normal leading-relaxed"
        >
          <p class="truncate">
            {{
              session.status === 2
                ? session.summary
                : session.description || 'No description provided'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
