import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { Session } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';

interface PostCharactersRequest {
  campaignId: number;
  name: string;
  background: string;
  personality: string;
  looks: string;
}

@Route('characters')
@Tags('Characters')
export default class CharacterController {
  @Security('jwt')
  @OperationId('createCharacter')
  @Post('/')
  public async postCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostCharactersRequest
  ): Promise<any> {
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          campaignId: request.campaignId,
          userId,
        },
      },
    });

    if (!campaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description:
          'You must be a member of the campaign to create a character.',
      });
    }

    const character = await prisma.character.create({
      data: {
        userId,
        campaignMemberId: campaignMember.id,
        ...request,
      },
    });

    track(AppEvent.GetSessions, userId, trackingInfo);

    return character;
  }
}
