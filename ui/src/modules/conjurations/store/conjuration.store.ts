import { defineStore } from 'pinia';
import {
  Conjuration,
  GetConjurationTagsRequest,
  PatchConjurationsRequest,
  PostConvertConjurationRequest,
} from '@/modules/conjurations/types';
import {
  copyConjuration,
  deleteConjuration,
  getConjuration,
  getConjurationRequest,
  getConjurationTags,
  getConjurations,
  getConjurationTypes,
  patchConjuration,
  postConvertConjurationRequest,
  removeConjuration,
  saveConjuration,
} from '@/modules/conjurations/api';
import {
  GetConjurationsRequest,
  ConjurationListFilters,
  ConjurationType,
} from '@/modules/conjurations/types';

interface ConjurationStoreState {
  conjuration: Conjuration | undefined;
  conjurationList: Conjuration[];
  conjurationTags: any[];
  conjurationRequest: Conjuration | undefined;
  conjurationListFilters: ConjurationListFilters;
  conjurationTypes: ConjurationType[];
}

export const defaultFilters: ConjurationListFilters = {
  search: '',
  conjurerCodes: [],
  tags: [],
};

export const useConjurationStore = defineStore({
  id: 'conjuration',
  state: (): ConjurationStoreState => ({
    conjuration: undefined,
    conjurationList: [],
    conjurationTags: [],
    conjurationRequest: undefined,
    conjurationListFilters: Object.assign({}, defaultFilters),
    conjurationTypes: [],
  }),
  actions: {
    async getConjurations(request: GetConjurationsRequest) {
      const response = await getConjurations(request);
      this.conjurationList = response.data.data;
      return response.data;
    },
    async getConjuration(conjurationId: number) {
      const response = await getConjuration(conjurationId);
      this.conjuration = response.data;
      return response.data;
    },
    async getConjurationRequest(requestId: number) {
      const response = await getConjurationRequest(requestId);
      return response.data;
    },
    async getConjurationTags(request: GetConjurationTagsRequest) {
      const response = await getConjurationTags(request);
      this.conjurationTags = response.data.data;
      return response.data.data;
    },
    async getConjurationTypes() {
      const response = await getConjurationTypes();
      this.conjurationTypes = response.data.data;
      return response.data;
    },
    async patchConjuration(conjurationId: number, request: PatchConjurationsRequest) {
      const response = await patchConjuration(conjurationId, request);
      this.conjuration = response.data;
      return response.data;
    },
    async saveConjuration(conjurationId: number) {
      const response = await saveConjuration(conjurationId);
      this.conjuration = response.data;
      return response.data;
    },
    async copyConjuration(conjurationId: number) {
      const response = await copyConjuration(conjurationId);
      this.conjuration = response.data;
      return response.data;
    },
    async postConvertConjurationRequest(request: PostConvertConjurationRequest) {
      const response = await postConvertConjurationRequest(request);
      return response.data;
    },
    async removeConjuration(conjurationId: number) {
      const response = await removeConjuration(conjurationId);
      this.conjuration = undefined;
      return response.data;
    },
    async deleteConjuration(conjurationId: number) {
      const response = await deleteConjuration(conjurationId);
      this.conjuration = undefined;
      return response.data;
    },
    async clearConjurationListFilters() {
      this.conjurationListFilters = Object.assign({}, defaultFilters);
    },
  },
});
