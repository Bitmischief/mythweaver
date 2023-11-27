import axios from 'axios';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { isLocalDevelopment } from '../lib/utils';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { sleep } from 'openai/core';
import { prisma } from '../lib/providers/prisma';
import { ImageStylePreset } from '../controllers/images';

const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  region: 'sfo3',
});

const engineId = 'stable-diffusion-v1-6';
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai';
const apiKey = process.env.STABILITY_API_KEY;

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export interface ImageRequest {
  userId: number;
  prompt: string;
  count: number;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  };
}

export const generateImage = async (request: ImageRequest) => {
  if (!apiKey) throw new Error('Missing Stability API key.');

  const preset = request.stylePreset || 'fantasy-art';

  const response = await axios.post(
    `${apiHost}/v1/generation/${engineId}/text-to-image`,
    {
      text_prompts: [
        {
          text: request.prompt,
          weight: 1,
        },
        {
          text: `nude, naked, lewd, nsfw, blurry, bad, ${request.negativePrompt}`,
          weight: -1,
        },
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      steps: 30,
      samples: request.count,
      style_preset: preset,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.status.toString().startsWith('2')) {
    throw new Error(`Non-200 response: ${response.data}`);
  }

  const responseJSON = response.data as GenerationResponse;
  const urls: string[] = [];

  for (const image of responseJSON.artifacts) {
    const imageId = uuidv4();
    let url = '';

    if (!isLocalDevelopment) {
      url = await uploadImage(imageId, image.base64);
    } else {
      url = saveImageLocally(imageId, image.base64);
    }

    await sleep(1000);
    urls.push(url);

    await prisma.image.create({
      data: {
        userId: request.userId,
        uri: url,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        stylePreset: preset,
        ...request.linking,
      },
    });
  }

  return urls;
};

export const saveImageLocally = (imageId: string, imageBase64: string) => {
  const dataDir = process.env.DATA_DIR ?? './public/images';

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    `${dataDir}/${imageId}.png`,
    Buffer.from(imageBase64, 'base64'),
  );

  return `${process.env.API_URL}/images/${imageId}.png`;
};

export const uploadImage = async (imageId: string, imageBase64: string) => {
  const buf = Buffer.from(imageBase64, 'base64');

  const command = new PutObjectCommand({
    Bucket: 'mythweaver-assets',
    Key: `${imageId}.png`,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/png',
    ACL: 'public-read',
  });

  await s3.send(command);

  return `https://assets.mythweaver.co/${command.input.Key}`;
};
