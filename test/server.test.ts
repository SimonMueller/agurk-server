import { AddressInfo } from 'net';
import WebSocket from 'ws';
import request from 'supertest';
import { Server } from 'http';
import { MessageName } from 'agurk-shared';
import jwt from 'jsonwebtoken';
import config from 'config';
import createServer from '../src/server';

const SIGN_SECRET: string = config.get('security.jwtSignSecret');

function setupWebSocket(address: AddressInfo): WebSocket {
  return new WebSocket(`ws://${address.address}:${address.port}`);
}

describe('websocket server', () => {
  let server: Server;

  beforeAll((done) => {
    jest.useFakeTimers();
    server = createServer().listen(0, 'localhost', done);
  });

  afterAll((done) => {
    jest.useRealTimers();
    server.close(done);
  });

  test('accepts connection from client', (done) => {
    const webSocket = setupWebSocket(server.address() as AddressInfo);

    webSocket.once('open', () => {
      webSocket.close();
      done();
    });
  });

  test('first message from server is an authentication request', (done) => {
    const webSocket = setupWebSocket(server.address() as AddressInfo);

    webSocket.once('message', (rawMessage: string) => {
      const message = JSON.parse(rawMessage);
      expect(message.name).toBe(MessageName.REQUEST_AUTHENTICATION);
      webSocket.close();
      done();
    });
  });

  test('closes connection after timeout if no response to authentication request', (done) => {
    const webSocket = setupWebSocket(server.address() as AddressInfo);

    webSocket.once('message', () => jest.runAllTimers());
    webSocket.once('close', () => done());
  });

  test('lets player join lobby and broadcasts players after correct authentication with token', (done) => {
    const webSocket = setupWebSocket(server.address() as AddressInfo);

    webSocket.once('message', () => {
      webSocket.send(JSON.stringify({
        name: MessageName.AUTHENTICATE,
        data: jwt.sign({}, SIGN_SECRET, { subject: 'tester' }),
      }));

      webSocket.once('message', (rawMessage: string) => {
        const message = JSON.parse(rawMessage);
        expect(message.name).toBe(MessageName.BROADCAST_LOBBY_PLAYERS);
        webSocket.close();
        done();
      });
    });
  });
});

describe('http server', () => {
  const server = createServer();

  afterAll(done => server.close(done));

  test('accepts request from client and sends arbitrary status code', async () => {
    const response = await request(server).get('/');
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
