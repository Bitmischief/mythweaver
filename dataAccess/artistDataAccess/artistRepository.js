// dataAccess/artistDataAccess/artistRepository.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger'); // Assuming there's a logger utility

/**
 * Fetch all artists from the database.
 * @returns {Promise<Array>} List of artists.
 */
async function getAllArtists() {
  try {
    const artists = await prisma.artist.findMany();
    logger.info('Fetched all artists');
    return artists;
  } catch (error) {
    logger.error('Error fetching artists:', error);
    throw new Error('Could not fetch artists');
  }
}

/**
 * Fetch a single artist by ID.
 * @param {number} id - The ID of the artist to fetch.
 * @returns {Promise<Object>} The artist object.
 */
async function getArtistById(id) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
    });
    if (!artist) {
      throw new Error('Artist not found');
    }
    logger.info(`Fetched artist with ID: ${id}`);
    return artist;
  } catch (error) {
    logger.error(`Error fetching artist with ID ${id}:`, error);
    throw new Error('Could not fetch artist');
  }
}

/**
 * Create a new artist in the database.
 * @param {Object} artistData - The data of the artist to create.
 * @returns {Promise<Object>} The created artist object.
 */
async function createArtist(artistData) {
  try {
    const newArtist = await prisma.artist.create({
      data: artistData,
    });
    logger.info('Created new artist:', newArtist);
    return newArtist;
  } catch (error) {
    logger.error('Error creating artist:', error);
    throw new Error('Could not create artist');
  }
}

/**
 * Update an existing artist in the database.
 * @param {number} id - The ID of the artist to update.
 * @param {Object} artistData - The new data for the artist.
 * @returns {Promise<Object>} The updated artist object.
 */
async function updateArtist(id, artistData) {
  try {
    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: artistData,
    });
    logger.info(`Updated artist with ID: ${id}`);
    return updatedArtist;
  } catch (error) {
    logger.error(`Error updating artist with ID ${id}:`, error);
    throw new Error('Could not update artist');
  }
}

/**
 * Delete an artist from the database.
 * @param {number} id - The ID of the artist to delete.
 * @returns {Promise<void>}
 */
async function deleteArtist(id) {
  try {
    await prisma.artist.delete({
      where: { id },
    });
    logger.info(`Deleted artist with ID: ${id}`);
  } catch (error) {
    logger.error(`Error deleting artist with ID ${id}:`, error);
    throw new Error('Could not delete artist');
  }
}

module.exports = {
  getAllArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
};

