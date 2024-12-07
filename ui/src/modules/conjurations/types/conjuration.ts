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
