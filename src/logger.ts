import winston from 'winston';
import config from 'config';

const DEBUG: boolean = config.get('logging.debug');
const LOCAL: boolean = config.get('logging.local');

export default winston.createLogger({
  level: DEBUG ? 'debug' : 'info',
  format: LOCAL ? winston.format.prettyPrint({ depth: 10, colorize: true }) : winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});
