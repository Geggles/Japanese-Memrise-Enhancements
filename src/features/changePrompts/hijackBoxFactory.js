/* global channel, optionsReady */

import { isJapanese, isKana } from '../../libraries/wanakana';

import exists from '../../utils/existingProperty';

// attempt to get the kanji answer for a learnable
// predicates are ordered from lowest to highest priority
const getKanjiAnswer = (columns, predicates) => {
  let highestPriority = -1;
  let result = null;
  columns.forEach((column) => predicates.forEach((predicate, index) => {
    if (predicates[index](column) && index > highestPriority) {
      highestPriority = index;
      result = column.value;
    }
  }));
  return result;
};

const containsKanji = (word) => !!word
  .split('')
  .filter((character) => isJapanese(character) && isNaN(character) && !isKana(character))
  .length;

const setupChangeKanjiTypingToMultipleChoice = (box, template) =>
  exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']).then(([screens]) => {
    const learnableId = box.learnable_id;
    const screen = screens[learnableId][template];
    const correctAnswer = screen.answer.value;
    if (containsKanji(correctAnswer)) {
      // user is supposed to type kanji
      box.template = 'multiple_choice';
    }
  });

const setupChangeKanaMultipleChoiceToTyping = (box, template) =>
  exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']).then(([screens]) => {
    const learnableId = box.learnable_id;
    const screen = screens[learnableId][template];
    const correctAnswer = screen.correct;
    if (isKana(correctAnswer)) {
      // user is supposed to choose kana
      box.template = 'typing';
    }
  });

export default (onBoxArrival, onBoxReady) => {
  exists(window, ['MEMRISE', 'garden', 'session', 'box_factory', 'make']).then(([make, boxFactory]) => {
    boxFactory.make = new Proxy(make, {
      apply(target, thisArg, argList) {
        // do minimal adjustments to the box template given by {
        //   learnable_id,
        //   review_me,
        //   scheduled,
        //   template: 'sentinel',
        // }
        const originalResult = target.apply(thisArg, argList);
        // originalResult has the form {
        //   learnable_id,  same as before
        //   scheduled,  same as before
        //   template: 'typing', or other, depending on the Memrise' scheduling
        // }
        switch (originalResult.template) {
          case 'typing':
          case 'audio_typing':
            optionsReady.then((options) => {
              if (options.getValue('replaceKanjiTypingWithMultipleChoice')) {
                setupChangeKanjiTypingToMultipleChoice(originalResult, originalResult.template);
              }
            });
            break;
          case 'multiple_choice':
          case 'reversed_multiple_choice':
            optionsReady.then((options) => {
              if (options.getValue('replaceKanaMultipleChoiceWithTyping')) {
                setupChangeKanaMultipleChoiceToTyping(originalResult, originalResult.template);
              }
            });
            break;
          case 'end_of_session':
            break;
        }
        onBoxArrival.forEach((fn) => fn(originalResult));
        return originalResult;
      },
    });
  });
  exists(window, ['MEMRISE', 'garden', 'session', 'make_box']).then(([makeBox, session]) => {
    session.make_box = new Proxy(makeBox, {
      apply(target, thisArg, argList) {
        // box given as argument has the same form as for box.make
        const result = target.apply(thisArg, argList);
        // result is a complete box in all its glory (except for the DOM elements)
        onBoxReady.forEach((fn) => fn(result));
        return result;
      },
    });
  });
};
