import axios from "axios";
import { Image } from '../types/image';
import { GenerateImageRequest } from "../types/generateImageRequest";

export const apiGenerateImages = async(request: GenerateImageRequest) => {
  let referenceImageId = undefined;

  if (request.referenceImageFile) {
    const image = await uploadReferenceImage(request.referenceImageFile as File);
    referenceImageId = image.id;
  }

  for (const model of request.selectedModels) {
    axios.post('/images', {
      modelId: model.id,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      count: model.quantity,
      imageStrength: request.referenceImageStrength,
      height: request.height,
      width: request.width,
      imageId: referenceImageId,
    });
  }
}

async function uploadReferenceImage(file: File): Promise<Image> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(
    `${import.meta.env.VITE_CORE_API_URL}/images/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}