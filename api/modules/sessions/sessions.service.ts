import { SessionsDataProvider } from '@/modules/sessions/sessions.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { BillingPlan, Session } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '@/lib/tracking';
import { CampaignRole } from '@/modules/campaigns/campaigns.interface';
import { EmailProvider, EmailTemplates } from '@/providers/emailProvider';
import { urlPrefix } from '@/lib/utils';
import {
  WebSocketProvider,
  WebSocketEvent,
} from '@/providers/websocketProvider';
import { MythWeaverLogger } from '@/lib/logger';
import {
  GetSessionsResponse,
  PatchSessionRequest,
  PostSessionAudioRequest,
  PostSessionAudioResponse,
  PostSessionRequest,
} from './sessions.interface';
import { AssemblyAIProvider } from '@/providers/assemblyAI';
import { SessionTranscriptWorker } from '@/modules/sessions/sessionTranscript.worker';
import { ContextService } from '@/modules/context/context.service';

export class SessionsService {
  constructor(
    private sessionsDataProvider: SessionsDataProvider,
    private campaignsDataProvider: CampaignsDataProvider,
    private membersDataProvider: MembersDataProvider,
    private usersDataProvider: UsersDataProvider,
    private assemblyAIProvider: AssemblyAIProvider,
    private sessionTranscriptWorker: SessionTranscriptWorker,
    private logger: MythWeaverLogger,
    private emailProvider: EmailProvider,
    private webSocketProvider: WebSocketProvider,
    private contextService: ContextService,
  ) {}

  async getSessions(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    offset?: number,
    limit?: number,
    search?: string,
    archived = false,
  ): Promise<GetSessionsResponse> {
    const sessions = await this.sessionsDataProvider.getSessions(
      userId,
      campaignId,
      offset,
      limit,
      search,
      archived,
    );

    track(AppEvent.GetSessions, userId, trackingInfo);

    return {
      data: sessions.map((s: any) => ({
        ...s,
        imageUri: s.images.find((i: any) => i.primary)?.uri || null,
      })),
      offset: offset,
      limit: limit,
    };
  }

  async getSession(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
  ): Promise<Session> {
    const session = await this.sessionsDataProvider.getSession(
      userId,
      sessionId,
    );

    if (!session) {
      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetSession, userId, trackingInfo);

    return {
      ...session,
      imageUri: session.images.find((i) => i.primary)?.uri || null,
    };
  }

  async createSession(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostSessionRequest,
  ): Promise<Session> {
    const session = await this.sessionsDataProvider.createSession({
      userId,
      ...request,
    });

    track(AppEvent.CreateSession, userId, trackingInfo);

    return session;
  }

  async updateSession(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
    request: PatchSessionRequest,
  ): Promise<Session> {
    await this.getSession(userId, trackingInfo, sessionId);

    const session = await this.sessionsDataProvider.updateSession(
      sessionId,
      request,
    );

    track(AppEvent.UpdateSession, userId, trackingInfo);

    await this.webSocketProvider.sendMessage(
      userId,
      WebSocketEvent.SessionUpdated,
      {},
    );

    await this.contextService.indexContext(session.campaignId, {
      sessionId: sessionId,
    });

    return session;
  }

  async deleteSession(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
  ): Promise<boolean> {
    const session = await this.getSession(userId, trackingInfo, sessionId);

    if (!session.archived) {
      await this.sessionsDataProvider.updateSession(sessionId, {
        archived: true,
      });
      track(AppEvent.ArchiveSession, userId, trackingInfo);
    } else {
      await this.sessionsDataProvider.deleteSession(sessionId);

      await this.contextService.deleteContext(session.campaignId, {
        sessionId,
      });

      track(AppEvent.DeleteSession, userId, trackingInfo);
    }

    return true;
  }

  async postSessionSummaryEmail(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
  ) {
    const session = await this.sessionsDataProvider.getSession(
      userId,
      sessionId,
    );

    if (!session) {
      this.logger.warn('Session not found', sessionId);

      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const campaign = await this.campaignsDataProvider.getCampaign(
      session.campaignId,
    );

    if (!campaign) {
      this.logger.warn('Campaign not found', sessionId);

      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const campaignMembers = campaign.members.filter((m) => m.joinedAt !== null);
    for (const member of campaignMembers) {
      const email = member.user?.email;

      if (!email) continue;

      await this.emailProvider.sendTransactionalEmail(
        email,
        EmailTemplates.CAMPAIGN_POST_SESSION,
        [
          {
            key: 'CAMPAIGN',
            value: campaign.name,
          },
          {
            key: 'SESSION_URL',
            value: `${urlPrefix}/sessions/${session?.id}#overview`,
          },
          {
            key: 'SUMMARY',
            value: session.summary || '',
          },
        ],
      );
    }
  }

  async postSessionAudio(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
    request: PostSessionAudioRequest,
  ): Promise<PostSessionAudioResponse> {
    const session = await this.getSession(userId, trackingInfo, sessionId);

    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      session.campaignId,
    );

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permission to add audio to this session.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const updatedSession = await this.sessionsDataProvider.updateSession(
      sessionId,
      {
        audioName: request.audioName,
        audioUri:
          request.audioUri.indexOf('https://') === -1
            ? `https://${request.audioUri}`
            : request.audioUri,
      },
    );

    track(AppEvent.SessionAudioUploaded, userId, trackingInfo);

    if (!updatedSession.audioUri) {
      throw new AppError({
        description: 'Audio URI not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const transcriptJob = await this.assemblyAIProvider.transcribe(
      updatedSession.audioUri,
    );

    await this.sessionsDataProvider.updateSession(sessionId, {
      assemblyTranscriptId: transcriptJob.id,
    });

    this.sessionTranscriptWorker.addJob({
      transcriptId: transcriptJob.id,
      sessionId,
      userId,
    });

    return {
      audioName: request.audioName,
      audioUri: request.audioUri,
    };
  }

  async deleteSessionAudio(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
  ) {
    const session = await this.getSession(userId, trackingInfo, sessionId);

    if (!session) {
      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const campaignMember = await this.membersDataProvider.getCampaignMember(
      userId,
      session.campaignId,
    );

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to delete audio from this session.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    await this.sessionsDataProvider.updateSession(sessionId, {
      audioName: null,
      audioUri: null,
      assemblyTranscriptId: null,
    });
  }

  async getSessionTranscript(
    userId: number,
    trackingInfo: TrackingInfo,
    sessionId: number,
  ) {
    const session = await this.getSession(userId, trackingInfo, sessionId);

    if (!session) {
      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (!session.assemblyTranscriptId) {
      throw new AppError({
        description: 'Transcript not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const assemblyTranscript = await this.assemblyAIProvider.getTranscript(
      session.assemblyTranscriptId,
    );

    if (assemblyTranscript.status === 'error') {
      throw new AppError({
        description: 'Transcript failed to process.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    } else if (assemblyTranscript.status !== 'completed') {
      throw new AppError({
        description: 'Transcript is currently processing.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const paragraphs = await this.assemblyAIProvider.getParagraphs(
      session.assemblyTranscriptId,
    );

    const user = await this.usersDataProvider.getUserById(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (user.plan !== BillingPlan.PRO) {
      return paragraphs.paragraphs.slice(0, 3);
    }

    return paragraphs.paragraphs;
  }
}
