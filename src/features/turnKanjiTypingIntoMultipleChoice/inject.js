/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import awaitDecorator from '../../utils/awaitDecorator';
import { onAfterBoxMade } from '../../others/boxArrival';
import { containsKanji } from '../../utils/helperFunctions';

onAfterBoxMade(awaitDecorator(function* (box) {
  if (!(box.template === 'typing' || box.template === 'audio_typing')) return;
  const options = yield optionsReady;
  if (!options.getValue('replaceKanjiTypingWithMultipleChoice')) return;

  const [screens] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']);
  const learnableId = box.learnable_id;
  const screen = screens[learnableId][box.template];
  const correctAnswer = screen.correct[0];

  if (!containsKanji(correctAnswer)) return;
  // user is supposed to type kanji
  box.template = 'multiple_choice';
}));
