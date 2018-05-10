/* global channel */
import deepmerge, { oldArrayMerge } from '../utils/deepmerge';
import SemiPromise from '../utils/semiPromise';

// cache
const options = {};

// for very large objects as stored values, it may be very expensive to communicate the entire value
// to reassign the setting to and instead only transmit the changes
const mergeValue = (key, value) => {
  options[key] = deepmerge(
    options[key],
    value,
    { arrayMerge: oldArrayMerge });
};

// the object that the settings are accessed through
const optionsManager = {
  getValue(key) {
    // use cache
    return options[key];
  },
  setValue(key, value) {
    // update cache
    options[key] = value;
    // tell the content script about the change
    channel.send({ type: 'setValue', key, value });
  },
  mergeValue(key, value) {
    // update cache
    mergeValue(key, value);
    // tell the content script about the change
    channel.send({ type: 'mergeValue', key, value });
  },
};

// promise resolves with the options manager after the settings initialization has taken place
export default new SemiPromise((resolve) => channel.onReceive((request) => {
  // received request from content script
  switch (request.type) {
    case 'initializeSettings':
      Object.assign(options, request.value);
      channel.send({ value: 'initializationDone' });
      resolve(optionsManager);
      break;
    case 'setValue':
      options[request.key] = JSON.parse(request.value);
      break;
    case 'mergeValue':
      mergeValue(request.key, JSON.parse(request.value));
      break;
  }
}));
