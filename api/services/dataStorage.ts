import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  region: 'sfo3',
});

export const getTranscription = async (sessionId: number) => {
  const command = new GetObjectCommand({
    Bucket: process.env.TRANSCRIPTION_BUCKET,
    Key: `${sessionId}.json`,
  });
  const response = await s3.send(command);
  const jsonBuffer = Buffer.from(
    (await response.Body?.transformToByteArray()) as Uint8Array,
  );
  return JSON.parse(jsonBuffer.toString());
};
