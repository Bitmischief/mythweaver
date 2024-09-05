import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch an image by its ID.
 * @param id - The ID of the image to retrieve.
 * @returns The image record or null if not found.
 */
export async function getImage(id: number) {
  try {
    return await prisma.image.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Could not fetch image');
  }
}

/**
 * Create a new image record.
 * @param data - The data for the new image.
 * @returns The created image record.
 */
export async function createImage(data: {
  userId: number;
  uri: string;
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
  seed?: string;
  primary?: boolean;
  upscaled?: boolean;
  generating?: boolean;
  failed?: boolean;
  conjurationId?: number;
  sessionId?: number;
  characterId?: number;
  modelId?: number;
}) {
  try {
    return await prisma.image.create({
      data,
    });
  } catch (error) {
    console.error('Error creating image:', error);
    throw new Error('Could not create image');
  }
}

/**
 * Update an existing image record.
 * @param id - The ID of the image to update.
 * @param data - The new data for the image.
 * @returns The updated image record.
 */
export async function updateImage(id: number, data: Partial<{
  userId: number;
  uri: string;
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
  seed?: string;
  primary?: boolean;
  upscaled?: boolean;
  generating?: boolean;
  failed?: boolean;
  conjurationId?: number;
  sessionId?: number;
  characterId?: number;
  modelId?: number;
}>) {
  try {
    return await prisma.image.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating image:', error);
    throw new Error('Could not update image');
  }
}

/**
 * Delete an image record.
 * @param id - The ID of the image to delete.
 * @returns The deleted image record.
 */
export async function deleteImage(id: number) {
  try {
    return await prisma.image.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Could not delete image');
  }
}

