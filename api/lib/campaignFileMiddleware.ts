import { NextFunction, Request, Response } from 'express';
import { prisma } from './providers/prisma';
import { AppError, HttpCode } from './errors/AppError';
import { CampaignRole } from '../controllers/campaigns';
import { useBuildFileUploader } from './fileUploadMiddleware';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB;
const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

export const useCampaignFileUploadAuthorizer = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const campaignId = req.params.campaignId as unknown as number;

    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId: res.locals.auth.userId,
          campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to upload files for this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    next();
  };
};

export const useCampaignFileUploader = () => {
  const upload = useBuildFileUploader({
    maxFileSize: MAX_FILE_SIZE,
    acceptedFileTypes: ACCEPTED_FILE_TYPES,
  });
  return upload.single('file');
};
