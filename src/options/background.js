/* global Store */

import deepmerge, { oldArrayMerge } from '../utils/deepmerge';
// import SemiPromise from '../utils/semiPromise';
const settingsPrefix = 'store.settings.';

// initializing the settings
const settings = new Store('settings', {
  replaceKanaMultipleChoiceWithTyping: true,
  replaceKanjiTypingWithMultipleChoice: true,
  makeKanjiMultipleChoicesMoreSimilar: true,
  alwaysPauseTimer: true,
  preventUnpausing: true,
  timerClickToggle: true,
  autocompleteOnTab: true,
  useWanakana: true,
  showKanjiAfterCorrect: true,
  useCustomThings: true,
  noOnscreenKeyboard: true,
  noAutoAccept: true,
  customThings: {},
});

window.bla = settings;

const xml = (openArgs, sendArgs=[]) => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.addEventListener('load', () => (request.status === 200? resolve: reject)(request.response));
  request.open(...openArgs);
  request.send(...sendArgs);
});

console.log('custom', settings.get('customThings'));

// const newStuff = {};
// const proms = [];
//
// Object.entries(settings.get('customThings')).forEach(([thingId, thingColumns]) => {
//   const thingPromise = xml(['GET', `https://www.memrise.com/api/thing/get/?thing_id=${thingId}`])
//     .then((response) => JSON.parse(response).thing);
//   const poolPromise = thingPromise
//     .then((thing) => thing.pool_id)
//     .then((poolId) => xml(['GET', `https://www.memrise.com/api/pool/get/?pool_id=${poolId}`]))
//     .then((response) => JSON.parse(response).pool)
//     .then((pool) => {
//       if (pool.id in newStuff) {
//         newStuff[pool.id].thingsColumns[thingId] = thingColumns;
//       } else {
//         newStuff[pool.id] = { poolColumns: Object.entries(pool.columns).filter(([columnsId, column]) => column.kind === 'text')
//             .reduce((acc, [columnId, column]) => {acc[columnId] = column.label; return acc}, {}), thingsColumns: { thingId: thingColumns } };
//       }
//     });
//   proms.push(thingPromise);
//   proms.push(poolPromise);
// });
//
// Promise.all(proms).then(() => {
//   console.log(newStuff);
//   settings.set('customThings', newStuff);
// });

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'getSettings':
      sendResponse(settings.toObject());
      break;
    case 'setValue':
      settings.set(request.key, request.value);
      break;
    case 'mergeValue':
      settings.set(request.key, deepmerge(
        settings.get(request.key),
        request.value,
        { arrayMerge: oldArrayMerge }));
      break;
    case 'getThing': {
      const thing = settings.get('customThings')[request.thingId];
      if (thing === undefined) sendResponse({});
      else sendResponse(thing);
      break;
    }
  }
});

window.addEventListener('storage', (event) => {
  chrome.tabs.query({}, (tabs) => {
    const message = {
      type: 'setValue',
      key: event.key.slice(settingsPrefix.length),
      old: event.oldValue,
      value: event.newValue,
    };
    // broadcast
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
});
