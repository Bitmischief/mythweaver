import { Artist } from '@prisma/client';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { ArtistsDataProvider } from '@/modules/artists/artists.dataprovider';

export class ArtistsService {
  constructor(private artistsDataProvider: ArtistsDataProvider) {}

  public async getArtist(artistId: number): Promise<Artist> {
    const artist = await this.artistsDataProvider.getArtist(artistId);

    if (!artist) {
      throw new AppError({
        description: 'Artist not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return artist;
  }
}
