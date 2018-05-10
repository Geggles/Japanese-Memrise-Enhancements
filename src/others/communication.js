/* global side */

import {
  channelsDomElementId,
  frequencyAndSideAndTypeToAttributeName,
  attributeNameToFrequencyAndSideAndType,
// } from 'globals';
} from './settings';

// {frequency: receive method for that channel}
const channels = {};
// queue on messages to be sent to the other side
const messageQueue = [];

const otherSide = side === 'content'? 'inject': 'content';

const sideToLockValue = (side) => {
  switch (side) {
    case 'inject':
      return 0;
    case 'content':
      return 1;
    case 'free':
      return 2;
  }
  return null;
};
const lockValueToSide = (value) => {
  switch (value) {
    case 0:
      return 'inject';
    case 1:
      return 'content';
    case 2:
      return 'free';
  }
  return null;
};

// setup the channels
const channelElementManager = (() => {
  const channelElement = (() => {
    let existingChannelElement = document.getElementById(channelsDomElementId);
    // check whether channelElement already exists
    if (existingChannelElement === null) {
      // as far as I know, span is the most generic DOM element
      existingChannelElement = document.createElement('span');
      // give it an ID so that it can be accessed on both sides of the divide
      existingChannelElement.setAttribute('id', channelsDomElementId);
      // top secret, nobody can see it
      existingChannelElement.setAttribute('style', 'display:none');
      // since I'm not sure if document.head exists at this point in time
      document.documentElement.appendChild(existingChannelElement);
    }
    return existingChannelElement;
  })();

  return {
    observe: (observer, options) => observer.observe(channelElement, options),
    getValue(frequency, side, type) {
      const attributeName = frequencyAndSideAndTypeToAttributeName(frequency, side, type);
      const attributeValue = channelElement.getAttribute(attributeName);
      // attribute doesn't exist yet
      switch (type) {
        case 'message':
          if (attributeValue === null) {
            // starts with an empty queue
            channelElement.setAttribute(attributeName, JSON.stringify([]));
            return [];
          }
          return JSON.parse(attributeValue);
        case 'lock':
          if (attributeValue === null) {
            // claim the lock for ourselves
            channelElement.setAttribute(attributeName, JSON.stringify(sideToLockValue(side)));
            return side;
          }
          return lockValueToSide(JSON.parse(attributeValue));
      }
      throw Error('Expected "message" or "lock" as type attribute');
    },
    setValue(frequency, side, type, value) {
      const attributeName = frequencyAndSideAndTypeToAttributeName(frequency, side, type);
      switch (type) {
        case 'message':
          // just set the attribute
          channelElement.setAttribute(attributeName, JSON.stringify(value));
          break;
        case 'lock':
          // convert the side to value first
          channelElement.setAttribute(attributeName, JSON.stringify(sideToLockValue(value)));
      }
    },
  };
})();

const readQueue = (frequency) => {
  const queue = channelElementManager.getValue(frequency, side, 'message');
  const receive = channels[frequency];
  while (queue.length) {
    // take out message from the front of the queue
    if (typeof queue[0] !== 'string') debugger;
    const nextMessage = queue.shift();
    receive(JSON.parse(nextMessage));
  }
  // set the value to an empty queue, as we have processed every message in it
  channelElementManager.setValue(frequency, side, 'message', []);
};

const writeQueue = (frequency) => {
  // get the queue that is already there, so we don't just overwrite it
  const queue = channelElementManager.getValue(frequency, side, 'message').concat(messageQueue);
  // now we can empty our message queue
  messageQueue.length = 0;
  // set the value to the new message queue
  channelElementManager.setValue(frequency, otherSide, 'message', queue);
};

(() => {
  const observer = new MutationObserver((mutations) => mutations.forEach((mut) => {
    // assume that mutation type is 'attributes'
    const [frequency, receiverSide, type] = attributeNameToFrequencyAndSideAndType(mut.attributeName);

    // only interested in locks...
    if (type !== 'lock') return;
    // ...that were owned by the other side...
    if (lockValueToSide(JSON.parse(mut.oldValue)) !== otherSide) return;
    // ...and that were just released
    if (channelElementManager.getValue(frequency, receiverSide, 'lock') !== 'free') return;
    if (side === receiverSide) {  // we can read now
      // set the write lock for the other side
      channelElementManager.setValue(frequency, side, 'lock', side);
      readQueue(frequency);
      // finally we can release the lock
      channelElementManager.setValue(frequency, side, 'lock', 'free');
    } else if (messageQueue.length) {  // we can write our stored queue now
      // set the read lock for the other side
      channelElementManager.setValue(frequency, otherSide, 'lock', side);
      writeQueue(frequency);
      // finally we can release the lock
      channelElementManager.setValue(frequency, otherSide, 'lock', 'free');
    }
  }));
  const observeOptions = {
    childList: true,  // required
    attributes: true,  // required
    characterData: true,  // required
    attributeOldValue: true,
  };
  channelElementManager.observe(observer, observeOptions);
})();

export default (frequency) => {
  const callbacks = [];
  const missedMessages = [];

  channels[frequency] = (message) => {
    if (!callbacks.length) {
      // no callback to handle the message, so just collect it
      missedMessages.push(message);
    }
    // call every callback in order of registration
    callbacks.forEach((cb) => cb(message));
  };

  // catch up on missed messages
  switch (channelElementManager.getValue(frequency, side, 'lock')) {
    case otherSide:
      // if the other side controls the lock, there is no need to act right now
      break;
    case 'free':
      // we need to acquire the lock before acting
      channelElementManager.setValue(frequency, side, 'lock', side);
      // falls through
    case side:
      readQueue(frequency);
      channelElementManager.setValue(frequency, side, 'lock', 'free');
  }

  let firstCallback = true;

  return {
    onReceive(callback) {
      callbacks.push(callback);
      if (firstCallback) {
        // the first callback receives the entire missed history
        missedMessages.forEach((message) => callback(message));
        // empty the missed message queue
        missedMessages.length = 0;
        firstCallback = false;
      }
    },
    send(message) {
      // other side can prevent us from sending more
      const lockOwner = channelElementManager.getValue(frequency, otherSide, 'lock');
      if (lockOwner === otherSide) {
        // prepare message for later (when the lock is released)
        messageQueue.push(JSON.stringify(message));
      } else {
        // acquire the lock ourselves, so the other side doesn't read the queue while we're trying
        // to write to it
        channelElementManager.setValue(frequency, otherSide, 'lock', side);
        const queue = channelElementManager.getValue(frequency, otherSide, 'message');
        // add message to the end of the queue
        queue.push(JSON.stringify(message));
        // store the modified queue back into the element
        channelElementManager.setValue(frequency, otherSide, 'message', queue);
        // release the lock so that the other side can read from the queue
        channelElementManager.setValue(frequency, otherSide, 'lock', 'free');
      }
    },
    removeListener(callback) {
      const index = callbacks.indexOf(callback);
      if (index === -1) return;
      callbacks.splice(index, 1);
    },
  };
};
