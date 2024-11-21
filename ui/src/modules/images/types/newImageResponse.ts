import { Image } from './image';

export interface NewImageResponse {
  modelName: string;
  modelId: number;
  context: any;
  image: Image;
}
