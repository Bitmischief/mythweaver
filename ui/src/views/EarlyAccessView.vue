<template>
  <ModalAlternate :show="true"
    ><div class="md:w-[499px] lg:w-[599px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="w-full">
        <img
          src="/images/logo-horizontal-2.svg"
          class="mx-auto h-20 w-auto mb-8"
        />

        <div class="text-neutral-300 text-2xl mb-1 text-center">
          Your Trial has Expired
        </div>

        <div class="text-neutral-500 mb-4 text-center">
          Want to continue using MythWeaver? Choose a plan below.
        </div>

        <PricingTable />

        <div class="flex mt-8">
          <button
            class="button-primary whitespace-nowrap text-center bg-neutral-800 rounded-md self-center flex"
            @click="backToLogin"
          >
            <ArrowLeftIcon class="w-5 h-5 mr-1" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>

<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import PricingTable from '@/components/Core/PricingTable.vue';
import { useAuthStore } from '@/store';

const authStore = useAuthStore();

const backToLogin = () => {
  authStore.logout();
};
</script>
