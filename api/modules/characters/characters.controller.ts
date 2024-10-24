import {
  Body,
  Delete,
  Inject,
  OperationId,
  Patch,
  Post,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '../../lib/tracking';
import { CharactersService } from './characters.service';
import {
  PostCharactersRequest,
  PatchCharactersRequest,
} from './characters.interface';

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
    @Route() characterId: number,
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
    @Route() characterId: number,
  ): Promise<any> {
    return this.charactersService.deleteCharacter(
      userId,
      trackingInfo,
      characterId,
    );
  }
}
