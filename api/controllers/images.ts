import { Body, Inject, OperationId, Post, Route, Security, Tags } from 'tsoa';
import { TrackingInfo } from '../lib/tracking';
import { generateImage } from '../services/imageGeneration';

interface PostImageRequest {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
}

@Route('images')
@Tags('Images')
export default class ImageController {
  @Security('jwt')
  @OperationId('generateImage')
  @Post('/')
  public async postImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostImageRequest,
  ): Promise<any> {
    return await generateImage(
      request.prompt,
      3,
      request.negativePrompt,
      request.stylePreset,
    );
  }
}
