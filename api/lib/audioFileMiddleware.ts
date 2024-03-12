import { Request, Response, NextFunction } from 'express';
import { prisma } from './providers/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { v4 as uuidv4 } from 'uuid';
import { CampaignRole } from '../controllers/campaigns';

const multer = require('multer');
const multerS3 = require('multer-s3');

const MAX_AUDIO_FILE_SIZE = 600000000;
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg'];

const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  region: 'sfo3',
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'mythweaver-assets',
    key: function (req: Request, file: any, cb: any) {
      const audioId = uuidv4();
      cb(null, `${audioId}.${file.type}`);
    },
    acl: 'public-read',
  }),
  limits: {
    fileSize: MAX_AUDIO_FILE_SIZE,
  },
  fileFilter: function (req: Request, file: any, cb: any) {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only .mp3 format allowed!'));
    }
    cb(null, true);
  },
});

export const useAudioUploadAuthorizer = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId = 0 } = req.params;

    const session = await prisma.session.findUnique({
      where: {
        id: sessionId as number,
      },
    });

    if (!session) {
      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId: res.locals.auth.userId,
          campaignId: session.campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permission to add audio to this session.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    next();
  };
};

export const useAudioFileUploader = () => {
  return upload.single('audioFile');
};
