import express from 'express';
import conjurationsRoutes from './modules/conjurations/conjurations.routes';

const app = express();

app.use('/api/conjurations', conjurationsRoutes);
