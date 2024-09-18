import 'express-async-errors';
import express from 'express';

const router = express.Router();

import authRoutes from './auth';

router.use(`/auth`, authRoutes);

import billingRoutes from './billing';

router.use(`/billing`, billingRoutes);

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

import usersRoutes from './users';

router.use(`/users`, usersRoutes);

import charactersRoutes from './characters';

router.use(`/characters`, charactersRoutes);

import imagesRoutes from './images';

router.use(`/images`, imagesRoutes);

import relationshipRoutes from './relationships';

router.use(`/relationships`, relationshipRoutes);

import imageModelRoutes from './imageModels';

router.use(`/models/images`, imageModelRoutes);

import collectionsRoutes from './collections';

router.use(`/collections`, collectionsRoutes);

import integrationRoutes from './integrations';

router.use(`/integrations`, integrationRoutes);

import versionRoutes from './version';

router.use(`/version`, versionRoutes);

export default router;
