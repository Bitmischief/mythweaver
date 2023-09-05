<script setup lang="ts">
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/store";
import { ref } from "vue";
import Modal from "@/components/Modal.vue";
const authStore = useAuthStore();

const showEarlyAccessModal = ref(false);

const callback = async (googleResponse: any) => {
  const result = await authStore.login(googleResponse.credential);

  if (!result) {
    showEarlyAccessModal.value = true;
  }
};
</script>

<template>
  <div class="flex justify-center">
    <div>
      <img src="/images/logo-horizontal.svg" class="mx-auto h-32 w-auto" />

      <div class="gradient-border-focused mb-8 rounded-xl p-5 md:my-16">
        <div class="text-center text-3xl font-bold">Early Access Only</div>
        <div class="mt-2 text-center text-xl">
          Only those with early access can currently use MythWeaver.
        </div>
        <div
          class="mt-2 cursor-pointer text-center text-xl text-purple-300 underline"
          @click="showEarlyAccessModal = true"
        >
          Apply for Early Access Now!
        </div>
      </div>

      <div class="flex justify-center">
        <div class="w-[13.25rem]">
          <div class="flex justify-center">
            <GoogleLogin
              :callback="callback"
              class="w-full"
              prompt
              auto-login
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <Modal
    :show="showEarlyAccessModal"
    title="Get Early Access Now!"
    bg-image="/images/dragon-bg.png"
    :bg-opacity="0.25"
    @close="showEarlyAccessModal = false"
  >
    <div class="flex flex-col items-center md:h-[40rem]">
      <div class="flex h-full flex-col justify-center">
        <div class="text-center text-4xl text-gray-200 md:text-6xl">
          Early access is currently invite only
          <!--          <span class="font-bold text-purple-500 underline">OPEN NOW</span>-->
        </div>

        <div
          class="mt-8 px-4 text-center text-2xl text-gray-200 md:px-16 md:text-4xl"
        >
          But we are opening up early access to mailing list subscribers soon!
          Join our mailing list for more info!
        </div>

        <div
          class="mt-12 flex justify-center text-xl text-gray-200 md:text-3xl"
        >
          <div>
            #1 Join our mailing list
            <a
              href="https://mythweaver.co/#mailing"
              class="ml-2 text-indigo-500"
              >here</a
            >
          </div>
        </div>
      </div>
    </div>

    <!--        <div class="mt-12 flex justify-center">-->
    <!--          <ol type="1" class="text-xl text-gray-200 md:text-3xl">-->
    <!--            <li>-->
    <!--              #1 Join our mailing list-->
    <!--              <a href="https://mythweaver.co/#mailing" class="text-indigo-500"-->
    <!--                >here</a-->
    <!--              >-->
    <!--            </li>-->
    <!--            <li class="mt-1">-->
    <!--              #2 Join our Discord server-->
    <!--              <a href="https://mythweaver.co/#mailing" class="text-indigo-500"-->
    <!--                >here</a-->
    <!--              >-->
    <!--            </li>-->
    <!--          </ol>-->
    <!--        </div>-->
  </Modal>
</template>
