import { AppError, HttpCode } from '@/lib/errors/AppError';
import { prisma } from '@/lib/providers/prisma';
import { ContextType } from '@prisma/client';
import { getClient } from '@/lib/providers/openai';

const openai = getClient();

export class ContextDataProvider {
  deleteSessionContext = async (campaignId: number, sessionId: number) => {
    const contextFile = await prisma.contextFiles.findFirst({
      where: {
        type: ContextType.SESSION,
        campaignId: campaignId,
        sessionId: sessionId,
      },
    });

    if (!contextFile) {
      throw new AppError({
        description: 'File not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await openai.files.del(contextFile.externalSystemFileId);

    await prisma.contextFiles.delete({
      where: {
        id: contextFile.id,
      },
    });
  };
}
