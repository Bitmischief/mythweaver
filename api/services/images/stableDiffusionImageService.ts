import axios, { AxiosResponse } from 'axios';
import { AppEvent, track } from '../../lib/tracking';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import { getImage, saveImage } from '../dataStorage';
import {
  GeneratedImage,
  ImageGenerationRequest,
  ImageUpscaleRequest,
  ImageUpscaleResponse,
} from './models';
import { ImageStylePreset } from '../../controllers/images';
import { arrayBuffer } from 'stream/consumers';

const apiHost = process.env.API_HOST ?? 'https://api.stability.ai';
const engineId = 'stable-diffusion-v1-6';
const apiKey = process.env.STABILITY_API_KEY;
const upscaleEngine = 'esrgan-v1-x2plus';

export const generateStableDiffusionImage = async (
  request: ImageGenerationRequest,
): Promise<GeneratedImage | undefined> => {
  if (!apiKey) throw new Error('Missing Stability API key.');

  const imageResponse = await postToStableDiffusion(
    {
      ...request,
      count: 1,
    },
    request.stylePreset || ImageStylePreset.FANTASY_ART,
  );

  if (!imageResponse) {
    return;
  }

  const artifacts = imageResponse.artifacts.filter(
    (a: any) => a.finishReason === 'SUCCESS',
  );

  if (artifacts.length === 0) {
    throw new AppError({
      description: 'Image generation failed.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const image = artifacts[0];
  const imageId = uuidv4();
  const url = await saveImage(imageId, image.base64);

  return {
    uri: url,
    seed: image.seed,
  };
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

  return {
    artifacts: response.data.artifacts,
  };
};

export const stableDiffusionUpscaleImage = async (
  request: ImageUpscaleRequest,
): Promise<string> => {
  if (!apiKey) throw new Error('Missing Stability API key.');

  track(AppEvent.UpscaleImage, request.userId, undefined, {});
  const upscaledImageBase64 = await postStableDiffusionUpscaleRequest(request);

  if (!upscaledImageBase64) {
    throw new AppError({
      description: 'Image upscale failed.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  const imageId = uuidv4();
  return await saveImage(imageId, upscaledImageBase64);
};

const postStableDiffusionUpscaleRequest = async (
  request: ImageUpscaleRequest,
): Promise<string | undefined> => {
  let response: AxiosResponse<Buffer>;

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
    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: 404,
      });
    }

    formData.append('image', image, {
      filename: `${imageId}.png`,
      contentType: 'image/png',
    });

    response = await axios.post(
      `${apiHost}/v2beta/stable-image/upscale/fast`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Accept: 'image/*',
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: 'arraybuffer',
      },
    );
  } catch (err: any) {
    throw new AppError({
      description:
        'There was an error upscaling your image. This could be due to an unexpected outage with one of our providers. Please try again.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      websocket: {
        userId: request.userId,
        errorCode: ErrorType.ImageUpscaleError,
        context: {
          imageId: request.imageId,
          userId: request.userId,
        },
      },
    });
  }

  return response.data.toString('base64');
};
