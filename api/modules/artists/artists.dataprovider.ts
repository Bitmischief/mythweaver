import { Artist } from '@prisma/client';
import { prisma } from '../../lib/providers/prisma';

export class ArtistsDataProvider {
  public async getArtist(artistId: number): Promise<Artist | null> {
    return await prisma.artist.findUnique({
      where: {
        id: artistId,
      },
    });
  }
}
