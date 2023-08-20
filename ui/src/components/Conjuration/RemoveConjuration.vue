<script setup lang="ts">
import { deleteConjuration } from "@/api/conjurations.ts";
import { useCurrentUserId } from "@/lib/hooks.ts";

const emit = defineEmits(["close", "remove-conjuration"]);

const currentUserId = useCurrentUserId();

var props = defineProps({
  conjuration: {
    type: Object,
    required: true,
  },
});

const isMyConjuration = () =>
  props.conjuration.copies?.length ||
  props.conjuration.userId === currentUserId.value;

async function handleRemoveConjuration() {
  if (isMyConjuration()) {
    var conjurationId = props.conjuration.copies?.length
      ? props.conjuration.copies[0].id
      : props.conjuration.id;

    await deleteConjuration(conjurationId);
    emit("remove-conjuration", conjurationId);
  }
}
</script>

<template>
  <div
    class="fixed z-10"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed inset-0 bg-gray-500 bg-opacity-40"></div>
    <div class="fixed inset-0 overflow-y-auto">
      <div
        class="flex min-h-full flex-col items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="bg relative mb-4 max-w-2xl rounded-lg p-8 text-center shadow-xl"
        >
          <div class="text-xl">Are you sure you want to remove</div>
          <div class="py-4 text-5xl text-purple-600">
            {{ conjuration.name }}
          </div>
          <div class="text-xl">from your collection?</div>
          <div class="my-8 text-center font-extrabold text-red-500 underline">
            Any change's you have made to this conjuration will be lost
          </div>

          <div class="flex justify-around">
            <button
              type="button"
              class="flex self-center rounded-xl bg-gradient-to-r from-red-500 to-red-700 px-4 py-3 font-bold hover:from-red-700 hover:to-red-900"
              @click="
                handleRemoveConjuration();
                emit('close');
              "
            >
              Remove
            </button>
            <button
              type="button"
              class="flex self-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-3 font-bold hover:from-purple-700 hover:to-purple-900"
              @click="emit('close')"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
