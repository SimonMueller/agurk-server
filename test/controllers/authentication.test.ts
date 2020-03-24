import request from 'supertest';
import config from 'config';
import { decode } from 'jsonwebtoken';
import { JwtPayload } from 'agurk-shared';
import createServer from '../../src/server';

const ACCESS_TOKEN: string = config.get('security.accessToken');
const AUTHENTICATION_ENDPOINT = '/authenticate';

describe('authentication controller', () => {
  const server = createServer();

  afterAll(done => server.close(done));

  test('responds with ok and json for valid access token non empty', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: 'tester', token: ACCESS_TOKEN });

    expect(response.status).toBe(200);
    expect(response.get('Content-Type')).toBe('application/json; charset=utf-8');
  });

  test('responds with unauthorized for wrong token but valid name', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: 'tester', token: 'superwrongtoken' });

    expect(response.status).toBe(401);
  });

  test('responds with bad request for missing name but valid access token', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ token: ACCESS_TOKEN });

    expect(response.status).toBe(400);
  });

  test('responds with bad request for empty name', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: '', token: ACCESS_TOKEN });

    expect(response.status).toBe(400);
  });

  test('responds with bad request for empty token', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: 'tester', token: '' });

    expect(response.status).toBe(400);
  });

  test('responds with bad request for missing token but valid name', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: 'tester' });

    expect(response.status).toBe(400);
  });

  test('responds with valid jwt with subject set and expiration in future', async () => {
    const response = await request(server)
      .post(AUTHENTICATION_ENDPOINT)
      .send({ name: 'tester', token: ACCESS_TOKEN });

    const decodedJwt = decode(response.body.jwt) as JwtPayload;
    expect(decodedJwt.sub).toContain('tester');
    const nowInSeconds = Math.floor(Date.now() / 1000);
    expect(decodedJwt.exp).toBeGreaterThan(nowInSeconds);
  });
});
