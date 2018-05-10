/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import domElement from '../../utils/existingElement';
import { onAfterBoxActivated } from '../../others/boxArrival';
import awaitDecorator from '../../utils/awaitDecorator';

onAfterBoxActivated(awaitDecorator(function* (box) {
  const options = yield optionsReady;
  if (!options.getValue('noOnscreenKeyboard')) return;

  const [element] = yield exists(box, ['$elem', '0']);
  const keyboard = yield domElement(element, '.keyboard');

  keyboard.style.display = 'none';
}));
