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

  let response: AxiosResponse;
  try {
    response = await axios.post(model.executionUri, {
      prompt: `${model.promptPrefix} ${request.prompt}`,
      steps: model.defaultSteps,
    });
  } catch (err: any) {
    throw new AppError({
      description:
        'There was an error generating your image. This could be due to our content filtering system rejecting your prompt, or an unexpected outage with one of our providers. Please try again.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.ImageGenerationError,
        context: {
          ...request.linking,
        },
      },
    });
  }

  const image = response.data;

  const imageId = uuidv4();
  const url = await saveImage(imageId, image.base64);

  return {
    uri: url,
    seed: image.seed,
  };
};
