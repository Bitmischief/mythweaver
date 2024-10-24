import { SessionsDataProvider } from './sessions.dataprovider';
import { CampaignsDataProvider } from '../campaigns/campaigns.dataprovider';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { BillingPlan, Session } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../../lib/tracking';
import { CampaignRole } from '../campaigns/campaigns.interface';
import {
    EmailTemplates,
    sendTransactionalEmail,
} from '../../services/internal/email';
import { urlPrefix } from '../../lib/utils';
import { sendWebsocketMessage, WebSocketEvent } from '../../services/websockets';
import { MythWeaverLogger } from '../../lib/logger';
import { getClient } from '../../lib/providers/openai';
import {
    deleteSessionContext,
    indexSessionContext,
} from '../../dataAccess/sessions';
import { sessionTranscriptionQueue } from '../../worker';
import { recapTranscript } from '../../services/transcription';
import {
    GetSessionsResponse,
    PatchSessionRequest,
    PostCompleteSessionRequest,
    PostSessionAudioRequest,
    PostSessionAudioResponse,
    PostSessionRequest,
} from './sessions.interface';

export class SessionsService {
    constructor(
        private sessionsDataProvider: SessionsDataProvider,
        private campaignsDataProvider: CampaignsDataProvider,
        private membersDataProvider: MembersDataProvider,
        private usersDataProvider: UsersDataProvider,
        private logger: MythWeaverLogger,
    ) { }

    async getSessions(
        userId: number,
        trackingInfo: TrackingInfo,
        campaignId: number,
        offset?: number,
        limit?: number,
        search?: string,
        archived = false,
    ): Promise<GetSessionsResponse> {
        const sessions = await this.sessionsDataProvider.getSessions(userId, campaignId, offset, limit, search, archived);

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
        const session = await this.sessionsDataProvider.getSession(userId, sessionId);

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
        const session = await this.sessionsDataProvider.createSession(
            {
                userId,
                ...request,
            }
        );

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

        const session = await this.sessionsDataProvider.updateSession(sessionId, request);

        track(AppEvent.UpdateSession, userId, trackingInfo);

        await sendWebsocketMessage(userId, WebSocketEvent.SessionUpdated, {});

        await indexSessionContext(session.campaignId, sessionId);

        return session;
    }

    async deleteSession(
        userId: number,
        trackingInfo: TrackingInfo,
        sessionId: number,
    ): Promise<boolean> {
        const session = await this.getSession(
            userId,
            trackingInfo,
            sessionId,
        );

        if (!session.archived) {
            await this.sessionsDataProvider.updateSession(sessionId, {
                archived: true,
            });
            track(AppEvent.ArchiveSession, userId, trackingInfo);
        } else {
            await this.sessionsDataProvider.deleteSession(sessionId);

            await deleteSessionContext(session.campaignId, sessionId);

            track(AppEvent.DeleteSession, userId, trackingInfo);
        }

        return true;
    }

