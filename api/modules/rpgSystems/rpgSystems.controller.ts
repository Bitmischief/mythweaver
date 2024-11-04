import { Get, Inject, OperationId, Query, Route, Security, Tags } from 'tsoa';
import { TrackingInfo } from '../../lib/tracking';
import { RpgSystemsService } from './rpgSystems.service';
import { GetRpgSystemsResponse } from './rpgSystems.interface';

@Route('rpg-systems')
@Tags('RPG Systems')
export class RpgSystemsController {
  constructor(private rpgSystemsService: RpgSystemsService) {}

  @Security('jwt')
  @OperationId('getRpgSystems')
  @Get('/')
  public async getRpgSystems(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<GetRpgSystemsResponse> {
    return this.rpgSystemsService.getRpgSystems(
      userId,
      trackingInfo,
      term,
      offset,
      limit,
    );
  }
}
