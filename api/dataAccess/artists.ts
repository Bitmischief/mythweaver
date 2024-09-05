import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to create a new artist
export async function createArtist(data: {
  name: string;
  description?: string;
  email?: string;
  profilePicUri?: string;
  callToActionUri?: string;
  dataCardUri?: string;
  profileImageUris?: string[];
}) {
  return await prisma.artist.create({
    data,
  });
}

// Function to get all artists
export async function getAllArtists() {
  return await prisma.artist.findMany();
}

// Function to get a single artist by ID
export async function getArtistById(id: number) {
  return await prisma.artist.findUnique({
    where: { id },
  });
}

// Function to update an artist
export async function updateArtist(id: number, data: {
  name?: string;
  description?: string;
  email?: string;
  profilePicUri?: string;
  callToActionUri?: string;
  dataCardUri?: string;
  profileImageUris?: string[];
}) {
  return await prisma.artist.update({
    where: { id },
    data,
  });
}

// Function to delete an artist
export async function deleteArtist(id: number) {
  return await prisma.artist.delete({
    where: { id },
  });
}

