/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import { onAfterBoxReady } from '../../others/boxArrival';
import SemiPromise from '../../utils/semiPromise';


onAfterBoxReady((box) => SemiPromise.all([
  optionsReady,
  exists(box, ['$input', 'onResponseChangedHandler']),
]).then(([options, [handler, input]]) => {
  if (!options.getValue('noAutoAccept')) return;
  input.onResponseChangedHandler = new Proxy(handler, {
    apply(target, thisArg, argList) {
      const nextPress = box.next_press.bind(box);
      // temporarily disable the acceptance of the answer
      box.next_press = () => {};
      const result = target.apply(thisArg, argList);
      box.next_press = nextPress;
      return result;
    },
  });
}));
