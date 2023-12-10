import 'express-async-errors';
import express from 'express';

const router = express.Router();

import authRoutes from './auth';
router.use(`/auth`, authRoutes);

import campaignRoutes from './campaigns';
router.use(`/campaigns`, campaignRoutes);

import rpgSystemRoutes from './rpgSystems';
router.use(`/rpg-systems`, rpgSystemRoutes);

import generatorsRoutes from './generators';
router.use(`/generators`, generatorsRoutes);

import sessionsRoutes from './sessions';
router.use(`/sessions`, sessionsRoutes);

import conjurationsRoutes from './conjurations';
router.use(`/conjurations`, conjurationsRoutes);

import collectionsRoutes from './collections';
router.use(`/collections`, collectionsRoutes);

import usersRoutes from './users';
router.use(`/users`, usersRoutes);

import charactersRoutes from './characters';
router.use(`/characters`, charactersRoutes);

import imagesRoutes from './images';
router.use(`/images`, imagesRoutes);

export default router;
