import { Get, Inject, OperationId, Route, Security, Tags } from 'tsoa';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';
import { prisma } from '../lib/providers/prisma';
import { Artist } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';

@Route('artists/:artistId')
@Tags('Artists')
export class ArtistController {
  @Get('/:artistId')
  @Security('jwt')
  @OperationId('getArtist')
  public async getArtist(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() artistId: number,
  ): Promise<Artist> {
    const artist = await prisma.artist.findUnique({
      where: {
        id: artistId,
      },
    });

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
