<script setup lang="ts">
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/store";

const props = defineProps<{
  inviteCode?: string | undefined;
}>();

const emit = defineEmits(["login-failed"]);

const authStore = useAuthStore();

const callback = async (googleResponse: any) => {
  const result = await authStore.login(
    googleResponse.credential,
    props.inviteCode,
  );

  if (!result) {
    emit("login-failed");
  }
};
</script>

<template>
  <div class="flex justify-center">
    <div class="w-[13.25rem]">
      <div class="flex justify-center">
        <GoogleLogin :callback="callback" class="w-full" prompt auto-login />
      </div>
    </div>
  </div>
</template>
