import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { SessionsController } from '@/modules/sessions/sessions.controller';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { SessionsDataProvider } from '@/modules/sessions/sessions.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { EmailProvider } from '@/providers/emailProvider';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { ContextService } from '@/modules/context/context.service';
import { SessionTranscriptWorker } from './sessionTranscript.worker';
import { AssemblyAIProvider } from '@/providers/assemblyAI';
import { TranscriptionService } from './transcription.service';

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
  contextService: asClass(ContextService).scoped(),
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
