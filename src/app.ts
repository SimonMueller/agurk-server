import config from 'config';
import createServer from './server';
import logger from './logger';

try {
  const httpServer = createServer();
  httpServer.listen(config.get('server.port'), () => {
    const address = httpServer.address();
    logger.info(`server listening on ${JSON.stringify(address)}`);
  });
} catch (error) {
  logger.error(error);
}
