import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import config from 'config';
import cors from 'cors';
import handleAuthenticatedConnection from './controllers/session';
import authenticate from './controllers/authenticate';
import logger from './logger';
import requestAuthentication from './communication/authenticationApi';

const SIGN_SECRET: string = config.get('security.jwtSignSecret');

export default function (port: number): void {
  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocket.Server({ server: httpServer });

  app.use(cors());
  app.use('/authenticate', authenticate);

  wsServer.on('connection', (socket) => {
    requestAuthentication(socket)
      .then((unverifiedJwt) => {
        const verifiedJwt = jwt.verify(unverifiedJwt, SIGN_SECRET) as { sub: string };
        return verifiedJwt.sub;
      })
      .then((subject) => {
        logger.info(`connection authenticated for subject '${subject}'. proceeding to lobby.`);
        handleAuthenticatedConnection(socket, subject);
      })
      .catch(error => logger.error(error))
      .catch(() => {
        logger.warn('authentication for connection failed. closing connection.');
        socket.close();
      });
  });

  httpServer.listen(port, () => {
    const address = httpServer.address();
    logger.info(`server listening on ${JSON.stringify(address)}`);
  });
}
