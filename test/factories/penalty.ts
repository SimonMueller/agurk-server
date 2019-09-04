import { Factory } from 'rosie';
import PlayerIdFactory from './playerId';
import { createSuitCard } from '../../shared/game/card';
import { Suit } from '../../shared/types/card';

export default Factory.define('penalty')
  .sequence('playerId', i => PlayerIdFactory.build({ id: `player ${i}` }))
  .attr('card', () => createSuitCard(13, Suit.HEARTS));
