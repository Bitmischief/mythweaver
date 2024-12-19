import {
  AppEvent,
  track,
  TrackingInfo,
} from '@/modules/core/analytics/tracking';
import { RpgSystemsDataProvider } from './rpgSystems.dataprovider';
import { GetRpgSystemsResponse } from './rpgSystems.interface';

export class RpgSystemsService {
  constructor(private rpgSystemsDataProvider: RpgSystemsDataProvider) {}

  async getRpgSystems(
    userId: number,
    trackingInfo: TrackingInfo,
    term?: string,
    offset?: number,
    limit?: number,
  ): Promise<GetRpgSystemsResponse> {
    const rpgSystems = await this.rpgSystemsDataProvider.getRpgSystems(
      term,
      offset,
      limit,
    );

    track(AppEvent.GetRpgSystems, userId, trackingInfo);

    return {
      data: rpgSystems,
      offset,
      limit,
    };
  }
}
