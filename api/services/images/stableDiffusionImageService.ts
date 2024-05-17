import axios, { AxiosResponse } from 'axios';
import { sendWebsocketMessage, WebSocketEvent } from '../websockets';
import { AppEvent, track } from '../../lib/tracking';
import { v4 as uuidv4 } from 'uuid';
import { modifyImageCreditCount } from '../credits';
import { ImageCreditChangeType } from '@prisma/client';
import FormData from 'form-data';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { getImage, saveImage } from '../dataStorage';
import logger from '../../lib/logger';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageUpscaleRequest,
  ImageUpscaleResponse,
} from './models';
import { ImageStylePreset } from '../../controllers/images';

const apiHost = process.env.API_HOST ?? 'https://api.stability.ai';
const engineId = 'stable-diffusion-v1-6';
const apiKey = process.env.STABILITY_API_KEY;
const upscaleEngine = 'esrgan-v1-x2plus';

export const generateStableDiffusionImage = async (
  request: ImageGenerationRequest,
): Promise<ImageGenerationResponse> => {
  if (!apiKey) throw new Error('Missing Stability API key.');

  const result = {} as ImageGenerationResponse;

  const imageResponse = await postToStableDiffusion(
    {
      ...request,
      count: 1,
    },
    request.stylePreset || ImageStylePreset.FANTASY_ART,
  );

  if (!imageResponse) {
    return result;
  }

  const artifacts = imageResponse.artifacts.filter(
    (a: any) => a.finishReason === 'SUCCESS',
  );

  for (const image of artifacts) {
    const imageId = uuidv4();
    const url = await saveImage(imageId, image.base64);

    result.images.push({
      uri: url,
      seed: image.seed,
    });
  }

  return result;
};

const postToStableDiffusion = async (
  request: ImageGenerationRequest,
  preset: string,
  depth = 0,
) => {
  if (depth > 5) {
    return undefined;
  }

  let response: AxiosResponse<any, any>;

  try {
    response = await axios.post(
      `${apiHost}/v1/generation/${engineId}/text-to-image`,
      {
        text_prompts: [
          {
            text: request.prompt,
            weight: 1,
          },
          {
            text: `blurry, bad, ${request.negativePrompt}`,
            weight: -1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: request.count,
        style_preset: preset,
        seed: request.seed ? parseInt(request.seed) : 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
  } catch (err: any) {
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message:
        'There was an error generating your image. This could be due to our content filtering system rejecting your prompt, or an unexpected outage with one of our providers. Please try again.',
    });

    return undefined;
  }

  return {
    artifacts: response.data.artifacts,
  };
};

export const stableDiffusionUpscaleImage = async (
  request: ImageUpscaleRequest,
): Promise<string> => {
  if (!apiKey) throw new Error('Missing Stability API key.');

  track(AppEvent.UpscaleImage, request.userId, undefined, {});
  const upscaleResponse = await postStableDiffusionUpscaleRequest(request);

  const artifacts = upscaleResponse?.artifacts.filter(
    (a: any) => a.finishReason === 'SUCCESS',
  );

  const image = artifacts[0];

  if (!image) {
    throw new AppError({
      description: 'Image upscale failed.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const imageId = uuidv4();
  return await saveImage(imageId, image.base64);
};

const postStableDiffusionUpscaleRequest = async (
  request: ImageUpscaleRequest,
): Promise<ImageUpscaleResponse | undefined> => {
  let response: AxiosResponse<any, any>;

  const imageId = request.imageUri.split('/').pop();

  if (!imageId) {
    throw new AppError({
      description: 'Invalid image URI, image ID not found.',
      httpCode: 400,
    });
  }

  try {
    const formData = new FormData();

    const image = await getImage(imageId);
    formData.append('image', image);

    response = await axios.post(
      `${apiHost}/v1/generation/${upscaleEngine}/image-to-image/upscale`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
  } catch (err: any) {
    logger.error('There was an issue upscaling an image.', { err });
    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageError, {
      message:
        'There was an error upscaling your image. This could be due to our content filtering system rejecting your prompt, or an unexpected outage with one of our providers. Please try again.',
    });

    return undefined;
  }

  return response.data;
};