    async postSessionSummaryEmail(
        userId: number,
        trackingInfo: TrackingInfo,
        sessionId: number,
    ) {
        const session = await this.sessionsDataProvider.getSession(userId, sessionId);

        if (!session) {
            this.logger.warn('Session not found', sessionId);

            throw new AppError({
                description: 'Session not found.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        const campaign = await this.campaignsDataProvider.getCampaign(session.campaignId);

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

            await sendTransactionalEmail(
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
        const session = await this.getSession(
            userId,
            trackingInfo,
            sessionId,
        );

        const campaignMember = await this.membersDataProvider.getCampaignMember(userId, session.campaignId);

        if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
            throw new AppError({
                description: 'You do not have permission to add audio to this session.',
                httpCode: HttpCode.FORBIDDEN,
            });
        }

        const user = await this.usersDataProvider.getUserById(userId);

        if (!user) {
            throw new AppError({
                description: 'User not found.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        if (user.plan === BillingPlan.FREE) {
            throw new AppError({
                description:
                    'You must have a Basic or Pro subscription to upload audio for this session.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        await this.sessionsDataProvider.updateSession(
            sessionId,
            {
                audioName: request.audioName,
                audioUri:
                    request.audioUri.indexOf('https://') === -1
                        ? `https://${request.audioUri}`
                        : request.audioUri,
            }
        );

        const existingTranscription = await this.sessionsDataProvider.getSessionTranscription(sessionId);

        if (existingTranscription) {
            await this.sessionsDataProvider.deleteSessionTranscription(sessionId);
        }

        track(AppEvent.SessionAudioUploaded, userId, trackingInfo);

        if (user.plan === BillingPlan.PRO) {
            await sessionTranscriptionQueue.add({
                sessionId,
                userId,
            });
        }

        return {
            audioName: request.audioName,
            audioUri: request.audioUri,
        };
    }

    async createSessionTranscription(
        userId: number,
        trackingInfo: TrackingInfo,
        requestId: string,
        sessionId: number,
    ) {
        const session = await this.getSession(
            userId,
            trackingInfo,
            sessionId,
        );

        if (!session) {
            throw new AppError({
                description: 'Session not found.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        const campaignMember = await this.membersDataProvider.getCampaignMember(userId, session.campaignId);

        if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
            throw new AppError({
                description:
                    'You do not have permission to perform a transcription for this session.',
                httpCode: HttpCode.FORBIDDEN,
            });
        }

        const user = await this.usersDataProvider.getUserById(userId);

        if (!user) {
            throw new AppError({
                description: 'User not found.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        if (user.plan !== BillingPlan.PRO && user.plan !== BillingPlan.TRIAL) {
            throw new AppError({
                description:
                    'You must have a Pro subscription to perform a transcription for this session.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        if (!session.audioUri) {
            throw new AppError({
                description:
                    'You must upload session audio before you can perform a transcription for this session.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        await sessionTranscriptionQueue.add({
            sessionId: sessionId,
            userId,
        });
    }

    async deleteSessionAudio(
        userId: number,
        trackingInfo: TrackingInfo,
        sessionId: number,
    ) {
        const session = await this.getSession(
            userId,
            trackingInfo,
            sessionId,
        );

        if (!session) {
            throw new AppError({
                description: 'Session not found.',
                httpCode: HttpCode.BAD_REQUEST,
            });
        }

        const campaignMember = await this.membersDataProvider.getCampaignMember(userId, session.campaignId);

        if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
            throw new AppError({
                description:
                    'You do not have permission to delete audio from this session.',
                httpCode: HttpCode.FORBIDDEN,
            });
        }

        await this.sessionsDataProvider.updateSession(
            sessionId,
            {
                audioName: null,
                audioUri: null,
            }
        );

        const existingTranscription = await this.sessionsDataProvider.getSessionTranscription(sessionId);

        if (existingTranscription) {
            await this.sessionsDataProvider.deleteSessionTranscription(sessionId);
        }
    }

    async generateSessionSummary(
        userId: number,
        trackingInfo: TrackingInfo,
        request: PostCompleteSessionRequest,
    ) {
        const openai = getClient();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a helpful assistant who is knowledgeable in dungeons and dragons.',
                },
                {
                    role: 'user',
                    content: `Provide an 8 sentence summary of the recap provided here:
          ${request?.recap}.
          Please return only text, do not include any other formatting.
          Please make the length of the summary proportional to the length of the recap,
          ensuring you include the most important highlights from the recap.`,
                },
            ],
        });

        const gptResponse = response.choices[0]?.message?.content;
        this.logger.info('Received raw response from openai', gptResponse);

        return gptResponse;
    }

    async getSessionTranscription(
        userId: number,
        trackingInfo: TrackingInfo,
        sessionId: number,
    ) {
        const session = await this.getSession(
            userId,
            trackingInfo,
            sessionId,
        );

        if (!session) {
            throw new AppError({
                description: 'Session not found.',
                httpCode: HttpCode.NOT_FOUND,
            });
        }

        const transcript = await this.sessionsDataProvider.getSessionTranscription(sessionId);

        if (!transcript) {
            throw new AppError({
                description: 'Transcript not found.',
                httpCode: HttpCode.NOT_FOUND,
            });
        }

        return transcript;
    }

    async createRecapTranscription(
        userId: number,
        trackingInfo: TrackingInfo,
        sessionId: number,
    ) {
        const session = await this.sessionsDataProvider.getSession(userId, sessionId);

        if (!session) {
            throw new AppError({
                description: 'Session not found.',
                httpCode: HttpCode.NOT_FOUND,
            });
        }

        if (session.userId !== null && session.userId !== userId) {
            throw new AppError({
                description: 'You do not have access to this session.',
                httpCode: HttpCode.FORBIDDEN,
            });
        }

        const campaignMember = await this.membersDataProvider.getCampaignMember(userId, session.campaignId);

        if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
            throw new AppError({
                description: 'You do not have permission to complete this session.',
                httpCode: HttpCode.FORBIDDEN,
            });
        }

        if (!session.sessionTranscription) {
            throw new AppError({
                description: 'Transcript not found.',
                httpCode: HttpCode.NOT_FOUND,
            });
        }

        if (!session.sessionTranscription.transcriptExternalId) {
            throw new AppError({
                description: 'Transcript has no external id',
                httpCode: HttpCode.NOT_FOUND,
            });
        }

        const recap = await recapTranscript(
            session.sessionTranscription.transcriptExternalId,
        );

        await this.sessionsDataProvider.updateSession(
            sessionId,
            {
                suggestedRecap: recap,
            },
        );

        track(AppEvent.RecapSessionTranscription, userId, trackingInfo);

        return {
            recap,
        };
    }
}

