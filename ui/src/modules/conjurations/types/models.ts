import { ConjurationVisibility } from '@/modules/conjurations/types/conjurationVisibility.ts';

export interface Conjuration {
  id: number;
  userId: number | undefined;
  conjurerCode: string;
  name: string;
  visibility: ConjurationVisibility;
  imageUri: string;
  data: any;
  tags?: string[];
  copies?: Conjuration[];
  originalId?: number;
  imageAIPrompt: string;
  saved: boolean;
  saves: number;
  imageGenerationFailed: boolean;
  prompt?: string;
  images?: any[];
  updatedAt?: string;
  linked?: boolean;
  campaignIds?: number[];
  inCollection: boolean;
}

export interface ConjurationListFilters {
  search: string | undefined;
  conjurerCodes: string[];
  tags: string[];
}

export interface ConjurationType {
  code: string;
  name: string;
  description: string;
  customizationHelpPrompt?: string;
  imageUri?: string;
  supportedImageStylePresets?: string[];
  proOnly?: boolean;
  experimental?: boolean;
  examples: string[];
}

export interface ConjurationListFlags {
  mine: boolean;
  saved: boolean;
}
