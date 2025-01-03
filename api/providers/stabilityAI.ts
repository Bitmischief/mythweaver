import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { saveImage, getImage } from '../services/dataStorage';
import {
  ApiImageGenerationResponse,
  ImageGenerationRequest,
  ImageUpscaleRequest,
} from '@/modules/images/images.interface';

export class StabilityAIProvider {
  private apiKey: string;
  private apiHost: string;
  private upscaleEngine: string;

  constructor() {
    this.apiKey = process.env.STABILITY_API_KEY || '';
    this.apiHost = 'https://api.stability.ai';
    this.upscaleEngine = 'esrgan-v1-x2plus';
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ApiImageGenerationResponse[]> {
    if (request.referenceImage) {
      return this.generateImageToImage(request);
    } else {
      return this.generateTextToImage(request);
    }
  }

  private async generateTextToImage(
    request: ImageGenerationRequest,
  ): Promise<ApiImageGenerationResponse[]> {
    const width = request.width || 1024;
    const height = request.height || 1024;

    const payload = {
      text_prompts: [
        { text: request.prompt, weight: 1 },
        { text: `blurry, bad, ${request.negativePrompt}`, weight: -1 },
      ],
      cfg_scale: 7,
      height,
      width,
      steps: 30,
      samples: request.count,
      style_preset: request.stylePreset || 'fantasy-art',
      seed: request.seed,
    };

    const response = await axios.post(
      `${this.apiHost}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return await this.processGenerationResponse(response);
  }

  private async generateImageToImage(
    request: ImageGenerationRequest,
  ): Promise<ApiImageGenerationResponse[]> {
    const formData = new FormData();
    formData.append('text_prompts[0][text]', request.prompt);
    formData.append('text_prompts[0][weight]', '1');

    if (request.negativePrompt) {
      formData.append(
        'text_prompts[1][text]',
        `blurry, bad, ${request.negativePrompt}`,
      );
      formData.append('text_prompts[1][weight]', '-1');
    }

    formData.append('cfg_scale', '7');
    formData.append('steps', '30');
    formData.append('samples', request.count.toString());

    if (request.stylePreset) {
      formData.append('style_preset', request.stylePreset);
    }

    if (request.seed) {
      formData.append('seed', request.seed);
    }

    formData.append('init_image', request.referenceImage, 'init_image.png');
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', (request.imageStrength || .35).toString());

    const response = await axios.post(
      `${this.apiHost}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return await this.processGenerationResponse(response);
  }

  async processGenerationResponse(
    response: AxiosResponse,
  ): Promise<ApiImageGenerationResponse[]> {
    const artifacts = response.data.artifacts;

    if (artifacts.length === 0) {
      throw new AppError({
        description: 'Image generation failed.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    return artifacts.map(
      (a: any) =>
        ({
          base64: a.base64,
          nsfw: false,
          seed: a.seed,
        }) as ApiImageGenerationResponse,
    );
  }

  async eraseImagePortion(
    imageUri: string,
    maskBuffer: Buffer,
  ): Promise<string> {
    let imagePath: string | null = null;
    let maskPath: string | null = null;

    try {
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      imagePath = path.join(tempDir, `image_${Date.now()}.jpg`);
      maskPath = path.join(tempDir, `mask_${Date.now()}.png`);

      const imageBuffer = await axios.get(imageUri, {
        responseType: 'arraybuffer',
      });
      fs.writeFileSync(imagePath, imageBuffer.data);
      fs.writeFileSync(maskPath, maskBuffer);

      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));
      formData.append('mask', fs.createReadStream(maskPath));
      formData.append('output_format', 'jpeg');

      const response = await axios.post(
        `${this.apiHost}/v2beta/stable-image/edit/erase`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'image/*',
          },
          responseType: 'arraybuffer',
        },
      );

      const imageId = uuidv4();
      const base64 = Buffer.from(response.data).toString('base64');
      return await saveImage(imageId, base64);
    } finally {
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      if (maskPath && fs.existsSync(maskPath)) {
        fs.unlinkSync(maskPath);
      }
    }
  }

  async upscaleImage(request: ImageUpscaleRequest): Promise<string> {
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

      formData.append('image', image, {
        filename: `${imageId}.png`,
        contentType: 'image/png',
      });

      const response = await axios.post(
        `${this.apiHost}/v2beta/stable-image/upscale/fast`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Accept: 'image/*',
            Authorization: `Bearer ${this.apiKey}`,
          },
          responseType: 'arraybuffer',
        },
      );

      const imageBase64 = response.data.toString('base64');
      const newImageId = uuidv4();

      return await saveImage(newImageId, imageBase64);
    } catch (err: any) {
      throw new AppError({
        description:
          'There was an error upscaling your image. This could be due to an unexpected outage with one of our providers. Please try again.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async inpaintImage(
    imageData: Buffer,
    maskData: Buffer,
    prompt: string,
    negativePrompt?: string,
    seed?: number,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageData, { filename: 'image.png' });
    formData.append('mask', maskData, { filename: 'mask.png' });
    formData.append('prompt', prompt);
    if (negativePrompt) formData.append('negative_prompt', negativePrompt);
    if (seed) formData.append('seed', seed.toString());

    const response = await axios.post(
      `${this.apiHost}/v2beta/stable-image/edit/inpaint`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      },
    );

    const imageId = uuidv4();
    const base64 = Buffer.from(response.data).toString('base64');
    return await saveImage(imageId, base64);
  }

  async outpaintImage(
    imageData: Buffer,
    left: number,
    right: number,
    up: number,
    down: number,
    prompt?: string,
    creativity?: number,
    seed?: number,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageData, { filename: 'image.png' });
    formData.append('left', left.toString());
    formData.append('right', right.toString());
    formData.append('up', up.toString());
    formData.append('down', down.toString());
    if (prompt) formData.append('prompt', prompt);
    if (creativity) formData.append('creativity', creativity.toString());
    if (seed) formData.append('seed', seed.toString());

    const response = await axios.post(
      `${this.apiHost}/v2beta/stable-image/edit/outpaint`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      },
    );

    const imageId = uuidv4();
    const base64 = Buffer.from(response.data).toString('base64');
    return await saveImage(imageId, base64);
  }

  async removeBackground(imageData: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageData, { filename: 'image.png' });

    const response = await axios.post(
      `${this.apiHost}/v2beta/stable-image/edit/remove-background`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      },
    );

    const imageId = uuidv4();
    const base64 = Buffer.from(response.data).toString('base64');
    return await saveImage(imageId, base64);
  }
}
