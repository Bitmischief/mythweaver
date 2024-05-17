import { isLocalDevelopment } from '../lib/utils';
import fs from 'node:fs';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  region: 'sfo3',
});

export const saveImage = async (imageId: string, base64: string) => {
  let url = '';

  if (!isLocalDevelopment) {
    url = await uploadImage(imageId, base64);
  } else {
    url = saveImageLocally(imageId, base64);
  }

  return url;
};

const saveImageLocally = (imageId: string, imageBase64: string) => {
  const dataDir = process.env.DATA_DIR ?? './public/images';

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    `${dataDir}/${imageId}.png`,
    Buffer.from(imageBase64, 'base64'),
  );

  return `${process.env.API_URL}/images/${imageId}.png`;
};

const uploadImage = async (imageId: string, imageBase64: string) => {
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

export const getImage = async (imageId: string) => {
  if (!isLocalDevelopment) {
    const command = new GetObjectCommand({
      Bucket: 'mythweaver-assets',
      Key: imageId,
    });
    const response = await s3.send(command);
    return Buffer.from(
      (await response.Body?.transformToByteArray()) as Uint8Array,
    );
  } else {
    const imageDir = `${process.env.DATA_DIR ?? './public/images'}/${imageId}`;
    return fs.readFileSync(imageDir);
  }
};
