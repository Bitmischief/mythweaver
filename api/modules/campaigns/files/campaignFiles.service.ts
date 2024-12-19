import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { TrackingInfo, AppEvent, track } from '@/lib/tracking';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { ContextFiles, ContextType } from '@prisma/client';
import {
  WebSocketProvider,
  WebSocketEvent,
} from '@/providers/websocketProvider';
import { getClient } from '@/lib/providers/openai';
import { CampaignContextWorker } from '@/modules/context/workers/campaignContext.worker';
import { CampaignFilesDataProvider } from './campaignFiles.dataprovider';
import { CampaignRole } from '@/modules/campaigns/campaigns.interface';
import { PostCampaignFileRequest } from './campaignFiles.interface';

const openai = getClient();

export class CampaignFilesService {
  constructor(
    private campaignFilesDataProvider: CampaignFilesDataProvider,
    private membersDataProvider: MembersDataProvider,
    private indexCampaignContextWorker: CampaignContextWorker,
    private webSocketProvider: WebSocketProvider,
  ) {}

  async getCampaignFiles(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
  ): Promise<ContextFiles[]> {
    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      campaignId,
    );

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to get campaign files for this campaign',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.CampaignFileUploaded, userId, trackingInfo);

    return await this.campaignFilesDataProvider.getCampaignFiles(
      campaignId,
      ContextType.MANUAL_FILE_UPLOAD,
    );
  }

  async createCampaignFile(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    request: PostCampaignFileRequest,
  ): Promise<void> {
    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      campaignId,
    );

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to add files for this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const existingContextFileWithSameName =
      await this.campaignFilesDataProvider.getCampaignFile(
        campaignId,
        ContextType.MANUAL_FILE_UPLOAD,
        request.name,
      );

    if (existingContextFileWithSameName && !request.force) {
      throw new AppError({
        description: 'A file with that name already exists.',
        httpCode: HttpCode.UNPROCESSABLE_ENTITY,
      });
    }

    await this.indexCampaignContextWorker.addJob({
      campaignId,
      eventTargetId: campaignId,
      type: ContextType.MANUAL_FILE_UPLOAD,
      data: {
        fileUpload: {
          name: request.name,
          uri: request.uri,
        },
      },
    });

    await this.webSocketProvider.sendMessage(
      userId,
      WebSocketEvent.CampaignFileUploaded,
      {
        campaignId,
        filename: request.name,
      },
    );

    track(AppEvent.CampaignFileUploaded, userId, trackingInfo);
  }

  async deleteCampaignFile(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    fileId: number,
  ): Promise<void> {
    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      campaignId,
    );

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to delete campaign files for this campaign',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.CampaignFileDeleted, userId, trackingInfo);

    const contextFile =
      await this.campaignFilesDataProvider.getCampaignFileById(fileId);

    if (!contextFile) {
      throw new AppError({
        description: 'File not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await openai.files.del(contextFile.externalSystemFileId);

    await this.campaignFilesDataProvider.deleteCampaignFile(fileId);
  }
}
