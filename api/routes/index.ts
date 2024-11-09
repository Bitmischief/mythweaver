import 'express-async-errors';
import express from 'express';

const router = express.Router({ mergeParams: true });

import artistsRoutes from '../modules/artists/artists.routes';

router.use(`/artists`, artistsRoutes);

import billingRoutes from '../modules/billing/billing.routes';

router.use(`/billing`, billingRoutes);

import campaignRoutes from '../modules/campaigns/campaigns.routes';

router.use(`/campaigns`, campaignRoutes);

import campaignConjurationsRoutes from '../modules/campaigns/conjurations/campaignConjurations.routes';

router.use(`/campaigns/:campaignId/conjurations`, campaignConjurationsRoutes);

import campaignFilesRoutes from '../modules/campaigns/files/campaignFiles.routes';

router.use(`/campaigns/:campaignId/files`, campaignFilesRoutes);

import membersRoutes from '../modules/campaigns/members/members.routes';

router.use(`/campaigns/:campaignId/members`, membersRoutes);

import rpgSystemsRoutes from '../modules/rpgSystems/rpgSystems.routes';

router.use('/rpg-systems', rpgSystemsRoutes);

import generatorsRoutes from '../modules/generators/generators.routes';

router.use('/generators', generatorsRoutes);

import sessionsRoutes from '../modules/sessions/sessions.routes';

router.use(`/sessions`, sessionsRoutes);

import conjurationsRoutes from '../modules/conjurations/conjurations.routes';

router.use(`/conjurations`, conjurationsRoutes);

import usersRoutes from '../modules/users/users.routes';

router.use(`/users`, usersRoutes);

import charactersRoutes from '../modules/characters/characters.routes';

router.use('/characters', charactersRoutes);

import imagesRoutes from '../modules/images/images.routes';

router.use(`/images`, imagesRoutes);

import relationshipRoutes from '../modules/conjurations/relationships/relationships.routes';

router.use(`/relationships`, relationshipRoutes);

import imageModelRoutes from '../modules/imageModels/imageModels.routes';

router.use(`/models/images`, imageModelRoutes);

import collectionsRoutes from '../modules/collections/collections.routes';

router.use(`/collections`, collectionsRoutes);

import integrationRoutes from '../modules/integrations/integrations.routes';

router.use(`/integrations`, integrationRoutes);

import versionRoutes from './version';

router.use(`/version`, versionRoutes);

export default router;
