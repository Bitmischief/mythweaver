import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsDataProvider } from './sessions.dataprovider';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { CampaignsDataProvider } from '../campaigns/campaigns.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { AssemblyAIProvider } from '../../providers/assemblyAI';
import { SessionTranscriptWorker } from './sessionTranscript.worker';
import { TranscriptionService } from './transcription.service';
import { EmailProvider } from '../../providers/emailProvider';
import { WebSocketProvider } from '../../providers/websocketProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  sessionsController: asClass(SessionsController).scoped(),
  sessionsService: asClass(SessionsService).scoped(),
  sessionsDataProvider: asClass(SessionsDataProvider).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
  assemblyAIProvider: asClass(AssemblyAIProvider).scoped(),
  sessionTranscriptWorker: asClass(SessionTranscriptWorker).singleton(),
  transcriptionService: asClass(TranscriptionService).scoped(),
  emailProvider: asClass(EmailProvider).singleton(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
  logger: asFunction(useLogger).scoped(),
});

export const injectDependencies = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.container = container.createScope();
  next();
};
