import Mixpanel from 'mixpanel';
import { Request } from 'express';
import UAParser from 'ua-parser-js';
import { isProduction } from '@/lib/environments';

let mixpanel: Mixpanel.Mixpanel | undefined;

export enum AppEvent {
  LoggedIn = 'Logged In',
  Registered = 'Registered',
  SessionRefreshed = 'Session Refreshed',
  GetCampaigns = 'Get Campaigns',
  GetCampaign = 'Get Campaign',
  CreateCampaign = 'Create Campaign',
  UpdateCampaign = 'Update Campaign',
  DeleteCampaign = 'Delete Campaign',
  GetConjurations = 'Get Conjurations',
  GetConjuration = 'Get Conjuration',
  CreateConjuration = 'Create Conjuration',
  SaveConjuration = 'Save Conjuration',
  RemoveConjuration = 'Remove Conjuration',
  CopyConjuration = 'Copy Conjuration',
  UpdateConjuration = 'Update Conjuration',
  DeleteConjuration = 'Delete Conjuration',
  GetConjurationTags = 'Get ConjurationTags',
  GetConjurers = 'Get Conjurers',
  GetConjurer = 'Get Conjurer',
  ConjureImage = 'Conjure Image',
  UpscaleImage = 'Upscale Image',
  QuickConjure = 'Quick Conjure',
  Conjure = 'Conjure',
  ConjureText = 'Conjure Text',
  GetConjurationRequests = 'Get Conjuration Requests',
  GetRpgSystems = 'Get Rpg Systems',
  GetSessions = 'Get Sessions',
  GetSession = 'Get Session',
  CreateSession = 'Create Session',
  UpdateSession = 'Update Session',
  ArchiveSession = 'Archive Session',
  DeleteSession = 'Delete Session',
  CompleteSession = 'Complete Session',
  UpdateUser = 'Update User',
  GetLoggedInUser = 'Get Logged In User',
  GetCampaignMembers = 'Get Campaign Members',
  GetCharacter = 'Get Character',
  GetCharacters = 'Get Characters',
  CreateCharacter = 'Create Character',
  UpdateCharacter = 'Update Character',
  DeleteCharacter = 'Delete Character',
  SessionAudioUploaded = 'Session Audio Uploaded',
  NewSubscription = 'New Subscription',
  UpgradeSubscription = 'Upgrade Subscription',
  PaidSubscription = 'Paid Subscription',
  PreorderSubscriptionRedemption = 'Preorder Subscription Redemption',
  PaidImageCreditPack = 'Paid Image Credit Pack',
  RevenueReceived = 'Revenue Received',
  SessionTranscriptionCompleted = 'Session Transcription Completed',
  SessionTranscriptionFailed = 'Session Transcription Failed',
  SessionTranscriptionStarted = 'Session Transcription Started',
  RecapSessionTranscription = 'Recap Session Transcription',
  GenerateArbitrary = 'Generate Arbitrary',
  GenerateArbitraryFromPrompt = 'Generate Arbitrary From Prompt',
  GenerateArbitraryReplacement = 'Generate Arbitrary Replacement',
  GetImageModels = 'Get Image Models',
  GetArtist = 'Get Artist',
  ImageTimeout = 'Image Timeout',
  PostCampaignCampaign = 'Post Campaign Conjuration',
  DeleteCampaignCampaign = 'Delete Campaign Conjuration',
  CampaignFileUploaded = 'Campaign File Uploaded',
  CampaignFileDeleted = 'Campaign File Deleted',
  GetCampaignFiles = 'Get Campaign Files',
  GetUserImageGallery = 'Get User Image Gallery',
  EraseImagePortion = 'Erase Image Portion',
  Generate3DModel = 'GENERATE_3D_MODEL',
}

export interface TrackingInfo {
  browser?: string;
  browserVersion?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceVendor?: string;
  os?: string;
  osVersion?: string;
  referrer?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmMedium?: string;
  utmSource?: string;
  utmTerm?: string;
  ip?: string;
}

export const extractTrackingInfo = (req: Request): TrackingInfo => {
  const parser = new UAParser().setUA(
    req.headers['user-agent']?.toString() || '',
  );

  const ip = (
    req.headers['x-forwarded-for']?.toString() ||
    req.connection.remoteAddress?.toString() ||
    ''
  )
    .split(',')[0]
    .trim();

  return {
    browser: parser.getBrowser().name,
    browserVersion: parser.getBrowser().version,
    deviceType: parser.getDevice().type,
    deviceModel: parser.getDevice().model,
    deviceVendor: parser.getDevice().vendor,
    os: parser.getOS().name,
    osVersion: parser.getOS().version,
    referrer: req.headers['referrer']?.toString(),
    utmCampaign: req.query['utm_campaign']?.toString(),
    utmContent: req.query['utm_content']?.toString(),
    utmMedium: req.query['utm_medium']?.toString(),
    utmSource: req.query['utm_source']?.toString(),
    utmTerm: req.query['utm_term']?.toString(),
    ip,
  };
};

const init = () => {
  if (!isProduction) return;

  if (!mixpanel) {
    mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN as string);
  }
};

export const track = (
  event: AppEvent,
  userId: number,
  trackingInfo?: TrackingInfo | undefined,
  properties: any = {},
) => {
  if (process.env.API_URL !== 'https://api.mythweaver.co') return;

  init();

  mixpanel?.track(event.toString(), {
    distinct_id: userId,
    ...properties,
    ...trackingInfo,
  });
};

export const identify = (userId: number, properties: any = {}) => {
  init();
  mixpanel?.people.set(userId.toString(), properties);
};
