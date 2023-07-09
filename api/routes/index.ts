import "express-async-errors";
import express from "express";

const router = express.Router();

import authRoutes from "./auth";
router.use(`/auth`, authRoutes);

import characterRoutes from "./characters";
router.use(`/characters`, characterRoutes);

import campaignRoutes from "./campaigns";
router.use(`/campaigns`, campaignRoutes);

import rpgSystemRoutes from "./rpgSystems";
router.use(`/rpg-systems`, rpgSystemRoutes);

import generatorsRoutes from "./generators";
router.use(`/generators`, generatorsRoutes);

export default router;
