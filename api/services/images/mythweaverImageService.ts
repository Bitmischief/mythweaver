import { GeneratedImage, ImageGenerationRequest } from './models';
import { ImageModel } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../dataStorage';

export const generateMythWeaverModelImage = async (
  request: ImageGenerationRequest,
  model: ImageModel,
): Promise<GeneratedImage> => {
  if (!model.executionUri) {
    throw new AppError({
      description: 'Model does not have an execution URI.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const response = await axios.post(model.executionUri, {
    prompt: `${model.promptPrefix} ${request.prompt}`,
    steps: model.defaultSteps,
  });

  const image = response.data;

  const imageId = uuidv4();
  const url = await saveImage(imageId, image.base64);

  return {
    uri: url,
    seed: image.seed,
  };
};
