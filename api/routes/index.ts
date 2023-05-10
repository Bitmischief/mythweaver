import 'express-async-errors';
import express from "express";

const router = express.Router();
const BASE_ROUTE = '/api';

import authRoutes from './auth';
router.use(`${BASE_ROUTE}/auth`, authRoutes);

import characterRoutes from './characters';
router.use(`${BASE_ROUTE}/characters`, characterRoutes);

export default router;