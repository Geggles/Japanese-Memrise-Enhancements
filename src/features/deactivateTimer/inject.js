/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import SemiPromise from '../../utils/semiPromise';

const setupToggleOnClick = (unpause) => exists(window, ['MEMRISE', 'garden', 'timer', '$container'], ([container, timer]) => {
  const timerElement = container[0];
  const onClick = () => {
    optionsReady.then((options) => {
      if (options.getValue('timerClickToggle')) {
        if (timer.paused) unpause();
        else timer.pause();
      }
    });
  };
  timerElement.addEventListener('click', onClick);
  return onClick;
});

const setupPreventMemriseFromUnpausing = () => SemiPromise.all([
  exists(window, ['MEMRISE', 'garden', 'timer', 'unpause']),
  optionsReady,
]).then(([[unpause, timer], options]) => {
  timer.unpause = new Proxy(unpause, {
    apply(target, thisArg, argList) {
      if (options.getValue('preventUnpausing')) {
        return;
      }
      target.apply(thisArg, argList);
    },
  });
  return unpause;
});

const patchStartFunction = () => exists(window, ['MEMRISE', 'garden', 'timer', 'start']).then(([start, timer]) => {
  timer.start = new Proxy(start, {
    apply(target, thisArg, argList) {
      target.apply(thisArg, argList);
      optionsReady.then((options) => {
        if (options.getValue('alwaysPauseTimer')) {
          timer.pause();
        }
      });
    },
  });
});

Promise.all([
  patchStartFunction(),
  setupPreventMemriseFromUnpausing().then(setupToggleOnClick),
]);
