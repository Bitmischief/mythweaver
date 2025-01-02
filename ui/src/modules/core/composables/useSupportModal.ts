import { ref } from 'vue';

const showModal = ref(false);

export const useSupportModal = () => {
  return { showModal };
};
