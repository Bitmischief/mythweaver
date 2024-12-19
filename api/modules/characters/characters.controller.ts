import {
  Body,
  Delete,
  Inject,
  OperationId,
  Patch,
  Post,
  Path,
  Security,
  Tags,
  Route,
} from 'tsoa';
import { TrackingInfo } from '@/modules/core/analytics/tracking';
import { CharactersService } from '@/modules/characters/characters.service';
import {
  PostCharactersRequest,
  PatchCharactersRequest,
} from '@/modules/characters/characters.interface';

@Route('characters')
@Tags('Characters')
export class CharactersController {
  constructor(private charactersService: CharactersService) {}

  @Security('jwt')
  @OperationId('createCharacter')
  @Post('/')
  public async postCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostCharactersRequest,
  ): Promise<any> {
    return this.charactersService.createCharacter(
      userId,
      trackingInfo,
      request,
    );
  }

  @Security('jwt')
  @OperationId('patchCharacter')
  @Patch('/:characterId')
  public async patchCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() characterId: number,
    @Body() request: PatchCharactersRequest,
  ): Promise<any> {
    return this.charactersService.updateCharacter(
      userId,
      trackingInfo,
      characterId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('deleteCharacter')
  @Delete('/:characterId')
  public async deleteCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() characterId: number,
  ): Promise<any> {
    return this.charactersService.deleteCharacter(
      userId,
      trackingInfo,
      characterId,
    );
  }
}
