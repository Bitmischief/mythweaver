import { ref, onMounted } from 'vue';

const MW_CONDENSED_VIEW = 'mw-condensed-view';
const condensed = ref(false);

export const useCondensedView = () => {
  onMounted(() => {
    condensed.value = localStorage.getItem(MW_CONDENSED_VIEW) === 'true';
  });

  const setCondensed = (value: boolean) => {
    localStorage.setItem(MW_CONDENSED_VIEW, value.toString());
    condensed.value = value;
  };

  return {
    condensed,
    setCondensed,
  };
};
