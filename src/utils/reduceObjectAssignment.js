// When reducing a sequence into an object, you can use this function as the reducer.
// The callback is supposed to return a [key, value] pair that should be added to the result.
export default (callback) => (accumulator, element, index, array) => {
  const [key, value] = callback(accumulator, element, index, array);
  accumulator[key] = value;
  return accumulator;
};

export const withoutAccumulator = (callback) => (accumulator, element, index, array) => {
  const [key, value] = callback(element, index, array);
  accumulator[key] = value;
  return accumulator;
};
