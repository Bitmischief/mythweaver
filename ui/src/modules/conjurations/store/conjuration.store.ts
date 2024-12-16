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
  ConjurationListFlags,
} from '@/modules/conjurations/types';
import { Image } from '@/modules/images/types';

interface ConjurationStoreState {
  conjuration: Conjuration | undefined;
  conjurationList: Conjuration[];
  conjurationTags: any[];
  conjurationRequest: Conjuration | undefined;
  conjurationListFilters: ConjurationListFilters;
  conjurationListFlags: ConjurationListFlags;
  conjurationTypes: ConjurationType[];
  conjurationLoading: boolean;
  conjurationListLoading: boolean;
}

export function getDefaultFilters() {
  return {
    search: '',
    conjurerCodes: [],
    tags: [],
  };
}

export function getDefaultFlags() {
  return {
    mine: true,
    saved: true,
  };
}

function updateConjurationImages(conjuration: Conjuration, image: Image) {
  if (conjuration.images) {
    const imageIndex = conjuration.images.findIndex((i) => i.id === image.id);
    if (imageIndex !== -1) {
      conjuration.images[imageIndex] = image;
    }
  }
}

export const useConjurationStore = defineStore({
  id: 'conjuration',
  state: (): ConjurationStoreState => ({
    conjuration: undefined,
    conjurationList: [],
    conjurationTags: [],
    conjurationRequest: undefined,
    conjurationListFilters: getDefaultFilters(),
    conjurationListFlags: getDefaultFlags(), // the only difference between these and filters is that we don't let users clear flags
    conjurationTypes: [],
    conjurationLoading: false,
    conjurationListLoading: false,
  }),
  actions: {
    async getConjurations(request: GetConjurationsRequest) {
      this.conjurationListLoading = true;
      const response = await getConjurations(request);
      if (request.offset === 0) {
        this.conjurationList = response.data.data;
      } else {
        this.conjurationList = [...this.conjurationList, ...response.data.data];
      }
      this.conjurationListLoading = false;
      return response.data;
    },
    async getConjuration(conjurationId: number) {
      this.conjurationLoading = true;
      const response = await getConjuration(conjurationId);
      this.conjuration = response.data;
      this.conjurationLoading = false;
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
      this.conjurationListFilters = getDefaultFilters();
    },
    async updateConjurationImages(image: Image) {
      if (this.conjuration && this.conjuration.images) {
        updateConjurationImages(this.conjuration, image);
      }

      if (this.conjurationList.length) {
        this.conjurationList.forEach((conjuration) => {
          updateConjurationImages(conjuration, image);
        });
      }
    },
  },
});
