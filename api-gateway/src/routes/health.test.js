const request = require('supertest');
const express = require('express');
const healthRouter = require('./health');

describe('Health Endpoint', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRouter);
  });

  it('should return 200 with ok status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
    });
  });

  it('should not require authentication', async () => {
    const response = await request(app)
      .get('/health')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(200);
  });
});
