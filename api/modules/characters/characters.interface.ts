export interface PostCharactersRequest {
  campaignId: number;
  name: string;
  age: number;
  race: string;
  class: string;
  imageUri: string;
  backstory: string;
  personality: string;
  looks: string;
}

export interface PatchCharactersRequest {
  name: string;
  age: number;
  race: string;
  class: string;
  imageUri: string;
  backstory: string;
  personality: string;
  looks: string;
}
