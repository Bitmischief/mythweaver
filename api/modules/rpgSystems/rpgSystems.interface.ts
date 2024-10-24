import { RpgSystem } from '../../data/rpgSystems';

export interface GetRpgSystemsResponse {
  data: RpgSystem[];
  offset?: number;
  limit?: number;
}
