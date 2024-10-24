import { NextFunction, Request, Response } from 'express';
import { prisma } from './providers/prisma';
import { AppError, HttpCode } from './errors/AppError';
import { CampaignRole } from '../modules/campaigns/campaigns.interface';
import { useBuildFileUploader } from './fileUploadMiddleware';

const MAX_AUDIO_FILE_SIZE = 600000000;
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg'];

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
  const upload = useBuildFileUploader({
    maxFileSize: MAX_AUDIO_FILE_SIZE,
    acceptedFileTypes: ACCEPTED_AUDIO_TYPES,
  });
  return upload.single('audioFile');
};
