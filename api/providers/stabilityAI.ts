import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import {
  ImageGenerationRequest,
  ImageUpscaleRequest,
} from '../services/images/models';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { saveImage, getImage } from '../services/dataStorage';

export interface StabilityGeneratedImageResponse {
  uri: string;
  seed: number;
}

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
  ): Promise<StabilityGeneratedImageResponse> {
    const response = await axios.post(
      `${this.apiHost}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
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
        style_preset: request.stylePreset,
        seed: request.seed ? parseInt(request.seed) : 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    const artifacts = response.data.artifacts;

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
  }

  async eraseImagePortion(imageUri: string, maskBuffer: Buffer): Promise<string> {
    let imagePath: string | null = null;
    let maskPath: string | null = null;

    try {
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      imagePath = path.join(tempDir, `image_${Date.now()}.jpg`);
      maskPath = path.join(tempDir, `mask_${Date.now()}.png`);

      const imageBuffer = await axios.get(imageUri, { responseType: 'arraybuffer' });
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
      formData.append('image', image);

      const response = await axios.post(
        `${this.apiHost}/v1/generation/${this.upscaleEngine}/image-to-image/upscale`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const upscaledImage = response.data.artifacts[0];
        const newImageId = uuidv4();
        return await saveImage(newImageId, upscaledImage.base64);
      } else {
        throw new Error('No upscaled image received from Stability API');
      }
    } catch (err: any) {
      throw new AppError({
        description:
          'There was an error upscaling your image. This could be due to an unexpected outage with one of our providers. Please try again.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async inpaintImage(imageData: Buffer, maskData: Buffer, prompt: string, negativePrompt?: string, seed?: number): Promise<string> {
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

  async outpaintImage(imageData: Buffer, left: number, right: number, up: number, down: number, prompt?: string, creativity?: number, seed?: number): Promise<string> {
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