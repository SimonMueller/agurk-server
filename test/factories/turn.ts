import { Factory } from 'rosie';
import PlayerIdFactory from './playerId';
import { Turn } from '../../src/types/turn';

export default Factory.define<Turn>('turn')
  .sequence('playerId', i => PlayerIdFactory.build({ id: `player ${i}` }))
  .attr('cards', []);
