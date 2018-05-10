/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import { toKana } from '../../libraries/wanakana';
import { onAfterBoxReady } from '../../others/boxArrival';

onAfterBoxReady((box) => exists(box, ['check']).then(([check]) => {
  if (!(box.template === 'typing' || box.template === 'audio_typing')) return;
  box.check = new Proxy(check, {
    apply(target, thisArg, argList) {
      // at this point we can assume that the text input already exists
      exists(box, ['$input']).then(([input]) => {
        optionsReady.then((options) => {
          if (options.getValue('useWanakana')) {
            // convert one last time before checking, can never hurt (I guess...)
            input.setValue(toKana(input.value()));
          }
        });
      });
      return target.apply(thisArg, argList);
    },
  });
}));
