import { defineStore } from 'pinia';

interface ConjurationsStoreState {
  viewType: string;
}

const CONJURATION_LIST_VIEW_TYPE = 'conjuration-view-type';

export const useConjurationsStore = defineStore({
  id: 'conjurations',
  state: (): ConjurationsStoreState => ({
    viewType: localStorage.getItem(CONJURATION_LIST_VIEW_TYPE) ?? 'grid',
  }),
  actions: {
    setType(type: string) {
      localStorage.setItem(CONJURATION_LIST_VIEW_TYPE, type);
      this.viewType = type;
    },
  },
});
