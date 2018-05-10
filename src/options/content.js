/* global channel, optionsReady */

import SemiPromise from '../utils/semiPromise';

// to merge settings
import deepmerge, { oldArrayMerge } from '../utils/deepmerge';

// cache
const options = {};

const mergeValue = (key, value) => {
  options[key] = deepmerge(
    options[key],
    value,
    { arrayMerge: oldArrayMerge });
};

const send = (key, value, method, target) => {
  const type = {
    set: 'setValue',
    get: 'getValue',
  }[method];
  const func = {
    inject: channel.send.bind(channel),
    background: chrome.runtime.sendMessage.bind(chrome.runtime),
  }[target];
  func({ type, key, value: JSON.stringify(value) });
};

// the object that will be accessible to the content and injected scripts
const optionsManager = {
  getValue(key) {
    // access cache
    return options[key];
  },
  setValue(key, value) {
    // update cache and tell both the injected and background script to update their caches too
    options[key] = value;
    send(key, value, 'set', 'inject');
    send(key, value, 'set', 'background');
  },
  mergeValue(key, value) {
    // update cache and tell both the injected and background script to update their caches too
    mergeValue(key, value);
    send(key, value, 'merge', 'inject');
    send(key, value, 'merge', 'background');
  },
};

// setup the communication with the injected script
channel.onReceive((request) => {
  switch (request.type) {
    case 'setValue':
      // update cache and tell the background script to update its cache
      options[request.key] = request.value;
      send(request.key, request.value, 'set', 'background');
      break;
    case 'mergeValue': {
      // update cache and tell the background script to update its cache
      options[request.key] = mergeValue(request.key, request.value);
      send(request.key, request.value, 'merge', 'background');
    }
  }
});

// setup the communication with the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'setValue': {
      // update cache and tell the injected script to update its cache
      const value = JSON.parse(request.value);
      options[request.key] = value;
      send(request.key, value, 'set', 'inject');
      break;
    }
    case 'mergeValue': {
      // update cache and tell the injected script to update its cache
      const value = JSON.parse(request.value);
      mergeValue(request.key, value);
      send(request.key, value, 'merge', 'inject');
      break;
    }
  }
});

// promise resolves with the options manager when we got a response from the background page,
// providing the initial values and the injected script has also updated its cache
export default new SemiPromise((resolve) => new SemiPromise((gotResponse) => chrome.runtime.sendMessage({ type: 'getSettings' }, gotResponse))
  .then(async (value) => {
    // fill cache with initialize values
    Object.assign(options, value);
    const onReceive = (message) => {
      if (message.value === 'initializationDone') {
        // injected script has finished initializing its cache
        channel.removeListener(onReceive);
        resolve(optionsManager);
      }
    };
    channel.onReceive(onReceive);
    // tell the injected script to initialize its cache
    channel.send({ type: 'initializeSettings', value });
  })
);
