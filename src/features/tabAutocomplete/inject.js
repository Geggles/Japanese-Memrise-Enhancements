/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import awaitDecorator from '../../utils/awaitDecorator';
import { onAfterBoxReady } from '../../others/boxArrival';

onAfterBoxReady(awaitDecorator(function* (box) {
  if (!(box.template === 'typing' || box.template === 'audio_typing')) return;
  const [inputElementContainer, input] = yield exists(box, ['$input', 'input']);
  const inputElement = inputElementContainer[0];
  inputElement.addEventListener('keydown', awaitDecorator(function* (event) {
    if (event.code !== 'Tab') return;
    const options = yield optionsReady;
    if (!options.getValue('autocompleteOnTab')) return;
    input.setValue(box.getSingleCorrectAnswer());
    event.preventDefault();
  }));
}));
