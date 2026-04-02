import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('app api', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('blocks protected user routes without token', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('blocks protected admin routes without token', async () => {
    const response = await request(app).get('/adms');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });
});