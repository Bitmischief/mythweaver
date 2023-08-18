<script lang="ts" setup>
import { onMounted, ref } from "vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  specialOffer: {
    type: Boolean,
    default: false,
  },
});

const hours = ref(7);
const minutes = ref(53);
const seconds = ref(56);

onMounted(() => {
  setInterval(() => {
    seconds.value--;
    if (seconds.value === 0) {
      seconds.value = 60;
      minutes.value--;
    }
    if (minutes.value === 0) {
      minutes.value = 60;
      hours.value--;
    }
    if (hours.value === 0) {
      hours.value = 24;
    }
  }, 1000);
});
</script>

<template>
  <div class="text-center text-[2.5rem] md:text-[3.5rem]">
    {{ title }}
  </div>

  <div class="mt-6 text-center text-[1.5rem] text-gray-400">
    {{ subtitle }}
  </div>

  <div class="mt-12 rounded-xl bg-black/50 p-8 shadow-xl">
    <div class="text-3xl">
      LAUNCHING SOON <span class="mx-2">|</span> October 15th
    </div>
    <div class="my-5 text-xl text-gray-400">
      Submit your email below to be notified about the launch & get access to
      early access opportunities and more!
    </div>
    <form
      action="https://mythweaver.us12.list-manage.com/subscribe/post"
      method="POST"
    >
      <input type="hidden" name="u" value="e249ab51a54a7c9d1cb18ab49" />
      <input type="hidden" name="id" value="7311346c6b" />

      <div class="block md:flex">
        <div>
          <input
            id="MERGE0"
            type="email"
            autocapitalize="off"
            autocorrect="off"
            name="MERGE0"
            size="25"
            value=""
            class="h-12 w-full rounded-xl px-4 text-2xl text-black md:rounded-r-none"
            placeholder="email@gmail.com"
          />
        </div>
        <button
          type="submit"
          class="mt-2 h-12 w-full rounded-xl bg-green-500 px-2 text-lg font-bold uppercase md:mt-0 md:w-[25rem] md:rounded-l-none md:text-xl"
        >
          Reserve My Launch Invite
        </button>
      </div>
    </form>

    <div v-if="specialOffer" class="mt-6">
      <div class="text-center text-2xl">This special offer ends in</div>
      <div class="flex justify-center">
        <div class="mt-6 flex">
          <div class="flex flex-col items-center">
            <div class="text-5xl font-bold">{{ hours }}</div>
            <div class="text-xl text-gray-400">hours</div>
          </div>
          <div class="mx-4 flex flex-col items-center">
            <div class="text-5xl font-bold">{{ minutes }}</div>
            <div class="text-xl text-gray-400">minutes</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-5xl font-bold">{{ seconds }}</div>
            <div class="text-xl text-gray-400">seconds</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
