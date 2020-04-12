import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import config from 'config';
import helmet from 'helmet';
import cors from 'cors';
import { JwtPayload } from 'agurk-shared';
import handleAuthenticatedConnection from './controllers/session';
import authentication from './controllers/authentication';
import logger from './logger';
import requestAuthentication from './communication/authenticationApi';
import SocketCloseCode from './socketCloseCode';

const SIGN_SECRET: string = config.get('security.jwtSignSecret');

export default function (): http.Server {
  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocket.Server({ server: httpServer });

  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  }));
  app.use(cors());
  app.use(express.json());

  app.use('/authenticate', authentication);

  wsServer.on('connection', (socket) => {
    requestAuthentication(socket)
      .then((unverifiedJwt) => {
        const verifiedJwt = jwt.verify(unverifiedJwt, SIGN_SECRET) as JwtPayload;
        return verifiedJwt.sub;
      })
      .then((subject) => {
        logger.info(`connection authenticated for subject '${subject}'. proceeding to lobby.`);
        handleAuthenticatedConnection(socket, subject);
      })
      .catch(() => {
        logger.warn('authentication for connection failed. closing connection.');
        socket.close(SocketCloseCode.AUTHENTICATION_FAILED, 'Socket connection authentication failed.');
      });
  });

  return httpServer;
}
