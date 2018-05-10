/* global channel, optionsReady */

// retrieve the custom thing corresponding to the thing id
channel.onReceive((request) => {
  switch (request.type) {
    case 'getThing':
      chrome.runtime.sendMessage({
        type: 'getThing',
        thingId: request.thingId,
      }, channel.send.bind(channel));
      break;
    case 'updateThing':
      chrome.runtime.sendMessage({
        type: 'mergeValue',
        key: 'customThings',
        value: { [request.thingId]: request.value },
      });
      break;
  }
});
