import {
  Body,
  Inject,
  OperationId,
  Patch,
  Post,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';

interface PostCharactersRequest {
  campaignId: number;
  name: string;
  age: number;
  race: string;
  class: string;
  imageUri: string;
  backstory: string;
  personality: string;
  looks: string;
}

interface PatchCharactersRequest {
  name: string;
  age: number;
  race: string;
  class: string;
  imageUri: string;
  backstory: string;
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
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostCharactersRequest,
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

    track(AppEvent.CreateCharacter, userId, trackingInfo);

    return character;
  }

  @Security('jwt')
  @OperationId('patchCharacter')
  @Patch('/:characterId')
  public async patchCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() characterId: number,
    @Body() request: PatchCharactersRequest,
  ): Promise<any> {
    const character = await prisma.character.findUnique({
      where: {
        id: characterId,
      },
    });

    await prisma.character.update({
      where: {
        id: characterId,
      },
      data: {
        ...request,
      },
    });

    track(AppEvent.UpdateCharacter, userId, trackingInfo);

    return character;
  }
}
