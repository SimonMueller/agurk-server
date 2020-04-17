import config from 'config';
import createServer from './server';
import logger from './logger';

try {
  const httpServer = createServer();
  const port: number = config.get('server.port');
  httpServer.listen(port, () => {
    const address = httpServer.address();
    logger.info('server listening', address);
  });
} catch (error) {
  logger.error(error);
}
