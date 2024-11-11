import { ImageModel } from '@prisma/client';
import axios from 'axios';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../dataStorage';
import logger from '../../lib/logger';
import {
  GeneratedImage,
  ImageGenerationRequest,
} from '../../modules/images/images.interface';

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

  logger.info(`Generating image with model: ${model?.description}`, model);

  const response = await axios.post(
    model.executionUri,
    {
      input: {
        prompt: `${model.promptPrefix} ${request.prompt}`,
        steps: model.defaultSteps,
        negative_prompt: request.negativePrompt,
        lora_name: model.loraName,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
    },
  );

  const image = response.data.output;

  const imageId = uuidv4();
  const url = await saveImage(imageId, image.base64);

  return {
    uri: url,
    seed: image.seed,
  };
};
