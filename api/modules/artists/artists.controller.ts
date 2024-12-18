import { Get, Inject, Query, Route } from 'tsoa';
import { ArtistsService } from '@/modules/artists/artists.service';
import { track, TrackingInfo, AppEvent } from '@/lib/tracking';

@Route('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get('/')
  public async getArtist(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() artistId: number,
  ): Promise<any> {
    track(AppEvent.GetArtist, userId, trackingInfo);
    return this.artistsService.getArtist(artistId);
  }
}
