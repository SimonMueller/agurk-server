import { Factory } from 'rosie';
import PlayerIdFactory from './playerId';

export default Factory.define('turn')
  .sequence('playerId', i => PlayerIdFactory.build({ id: `player ${i}` }))
  .attr('cards', []);
