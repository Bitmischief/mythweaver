import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, ErrorType, HttpCode } from '../lib/errors/AppError';
import { BillingPlan, Session } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { CampaignRole } from './campaigns';
import { sendTransactionalEmail } from '../lib/transactionalEmail';
import { urlPrefix } from '../lib/utils';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';
import { MythWeaverLogger } from '../lib/logger';
import {
  recapTranscription,
  transcribeSessionAudio,
} from '../services/transcription';
import { JsonObject } from '@prisma/client/runtime/library';
import { format } from 'date-fns';
import { getTranscription } from '../services/dataStorage';
import { getClient } from '../lib/providers/openai';
import { indexSessionContext } from '../dataAccess/sessions';

interface GetSessionsResponse {
  data: Session[];
  offset?: number;
  limit?: number;
}

interface PostSessionRequest {
  campaignId: number;
  name: string;
}

interface PatchSessionRequest {
  name?: string;
  imageUri?: string;
  planning?: string;
  recap?: string;
  summary?: string;
  transcript?: string;
  suggestions?: string;
  planningJson?: any;
  date?: string;
  completed?: boolean;
}

interface PostCompleteSessionRequest {
  recap: string;
}

interface PostSessionAudioRequest {
  audioName: string;
  audioUri: string;
}

interface PostSessionAudioResponse {
  audioName: string;
  audioUri: string;
}

interface PatchSessionTranscriptionRequest {
  status: TranscriptionStatus;
}

export enum SessionStatus {
  UPCOMING = 1,
  COMPLETED = 2,
}

export enum TranscriptionStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Route('sessions')
@Tags('Sessions')
export default class SessionController {
  @Security('jwt')
  @OperationId('getSessions')
  @Get('/')
  public async getSessions(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() campaignId: number,
    @Query() offset?: number,
    @Query() limit?: number,
    @Query() search?: string,
    @Query() archived = false,
  ): Promise<GetSessionsResponse> {
    const sessions = await prisma.session.findMany({
      where: {
        campaignId,
        archived,
        name: {
          search: search,
        },
        campaign: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        date: 'desc',
      },
      include: {
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

    track(AppEvent.GetSessions, userId, trackingInfo);

    return {
      data: sessions.map((s) => ({
        ...s,
        imageUri: s.images.find((i) => i.primary)?.uri || null,
      })),
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('getSession')
  @Get('/:sessionId')
  public async getSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId = 0,
  ): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
        campaign: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      include: {
        sessionTranscription: true,
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

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

  @Security('jwt')
  @OperationId('createSession')
  @Post('/')
  public async postSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostSessionRequest,
  ): Promise<Session> {
    const session = await prisma.session.create({
      data: {
        userId,
        ...request,
      },
    });

    track(AppEvent.CreateSession, userId, trackingInfo);

    return session;
  }

  @Security('jwt')
  @OperationId('updateSession')
  @Patch('/:sessionId')
  public async patchSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
    @Body() request: PatchSessionRequest,
  ): Promise<Session> {
    await this.getSession(userId, trackingInfo, logger, sessionId);

    const session = await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        userId,
        ...request,
      },
    });

    track(AppEvent.UpdateSession, userId, trackingInfo);
    await sendWebsocketMessage(userId, WebSocketEvent.SessionUpdated, {});

    await indexSessionContext(session.campaignId, sessionId);

    return session;
  }

