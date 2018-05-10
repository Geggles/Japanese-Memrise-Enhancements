/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import { bind } from '../../libraries/wanakana';
import { onAfterBoxActivated } from '../../others/boxArrival';
import awaitDecorator from '../../utils/awaitDecorator';

onAfterBoxActivated(awaitDecorator(function* (box) {
  const [inputElement] = yield exists(box, ['$input', 'input', '0']);
  const options = yield optionsReady;
  if (options.getValue('useWanakana')) {
    // inputElement.addEventListener('input', () => {
    bind(inputElement);
    // });
  }
}));
