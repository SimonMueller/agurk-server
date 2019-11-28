import config from 'config';
import startServer from './server';
import logger from './logger';

try {
  startServer(config.get('server.port'));
} catch (error) {
  logger.error(error);
}
