import config from 'config';
import startServer from './server/server';
import logger from './server/logger';

try {
  startServer(config.get('server.port'));
} catch (error) {
  logger.error(error);
}
