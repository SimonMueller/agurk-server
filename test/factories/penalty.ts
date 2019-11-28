import { createSuitCard, Suits } from 'agurk-shared';
import { Factory } from 'rosie';
import PlayerIdFactory from './playerId';

export default Factory.define('penalty')
  .sequence('playerId', i => PlayerIdFactory.build({ id: `player ${i}` }))
  .attr('card', () => createSuitCard(13, Suits.HEARTS));
