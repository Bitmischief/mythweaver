import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch all relationships from the database.
 * @returns {Promise<any[]>} A promise that resolves to an array of relationships.
 */
export async function fetchRelationships(): Promise<any[]> {
  try {
    const relationships = await prisma.conjurationRelationships.findMany();
    return relationships;
  } catch (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }
}

/**
 * Create a new relationship in the database.
 * @param {object} data - The data for the new relationship.
 * @returns {Promise<any>} A promise that resolves to the created relationship.
 */
export async function createRelationship(data: any): Promise<any> {
  try {
    const newRelationship = await prisma.conjurationRelationships.create({
      data,
    });
    return newRelationship;
  } catch (error) {
    console.error('Error creating relationship:', error);
    throw error;
  }
}

/**
 * Update an existing relationship in the database.
 * @param {number} id - The ID of the relationship to update.
 * @param {object} data - The new data for the relationship.
 * @returns {Promise<any>} A promise that resolves to the updated relationship.
 */
export async function updateRelationship(id: number, data: any): Promise<any> {
  try {
    const updatedRelationship = await prisma.conjurationRelationships.update({
      where: { id },
      data,
    });
    return updatedRelationship;
  } catch (error) {
    console.error('Error updating relationship:', error);
    throw error;
  }
}

/**
 * Delete a relationship from the database.
 * @param {number} id - The ID of the relationship to delete.
 * @returns {Promise<any>} A promise that resolves to the deleted relationship.
 */
export async function deleteRelationship(id: number): Promise<any> {
  try {
    const deletedRelationship = await prisma.conjurationRelationships.delete({
      where: { id },
    });
    return deletedRelationship;
  } catch (error) {
    console.error('Error deleting relationship:', error);
    throw error;
  }
}

