import { Factory } from 'rosie';
import createMockedPlayerApi from '../mocks/playerApi';
import PlayerIdFactory from './playerId';

export default Factory.define('player')
  .sequence('id', i => PlayerIdFactory.build({ id: `player ${i}` }))
  .attr('api', () => createMockedPlayerApi());
