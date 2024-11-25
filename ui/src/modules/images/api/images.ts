import axios from 'axios';
import { Image } from '../types/image';
import { GenerateImageRequest } from '../types/generateImageRequest';

export const apiGetImage = async (imageId: number): Promise<Image> => {
  const response = await axios.get<Image>(`/images/${imageId}`);
  return response.data;
};

export const apiGenerateImages = async (request: GenerateImageRequest): Promise<Image[]> => {
  let referenceImageId = undefined;

  if (request.referenceImageFile) {
    const image = await uploadReferenceImage(request.referenceImageFile as File);
    referenceImageId = image.id;
  }

  const images: Image[] = [];
  for (const model of request.selectedModels) {
    const response = await axios.post<Image[]>('/images', {
      modelId: model.id,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      count: model.quantity,
      imageStrength: request.referenceImageStrength,
      height: request.height,
      width: request.width,
      imageId: referenceImageId,
      linking: request.linking,
    });

    images.push(...response.data);
  }

  return images;
};

async function uploadReferenceImage(file: File): Promise<Image> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(`/images/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
