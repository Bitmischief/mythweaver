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
import { AppError, HttpCode } from '../lib/errors/AppError';
import { Session } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';

interface GetSessionsResponse {
  data: Session[];
  offset?: number;
  limit?: number;
}

interface PostSessionRequest {
  campaignId: number;
  when: Date;
  summary?: string;
  transcript?: string;
  description?: string;
}

interface PatchSessionRequest {
  when: Date;
  summary?: string;
  transcript?: string;
  description?: string;
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
    @Query() campaignId: number,
    @Query() offset?: number,
    @Query() limit?: number
  ): Promise<GetSessionsResponse> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        campaignId,
      },
      skip: offset,
      take: limit,
    });

    track(AppEvent.GetSessions, userId, trackingInfo);

    return {
      data: sessions,
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
    @Route() sessionId = 0
  ): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
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

    track(AppEvent.GetSession, userId, trackingInfo);

    return session;
  }

  @Security('jwt')
  @OperationId('createSession')
  @Post('/')
  public async postSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostSessionRequest
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
    @Route() sessionId: number,
    @Body() request: PatchSessionRequest
  ): Promise<Session> {
    await this.getSession(userId, trackingInfo, sessionId);

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

    return session;
  }

  @Security('jwt')
  @OperationId('deleteSession')
  @Delete('/:sessionId')
  public async deleteSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() sessionId: number
  ): Promise<boolean> {
    await this.getSession(userId, trackingInfo, sessionId);

    await prisma.session.delete({
      where: {
        id: sessionId,
      },
    });

    track(AppEvent.DeleteSession, userId, trackingInfo);

    return true;
  }
}
