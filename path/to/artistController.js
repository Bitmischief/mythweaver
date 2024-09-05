// path/to/artistController.js

import { getArtistById, createArtist, updateArtist, deleteArtist } from '../dataAccess/artistDataAccess/artistRepository.js';

/**
 * Controller to get an artist by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getArtist(req, res) {
  try {
    const artistId = req.params.id;
    const artist = await getArtistById(artistId);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Controller to create a new artist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createNewArtist(req, res) {
  try {
    const artistData = req.body;
    const newArtist = await createArtist(artistData);
    res.status(201).json(newArtist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Controller to update an existing artist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateExistingArtist(req, res) {
  try {
    const artistId = req.params.id;
    const artistData = req.body;
    const updatedArtist = await updateArtist(artistId, artistData);
    if (!updatedArtist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(updatedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Controller to delete an artist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteExistingArtist(req, res) {
  try {
    const artistId = req.params.id;
    const result = await deleteArtist(artistId);
    if (!result) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

