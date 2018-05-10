/* global channel, optionsReady */

import awaitDecorator from '../../utils/awaitDecorator';
import { onAfterBoxReady } from '../../others/boxArrival';
import {
  containsKanji,
  arrayComprehension,
  cartesianProduct,
  replaceCharAt,
  shuffleArray,
} from '../../utils/helperFunctions';
import kanjiDataSet from '../../assets/kanjiDataSet';

onAfterBoxReady(awaitDecorator(function* (box) {
  if (!(box.template === 'multiple_choice' || box.template === 'reversed_multiple_choice')) return;
  const options = yield optionsReady;
  if (!options.getValue('makeKanjiMultipleChoicesMoreSimilar')) return;
  const correctOption = box.choices.find((element) => element.correct);
  const correctAnswer = correctOption.choice;
  if (!containsKanji(correctAnswer)) return;

  // construct a dictionary { kanji found in data set: [indices in answer string] }
  const kanjiFoundAt = correctAnswer.split('').reduce((kanjiFound, character, index) => {
    if (!(character in kanjiDataSet)) return kanjiFound;
    if (!(character in kanjiFound)) {
      kanjiFound[character] = [];
    }
    kanjiFound[character].push(index);
    return kanjiFound;
  }, {});

  const numberOfKanjiFound = Object.keys(kanjiFoundAt).length;
  if (!numberOfKanjiFound) return;

  // Yencken's dataset contains 10 similar Kanji for each jouyou Kanji, ordered from most to least
  // similar. We want to draw a random index from 0 to length with the first being most likely and
  // the probability linearly decreasing for larger indices
  const getRandomIndex = (lenght) => lenght - 1 - Math.floor(lenght * Math.sqrt(Math.random()));

  // randomly sample n different kanji that are similar to a given kanji, according to the
  // distribution given by getRandomIndex
  const sample = (kanji, amount) => {
    // we want to slice away the first one, as that is the one we're searching for; also creates
    // a copy of the array
    const similarKanji = kanjiDataSet[kanji].slice();
    return arrayComprehension(amount, (index) => {
      // we do not want to draw the same kanji twice
      const randomIndex = getRandomIndex(amount - index);
      return similarKanji.splice(randomIndex, 1)[0];
    });
  };

  // the amount of alternative kanji that there will be for each kanji found; this is to keep the
  // amount of options presented to the user lower than 9
  const numAlternatives = (() => {
    switch (numberOfKanjiFound) {
      case 1: return [5];
      case 2: return [2, 2];
      case 3: return [1, 1, 1];
      default: {
        const result = new Array(numberOfKanjiFound).fill(0);

        const indexPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        // choose three kanji that each get 1 variation for a total of 8 options
        for (let loopIndex=0; loopIndex<3; loopIndex+=1) {
          // take out a uniformly random element from the index pool
          const randomIndex = Math.floor(Math.random() * indexPool.length);
          const kanjiIndex = indexPool.splice(randomIndex, 1);
          result[kanjiIndex] = 1;
        }
        return result;
      }
    }
  })();

  // For every found kanji sample the specified amount of variation and collect them in a
  // [[variation, indices]] list. The double list is because we want to take a cartesian product
  // over the variations later.
  const variations = Object.entries(kanjiFoundAt).map(([kanji, foundAtIndices], kanjiIndex) => {
    const numberOfVariations = numAlternatives[kanjiIndex];
    // we also want to keep the original kanji in addition to the variations
    const kanjiVariations = sample(kanji, numberOfVariations).concat(kanji);
    // these represent a kanji variation and at which indices it should replace the original string
    return kanjiVariations.map((variation) => [[variation, foundAtIndices]]);
  });

  const kanjiCombinations = cartesianProduct(variations);
  // turn every kanji combination into a new string
  const newOptionStrings = kanjiCombinations.map((combination) =>
    // combination is [[variation, indices], [variation, indices], ...]
    // for each of those elements we want to replace the character at every index in indices with
    // that variation
    combination.reduce((newString, [variation, indices]) =>
      indices.reduce((newString2, index) => replaceCharAt(newString2, index, variation), newString),
      correctAnswer)
  );
  // Now we just need to get them into Memrise' format.
  const newOptions = shuffleArray(newOptionStrings).map((optionString, index) => ({
    choice: optionString,
    choice_html: optionString,
    correct: optionString === correctAnswer,
    id: index,
  }));

  box.choices = newOptions;
  box.num_choices = newOptions.length;
}));
