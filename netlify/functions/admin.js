import express from 'express';
import serverless from 'serverless-http';
import adminRoutes from '../../backend/routes/admin.js';

const app = express();
app.use(express.json());
app.use('/.netlify/functions/admin', adminRoutes);

export const handler = serverless(app);