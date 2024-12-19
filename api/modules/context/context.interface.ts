import { ContextType } from '@prisma/client';

export interface CampaignContextConfig {
  assistantId: string;
  vectorStoreId: string;
}

export interface ReindexCampaignContextEvent {
  campaignId: number;
  eventTargetId: number;
  type: ContextType;
  data?: {
    fileUpload?: {
      uri: string;
      name: string;
    };
  };
}
