import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch all collections from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of collections.
 */
export async function fetchCollections() {
  try {
    return await prisma.collections.findMany();
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

/**
 * Create a new collection in the database.
 * @param {Object} data - The data for the new collection.
 * @returns {Promise<Object>} A promise that resolves to the created collection.
 */
export async function createCollection(data: { name: string; userId: number; campaignId: number; parentCollectionId?: number }) {
  try {
    return await prisma.collections.create({
      data,
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

/**
 * Update an existing collection in the database.
 * @param {number} id - The ID of the collection to update.
 * @param {Object} data - The new data for the collection.
 * @returns {Promise<Object>} A promise that resolves to the updated collection.
 */
export async function updateCollection(id: number, data: { name?: string; parentCollectionId?: number }) {
  try {
    return await prisma.collections.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * Delete a collection from the database.
 * @param {number} id - The ID of the collection to delete.
 * @returns {Promise<Object>} A promise that resolves to the deleted collection.
 */
export async function deleteCollection(id: number) {
  try {
    return await prisma.collections.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

