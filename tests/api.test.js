import request from 'supertest';
import express from 'express';
import adminRoutes from '../backend/routes/admin.js';
import apiRoutes from '../backend/routes/api.js';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

describe('API Tests', () => {
  test('GET /api/health повинен повертати статус OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeTruthy();
  });

  test('GET /api/stats/public повинен повертати публічну статистику', async () => {
    const response = await request(app)
      .get('/api/stats/public')
      .expect(200);

    expect(response.body).toHaveProperty('totalBets');
    expect(response.body).toHaveProperty('totalUsers');
  });

  test('GET /api/admin/stats повинен повертати адмін статистику', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .expect(200);

    expect(response.body).toHaveProperty('totalUsers');
    expect(response.body).toHaveProperty('totalBets');
    expect(response.body).toHaveProperty('totalTeams');
  });

  test('GET /api/admin/teams повинен повертати список команд', async () => {
    const response = await request(app)
      .get('/api/admin/teams')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/admin/users повинен повертати список користувачів', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/admin/bets повинен повертати список ставок', async () => {
    const response = await request(app)
      .get('/api/admin/bets')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});