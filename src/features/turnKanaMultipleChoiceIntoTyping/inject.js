/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import awaitDecorator from '../../utils/awaitDecorator';
import { onAfterBoxMade } from '../../others/boxArrival';
import { isKana } from '../../libraries/wanakana';

onAfterBoxMade(awaitDecorator(function* (box) {
  if (!(box.template === 'multiple_choice' || box.template === 'reversed_multiple_choice')) return;
  const options = yield optionsReady;
  if (!options.getValue('replaceKanaMultipleChoiceWithTyping')) return;

  const [screens] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']);
  const learnableId = box.learnable_id;
  const screen = screens[learnableId][box.template];
  const correctAnswer = screen.correct[0];

  if (!isKana(correctAnswer)) return;
  // user is supposed to choose kana
  box.template = 'typing';
}));
