// api/dataAccess/imageModels.ts

import { PrismaClient, ImageModel } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new image model in the database.
 * @param data - The data for the new image model.
 * @returns The created image model.
 */
export async function createImageModel(data: Omit<ImageModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImageModel> {
  try {
    const imageModel = await prisma.imageModel.create({
      data,
    });
    return imageModel;
  } catch (error) {
    throw new Error(`Failed to create image model: ${error.message}`);
  }
}

/**
 * Retrieve an image model by its ID.
 * @param id - The ID of the image model.
 * @returns The image model, or null if not found.
 */
export async function getImageModelById(id: number): Promise<ImageModel | null> {
  try {
    const imageModel = await prisma.imageModel.findUnique({
      where: { id },
    });
    return imageModel;
  } catch (error) {
    throw new Error(`Failed to retrieve image model: ${error.message}`);
  }
}

/**
 * Update an existing image model.
 * @param id - The ID of the image model to update.
 * @param data - The new data for the image model.
 * @returns The updated image model.
 */
export async function updateImageModel(id: number, data: Partial<Omit<ImageModel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ImageModel> {
  try {
    const imageModel = await prisma.imageModel.update({
      where: { id },
      data,
    });
    return imageModel;
  } catch (error) {
    throw new Error(`Failed to update image model: ${error.message}`);
  }
}

/**
 * Delete an image model by its ID.
 * @param id - The ID of the image model to delete.
 * @returns The deleted image model.
 */
export async function deleteImageModel(id: number): Promise<ImageModel> {
  try {
    const imageModel = await prisma.imageModel.delete({
      where: { id },
    });
    return imageModel;
  } catch (error) {
    throw new Error(`Failed to delete image model: ${error.message}`);
  }
}

/**
 * List all image models.
 * @returns An array of image models.
 */
export async function listImageModels(): Promise<ImageModel[]> {
  try {
    const imageModels = await prisma.imageModel.findMany();
    return imageModels;
  } catch (error) {
    throw new Error(`Failed to list image models: ${error.message}`);
  }
}

