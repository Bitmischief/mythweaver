import { Get, Inject, OperationId, Query, Route, Security, Tags } from "tsoa";
import { prisma } from "../lib/providers/prisma";
import rpgSystems, {
  getRpgSystem,
  PublicAdventure,
  RpgSystem,
} from "../data/rpgSystems";
import { AppEvent, track, TrackingInfo } from "../lib/tracking";

interface GetRpgSystemsResponse {
  data: RpgSystem[];
  offset?: number;
  limit?: number;
}

@Route("rpg-systems")
@Tags("RPG Systems")
export class RpgSystemController {
  @Security("jwt")
  @OperationId("getRpgSystems")
  @Get("/")
  public async getRpgSystems(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number
  ): Promise<GetRpgSystemsResponse> {
    track(AppEvent.GetRpgSystems, userId, trackingInfo);

    return {
      data: rpgSystems.slice(0, limit),
      offset: offset,
      limit: limit,
    };
  }
}
