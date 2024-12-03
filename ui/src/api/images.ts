import axios from 'axios';

export interface Image {
  id: number;
  uri: string;
  prompt: string;
  imageModel: {
    description: string;
  };
  createdAt: string;
  conjurationId?: number;
  characterId?: number;
  sessionId?: number;
}

export const conjureImage = async (
  prompt: string,
  negativePrompt?: string,
  stylePreset?: string,
  count?: number,
  seed?: string,
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  },
  modelId?: number,
) => {
  return axios.post('/images', {
    prompt,
    negativePrompt,
    stylePreset,
    count,
    seed,
    linking,
    modelId,
  });
};

export const patchImageConjurationId = async (imageId: number, conjurationId: number) => {
  return axios.patch(`/images/${imageId}/conjurationId`, {
    conjurationId: conjurationId,
  });
};

export const postImageUpscale = async (imageId: number) => {
  return axios.post(`/images/${imageId}/upscale`);
};

export const patchPrimaryImage = async (imageId: number) => {
  return axios.patch(`/images/${imageId}/primary`);
};

export const getConjurationImageHistory = async (conjurationId: number) => {
  return axios.get(`/images/conjurations/${conjurationId}/history`);
};

export const getUserImageGallery = (offset = 0, limit = 50) => {
  return axios.get(`/images/gallery`, { params: { offset, limit } });
};

export async function inpaintImage(
  imageId: number,
  maskFile: File,
  prompt: string,
): Promise<Image> {
  const formData = new FormData();
  formData.append('mask', maskFile);
  formData.append('prompt', prompt);

  const response = await axios.post(`/images/${imageId}/inpaint`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export const smartErase = async (imageId: number, maskFile: File): Promise<Image> => {
  const formData = new FormData();
  formData.append('mask', maskFile);

  const response = await axios.post(`/images/${imageId}/erase`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export async function outpaint(
  imageId: number,
  prompt: string,
  dimensions: {
    up: number;
    down: number;
    left: number;
    right: number;
  },
): Promise<Image> {
  const response = await axios.post(`/images/${imageId}/outpaint`, {
    prompt,
    ...dimensions,
  });

  return response.data;
}

export const setImageToEdit = async (imageId: number, editId: string) => {
  return axios.patch(`/images/${imageId}/edit`, { editId });
};

export const deleteEdits = async (imageId: number) => {
  return axios.delete(`/images/${imageId}/edits`);
};
