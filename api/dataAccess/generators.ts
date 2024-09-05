import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch all generators from the database.
 * @returns A promise that resolves to an array of generators.
 */
export const getGenerators = async () => {
  return await prisma.generators.findMany();
};

/**
 * Fetch a specific generator by its ID.
 * @param id - The ID of the generator to fetch.
 * @returns A promise that resolves to the generator object, or null if not found.
 */
export const getGeneratorById = async (id: number) => {
  return await prisma.generators.findUnique({
    where: { id },
  });
};

/**
 * Add a new generator to the database.
 * @param data - The data for the new generator.
 * @returns A promise that resolves to the created generator object.
 */
export const createGenerator = async (data: {
  name: string;
  description: string;
  formatPrompt?: string;
  imageUri?: string;
  allowsImageGeneration?: boolean;
  parent_id?: number;
  promptOverride?: string;
}) => {
  return await prisma.generators.create({
    data,
  });
};

/**
 * Update an existing generator's details.
 * @param id - The ID of the generator to update.
 * @param data - The new data for the generator.
 * @returns A promise that resolves to the updated generator object.
 */
export const updateGenerator = async (id: number, data: {
  name?: string;
  description?: string;
  formatPrompt?: string;
  imageUri?: string;
  allowsImageGeneration?: boolean;
  parent_id?: number;
  promptOverride?: string;
}) => {
  return await prisma.generators.update({
    where: { id },
    data,
  });
};

/**
 * Remove a generator from the database.
 * @param id - The ID of the generator to delete.
 * @returns A promise that resolves to the deleted generator object.
 */
export const deleteGenerator = async (id: number) => {
  return await prisma.generators.delete({
    where: { id },
  });
};

