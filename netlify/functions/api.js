import express from 'express';
import serverless from 'serverless-http';
import apiRoutes from '../../backend/routes/api.js';

const app = express();
app.use(express.json());
app.use('/.netlify/functions/api', apiRoutes);

export const handler = serverless(app);