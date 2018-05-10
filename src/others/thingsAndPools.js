import exists from '../utils/existingProperty';
import XMLRequest from '../utils/XMLRequest';
import SemiPromise from '../utils/semiPromise';

// {thingId: [thing, pool, learnable]}
const cache = {};
export default cache;

// fill the cache asynchronously
// resolves to {thingId: SemiPromise<[thing, pool]>}
export const promisesPromise = exists(window, ['MEMRISE', 'garden', 'session_data', 'learnables'])
  .then(([learnables]) => learnables.reduce((promises, learnable) => {
    const thingId = learnable.thing_id;

    const thingUrl = `https://www.memrise.com/api/thing/get/?thing_id=${thingId}`;
    const poolUrl = (poolId) => `https://www.memrise.com/api/pool/get/?pool_id=${poolId}`;

    const thingPromise = XMLRequest(['GET', thingUrl])
      .then((response) => JSON.parse(response).thing);

    const poolPromise = thingPromise
      .then((thing) => XMLRequest(['GET', poolUrl(thing.pool_id)]))
      .then((response) => JSON.parse(response).pool);

    promises[thingId] = SemiPromise.all([
      thingPromise,
      poolPromise,
    ]).then(([thing, pool]) => cache[thingId] = [thing, pool]);

    return promises;
  }, {})
);
