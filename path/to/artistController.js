import { Request, Response } from 'express';
import { getArtists, getArtistById, createArtist, updateArtist, deleteArtist } from '../dataAccess/artistDataAccess/artistRepository';

export const fetchArtists = async (req: Request, res: Response) => {
  try {
    const artists = await getArtists();
    res.status(200).json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const fetchArtistById = async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    const artist = await getArtistById(artistId);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(artist);
  } catch (error) {
    console.error('Error fetching artist by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addArtist = async (req: Request, res: Response) => {
  try {
    const newArtist = req.body;
    const createdArtist = await createArtist(newArtist);
    res.status(201).json(createdArtist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const modifyArtist = async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    const artistUpdates = req.body;
    const updatedArtist = await updateArtist(artistId, artistUpdates);
    if (!updatedArtist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(updatedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeArtist = async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    const success = await deleteArtist(artistId);
    if (!success) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

