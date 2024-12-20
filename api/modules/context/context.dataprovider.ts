import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { LLMProvider } from '@/providers/llmProvider';
import { prisma } from '@/providers/prisma';
import { ContextType } from '@prisma/client';

export class ContextDataProvider {
  constructor(private readonly llmProvider: LLMProvider) {}

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

    await this.llmProvider.deleteFile(contextFile.externalSystemFileId);

    await prisma.contextFiles.delete({
      where: {
        id: contextFile.id,
      },
    });
  };
}
