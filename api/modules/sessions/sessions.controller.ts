import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Path,
  Security,
  Tags,
  Route,
} from 'tsoa';
import { Session } from '@prisma/client';
import { TrackingInfo } from '@/lib/tracking';
import { SessionsService } from '@/modules/sessions/sessions.service';
import {
  GetSessionsResponse,
  PostSessionRequest,
  PatchSessionRequest,
  PostSessionAudioResponse,
  PostSessionAudioRequest,
} from '@/modules/sessions/sessions.interface';

@Route('sessions')
@Tags('Sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Security('jwt')
  @OperationId('getSessions')
  @Get('/')
  public async getSessions(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() campaignId: number,
    @Query() offset?: number,
    @Query() limit?: number,
    @Query() search?: string,
    @Query() archived = false,
  ): Promise<GetSessionsResponse> {
    return this.sessionsService.getSessions(
      userId,
      trackingInfo,
      campaignId,
      offset,
      limit,
      search,
      archived,
    );
  }

  @Security('jwt')
  @OperationId('getSession')
  @Get('/:sessionId')
  public async getSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId = 0,
  ): Promise<Session> {
    return this.sessionsService.getSession(userId, trackingInfo, sessionId);
  }

  @Security('jwt')
  @OperationId('createSession')
  @Post('/')
  public async postSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostSessionRequest,
  ): Promise<Session> {
    return await this.sessionsService.createSession(
      userId,
      trackingInfo,
      request,
    );
  }

  @Security('jwt')
  @OperationId('updateSession')
  @Patch('/:sessionId')
  public async patchSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
    @Body() request: PatchSessionRequest,
  ): Promise<Session> {
    return await this.sessionsService.updateSession(
      userId,
      trackingInfo,
      sessionId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('deleteSession')
  @Delete('/:sessionId')
  public async deleteSession(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
  ): Promise<boolean> {
    return await this.sessionsService.deleteSession(
      userId,
      trackingInfo,
      sessionId,
    );
  }

  @Security('jwt')
  @OperationId('emailSummary')
  @Post('/:sessionId/email-summary')
  public async postSessionSummaryEmail(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
  ) {
    return await this.sessionsService.postSessionSummaryEmail(
      userId,
      trackingInfo,
      sessionId,
    );
  }

  @Security('jwt')
  @OperationId('postSessionAudio')
  @Post('/:sessionId/audio')
  public async postSessionAudio(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
    @Body() request: PostSessionAudioRequest,
  ): Promise<PostSessionAudioResponse> {
    return await this.sessionsService.postSessionAudio(
      userId,
      trackingInfo,
      sessionId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('deleteSessionAudio')
  @Delete('/:sessionId/audio')
  public async deleteSessionAudio(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
  ) {
    return await this.sessionsService.deleteSessionAudio(
      userId,
      trackingInfo,
      sessionId,
    );
  }

  @Security('jwt')
  @OperationId('getTranscript')
  @Get('/:sessionId/transcript')
  public async getTranscript(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() sessionId: number,
  ): Promise<any> {
    return await this.sessionsService.getSessionTranscript(
      userId,
      trackingInfo,
      sessionId,
    );
  }
}
