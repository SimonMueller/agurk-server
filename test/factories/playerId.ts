import { Factory } from 'rosie';

export default Factory.define('playerId')
  .sequence('id', i => `player ${i}`)
  // return playerId as string and not as object
  .after(playerId => playerId.id);
