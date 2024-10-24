import { CampaignMember } from '@prisma/client';

export interface GetCampaignMembersResponse {
  data: CampaignMember[];
  offset?: number;
  limit?: number;
}
