import { isJapanese, isKana } from '../libraries/wanakana';

export const isKanji = (char) => isJapanese(char) && isNaN(char) && !isKana(char);

export const containsKanji = (word) => word.split('').some(isKanji);

// construct a new array from with a given length where reach entry is defined by a function func
// that only gets the index of the element it is supposed to define as an argument
export const arrayComprehension = (length, func) => Array.from(
  new Array(length), (element, index) => func(index)
);

/* eslint id-length: ["error", { "min": 1 }] */
// stackoverflow magic from https://stackoverflow.com/a/36234242
export const cartesianProduct = (arr) =>
  arr.reduce((a, b) =>
    a.map((x) =>
      b.map((y) =>
        x.concat(y)
      )
    ).reduce((c, d) =>
      c.concat(d), []
    ),
    [[]]
  );


export const replaceCharAt = (string, index, character) => {
  const leftString = string.substring(0, index);
  const rightString = string.substring(index+1);
  return leftString + character + rightString;
};


export const shuffleArray = (array) => {
  // Python: list(range(len(array)))
  const indexPool = Array.from(array.keys());
  const resultArray = [];
  while (indexPool.length) {
    const indicesIndex = Math.floor(Math.random() * indexPool.length);
    const randomIndex = indexPool.splice(indicesIndex, 1);
    resultArray.push(array[randomIndex]);
  }
  return resultArray;
};

export const chainIterators = function* (...iterators) {
  for (const iterator of iterators) {
    yield* iterator;
  }
};
