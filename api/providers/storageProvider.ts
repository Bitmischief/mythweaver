import { isLocalDevelopment } from '@/modules/core/utils/environments';
import fs from 'node:fs';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export class StorageProvider {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: 'https://sfo3.digitaloceanspaces.com',
      credentials: {
        accessKeyId: process.env.SPACES_KEY || '',
        secretAccessKey: process.env.SPACES_SECRET || '',
      },
      region: 'sfo3',
    });
  }

  async saveImage(imageId: string, base64: string): Promise<string> {
    if (isLocalDevelopment) {
      return this.saveImageLocally(imageId, base64);
    }
    return this.uploadImage(imageId, base64);
  }

  private saveImageLocally(imageId: string, imageBase64: string): string {
    const dataDir = process.env.DATA_DIR ?? './public/images';

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(
      `${dataDir}/${imageId}.png`,
      Buffer.from(imageBase64, 'base64'),
    );

    return `${process.env.API_URL}/images/${imageId}.png`;
  }

  private async uploadImage(
    imageId: string,
    imageBase64: string,
  ): Promise<string> {
    const buf = Buffer.from(imageBase64, 'base64');

    const command = new PutObjectCommand({
      Bucket: 'mythweaver-assets',
      Key: `${imageId}.png`,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/png',
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return `https://assets.mythweaver.co/${command.input.Key}`;
  }

  async getImage(imageId: string): Promise<Buffer> {
    if (isLocalDevelopment) {
      const imageDir = `${process.env.DATA_DIR ?? './public/images'}/${imageId}`;
      return fs.readFileSync(imageDir);
    }

    const command = new GetObjectCommand({
      Bucket: 'mythweaver-assets',
      Key: imageId,
    });
    const response = await this.s3.send(command);
    return Buffer.from(
      (await response.Body?.transformToByteArray()) as Uint8Array,
    );
  }

  async getTranscription(sessionId: number): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: process.env.TRANSCRIPTION_BUCKET,
      Key: `${sessionId}.json`,
    });
    const response = await this.s3.send(command);
    const jsonBuffer = Buffer.from(
      (await response.Body?.transformToByteArray()) as Uint8Array,
    );
    return JSON.parse(jsonBuffer.toString());
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (isLocalDevelopment) {
      const imagePath = `${process.env.DATA_DIR ?? './public/images'}/${imageUrl.split('/').pop()}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      return;
    }

    const key = imageUrl.split('mythweaver.co/')[1];
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: 'mythweaver-assets',
      Key: key,
    });

    await this.s3.send(command);
  }
}

export default new StorageProvider();
