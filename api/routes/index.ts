import 'express-async-errors';
import express from "express";

const router = express.Router();

import authRoutes from './auth';
router.use('/auth', authRoutes);

import characterRoutes from './characters';
router.use('/characters', characterRoutes);

export default router;