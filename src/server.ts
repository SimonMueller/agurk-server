import WebSocket from 'ws';
import http from 'http';
import handleConnection from './controllers/session';
import logger from './logger';

export default function (port: number): void {
  const server = http.createServer();
  const wsServer = new WebSocket.Server({ server });

  wsServer.on('connection', ws => handleConnection(ws));

  server.listen(port, () => {
    const address = server.address();
    logger.info(`server listening on ${JSON.stringify(address)}`);
  });
}
