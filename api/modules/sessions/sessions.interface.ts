import { Session } from '@prisma/client';

export interface GetSessionsResponse {
  data: Session[];
  offset?: number;
  limit?: number;
}

export interface PostSessionRequest {
  campaignId: number;
  name: string;
}

export interface PatchSessionRequest {
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

export interface PostSessionAudioRequest {
  audioName: string;
  audioUri: string;
}

export interface PostSessionAudioResponse {
  audioName: string;
  audioUri: string;
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
