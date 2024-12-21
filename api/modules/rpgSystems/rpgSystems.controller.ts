import { Get, Inject, OperationId, Query, Security, Tags, Route } from 'tsoa';
import { TrackingInfo } from '@/modules/core/analytics/tracking';
import { RpgSystemsService } from '@/modules/rpgSystems/rpgSystems.service';
import { GetRpgSystemsResponse } from '@/modules/rpgSystems/rpgSystems.interface';

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
