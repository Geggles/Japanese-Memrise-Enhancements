import SemiPromise from './semiPromise';

// Decorate a (generator) function so that you can use the yield keyword instead of await, because
// await makes use of vanilla Promises, rather than SemiPromises and thus always resolves
// asynchronously, defeating the entire purpose of SemiPromises. This is a workaround that's not
// even that bad (if I may say so myself), given that this is similar to how people used to do
// async/await before ES8. For me, this function single handedly revives the function keyword,
// because there is no generator syntax for arrow functions, even though there is async () => {} ...

export default (genFunction) => (...args) => {
  const generator = genFunction(...args);
  const makeStep = (promise) => {
    if (promise.done) return promise.value;
    return promise.value.then((result) => makeStep(generator.next(result)));
  };
  return SemiPromise.resolve(makeStep(generator.next()));
};
