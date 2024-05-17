import { ImageGenerationRequest, ImageGenerationResponse } from './models';
import { ImageModel } from '@prisma/client';
import axios from 'axios';

export const generateMythWeaverModelImage = async (
  request: ImageGenerationRequest,
  model: ImageModel,
): Promise<ImageGenerationResponse> => {
  console.log('test');
  await axios.post('');
  return {
    images: [],
  };
};
