import { prisma } from '@/providers/prisma';
import { Character } from '@prisma/client';

export class CharactersDataProvider {
  async createCharacter(data: any): Promise<Character> {
    return prisma.character.create({
      data,
    });
  }

  async getCharacter(characterId: number): Promise<Character | null> {
    return prisma.character.findUnique({
      where: {
        id: characterId,
      },
    });
  }

  async updateCharacter(characterId: number, data: any): Promise<Character> {
    return prisma.character.update({
      where: {
        id: characterId,
      },
      data,
    });
  }

  async deleteCharacter(characterId: number): Promise<void> {
    await prisma.character.delete({
      where: {
        id: characterId,
      },
    });
  }
}
