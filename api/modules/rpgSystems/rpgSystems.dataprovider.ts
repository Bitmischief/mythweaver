import rpgSystems, { RpgSystem } from '@/data/rpgSystems';

export class RpgSystemsDataProvider {
  async getRpgSystems(
    term?: string,
    offset?: number,
    limit?: number,
  ): Promise<RpgSystem[]> {
    let filteredSystems = rpgSystems;

    if (term) {
      filteredSystems = rpgSystems.filter(
        (system) =>
          system.name.toLowerCase().includes(term.toLowerCase()) ||
          system.code?.toLowerCase().includes(term.toLowerCase()),
      );
    }

    if (offset !== undefined && limit !== undefined) {
      return filteredSystems.slice(offset, offset + limit);
    }

    return filteredSystems;
  }
}
