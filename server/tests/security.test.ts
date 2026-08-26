import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcrypt';

describe('Security Hardening & httpOnly Cookie Tests', () => {
  const suffix = Date.now() + Math.random().toString(36).substring(2, 7);
  const testEmail = `security_${suffix}@test.local`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    // 1. Ensure default workspace exists
    await prisma.workspace.upsert({
      where: { slug: 'acme' },
      update: {},
      create: {
        name: 'Acme Corp',
        slug: 'acme',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    }).catch(() => {});
  });

  it('should set an httpOnly token cookie on registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Security User',
      });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/');
  });

  it('should set an httpOnly token cookie on login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('should authenticate requests using httpOnly cookies without Bearer headers', async () => {
    // 1. Login to extract cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    const cookie = loginRes.headers['set-cookie'];

    // 2. Call /api/v1/auth/me using ONLY the cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testEmail);
  });

  it('should clear the token cookie on logout', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out successfully');
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'][0];
    // Expired or cleared cookie contains Max-Age=0 or Expires in past
    expect(cookie).toMatch(/token=;|Max-Age=0|Expires=/i);
  });
});
