import { Get, Inject, OperationId, Route, Security, Tags } from 'tsoa';
import { TrackingInfo } from '../../lib/tracking';
import { Artist } from '@prisma/client';
import { ArtistsService } from './artists.service';

@Route('artists/:artistId')
@Tags('Artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get('/:artistId')
  @Security('jwt')
  @OperationId('getArtist')
  public async getArtist(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() artistId: number,
  ): Promise<Artist> {
    return await this.artistsService.getArtist(userId, trackingInfo, artistId);
  }
}