  @Security('jwt')
  @OperationId('deleteSession')
  @Delete('/:sessionId')
  public async deleteSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
  ): Promise<boolean> {
    const session = await this.getSession(
      userId,
      trackingInfo,
      logger,
      sessionId,
    );

    // @TODO: delete session context file

    if (!session.archived) {
      await prisma.session.update({
        where: {
          id: sessionId,
        },
        data: {
          archived: true,
        },
      });
      track(AppEvent.ArchiveSession, userId, trackingInfo);
    } else {
      await prisma.session.delete({
        where: {
          id: sessionId,
        },
      });
      track(AppEvent.DeleteSession, userId, trackingInfo);
    }

    return true;
  }

  @Security('jwt')
  @OperationId('generateSummary')
  @Post('/generate-summary')
  public async postGenerateSummary(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostCompleteSessionRequest,
  ): Promise<any> {
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
          content: `Please summarize the ttrpg session that just happened, that has the following details:
          ${request?.recap}.
          Please return only text, do not include any other formatting.
          Please make the length of the summary proportional to the length of the recap,
          ensuring you include the most important highlights from the recap.`,
        },
      ],
    });

    const gptResponse = response.choices[0]?.message?.content;
    logger.info('Received raw response from openai', gptResponse);

    return gptResponse;
  }

  @Security('jwt')
  @OperationId('recapTranscription')
  @Post('/:sessionId/recap-transcription')
  public async postRecapTranscription(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
  ): Promise<Session> {
    let session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        sessionTranscription: true,
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

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

    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: session.campaignId,
        },
      },
    });

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

    if (session.sessionTranscription.transcription) {
      const transcription = session.sessionTranscription
        .transcription as JsonObject;
      const recap = await recapTranscription(transcription.text as string);
      if (recap) {
        session = await prisma.session.update({
          where: {
            id: sessionId,
          },
          data: {
            suggestedRecap: recap,
          },
          include: {
            sessionTranscription: true,
            images: {
              where: {
                primary: true,
              },
            },
          },
        });
      }

      await indexSessionContext(session.campaignId, sessionId);
    }

    track(AppEvent.RecapSessionTranscription, userId, trackingInfo);

    return session;
  }

  @Security('jwt')
  @OperationId('emailSummary')
  @Post('/:sessionId/email-summary')
  public async postSessionSummaryEmail(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
  ) {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

    if (!session) {
      logger.warn('Session not found', sessionId);

      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: session?.campaignId,
      },
      include: {
        members: {
          where: {
            NOT: [
              {
                joinedAt: null,
              },
            ],
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!campaign) {
      logger.warn('Campaign not found', sessionId);

      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    for (const member of campaign.members) {
      const email = member.user?.email;
      await sendTransactionalEmail(
        'post-session',
        `MythWeaver Session Recap: ${
          session.date
            ? format(session.date, 'MMM d, yyyy @ h:mm a')
            : campaign.name
        }`,
        email || '',
        [
          {
            name: 'CHARACTER_NAME',
            content: member.user?.username || '',
          },
          {
            name: 'CAMPAIGN_NAME',
            content: campaign.name,
          },
          {
            name: 'SESSION_NAME',
            content: session.name || '',
          },
          {
            name: 'SESSION_DATE',
            content: session.date
              ? format(session.date, 'MMM d, yyyy @ h:mm a')
              : 'TBD',
          },
          {
            name: 'SUMMARY',
            content: session.summary || '',
          },
          {
            name: 'SESSION_URL',
            content: `${urlPrefix}/sessions/${session?.id}#overview`,
          },
          {
            name: 'SESSION_IMAGE_URI',
            content: session.images.find((i) => i.primary)?.uri || '',
          },
        ],
      );
    }
  }

  @Security('jwt')
  @OperationId('postSessionAudio')
  @Post('/:sessionId/audio')
  public async postSessionAudio(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
    @Body() request: PostSessionAudioRequest,
  ): Promise<PostSessionAudioResponse> {
    const session = await this.getSession(
      userId,
      trackingInfo,
      logger,
      sessionId,
    );

    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
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

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

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

    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        audioName: request.audioName,
        audioUri: request.audioUri,
      },
    });

    track(AppEvent.SessionAudioUploaded, userId, trackingInfo);

    return {
      audioName: request.audioName,
      audioUri: request.audioUri,
    };
  }

  @Security('jwt')
  @OperationId('postSessionTranscription')
  @Post('/:sessionId/transcription')
  public async postSessionTranscription(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Inject() requestId: string,
    @Route() sessionId: number,
  ) {
    const session = await this.getSession(
      userId,
      trackingInfo,
      logger,
      sessionId,
    );

    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: session.campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to perform a transcription for this session.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

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

    const response = await transcribeSessionAudio({
      userId: userId,
      sessionId: session.id,
      audioUri: session.audioUri,
      requestId: requestId,
    });

    const sessionTranscription = await prisma.sessionTranscription.findUnique({
      where: {
        sessionId: sessionId,
      },
    });

    const data = {
      userId: userId,
      sessionId: sessionId,
      callId: response?.data.call_id,
      status: TranscriptionStatus.PROCESSING,
    };

    if (!sessionTranscription) {
      await prisma.sessionTranscription.create({
        data: data,
      });
    } else {
      await prisma.sessionTranscription.update({
        where: {
          sessionId: sessionId,
        },
        data: data,
      });
    }

    await indexSessionContext(session.campaignId, sessionId);

    return;
  }

  @Security('service_token')
  @OperationId('patchSessionTranscription')
  @Patch('/:sessionId/transcription')
  public async patchSessionTranscription(
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() sessionId: number,
    @Body() request: PatchSessionTranscriptionRequest,
  ): Promise<void> {
    logger.info('Transcription upload request for sessionId: ', sessionId);

    const sessionTranscription = await prisma.sessionTranscription.findFirst({
      where: {
        sessionId: sessionId,
      },
    });

    if (!sessionTranscription) {
      throw new AppError({
        description: 'Session transcription not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const transcription = await getTranscription(sessionId);

    await prisma.sessionTranscription.update({
      where: {
        sessionId: sessionId,
      },
      data: {
        status: request.status,
        transcription: transcription,
      },
    });

    if (request.status === TranscriptionStatus.COMPLETED) {
      track(
        AppEvent.SessionTranscriptionCompleted,
        sessionTranscription.userId,
        trackingInfo,
      );
      await sendWebsocketMessage(
        sessionTranscription.userId,
        WebSocketEvent.TranscriptionComplete,
        sessionId,
      );
    } else if (request.status === TranscriptionStatus.FAILED) {
      track(
        AppEvent.SessionTranscriptionFailed,
        sessionTranscription.userId,
        trackingInfo,
      );

      throw new AppError({
        description: 'There was an error transcribing your session.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: sessionTranscription.userId,
          errorCode: ErrorType.TranscriptionError,
          context: {
            userId: sessionTranscription.userId,
            sessionId: sessionId,
          },
        },
      });
    }

    return;
  }
}
