import { Artist } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../../lib/tracking';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { ArtistsDataProvider } from './artists.dataprovider';

export class ArtistsService {
  constructor(private artistsDataProvider: ArtistsDataProvider) {}

  public async getArtist(
    userId: number,
    trackingInfo: TrackingInfo,
    artistId: number,
  ): Promise<Artist> {
    const artist = await this.artistsDataProvider.getArtist(artistId);

    track(AppEvent.GetArtist, userId, trackingInfo);

    if (!artist) {
      throw new AppError({
        description: 'Artist not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return artist;
  }
}
