import { Image } from './image';

export interface NewImageResponse {
  modelId: number;
  context: any;
  image: Image;
}
