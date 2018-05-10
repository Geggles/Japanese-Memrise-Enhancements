import exists from '../utils/existingProperty';

const beforeBoxMadeCallbacks = [];
const afterBoxMadeCallbacks = [];
const beforeBoxReadyCallbacks = [];
const afterBoxReadyCallbacks = [];
const beforeBoxActivatedCallbacks = [];
const afterBoxActivatedCallbacks = [];

exists(window, ['MEMRISE', 'garden', 'session', 'box_factory', 'make']).then(([make, boxFact]) => {
  boxFact.make = new Proxy(make, {
    apply(target, thisArg, argList) {
      // do minimal adjustments to the box template given by {
      //   learnable_id,
      //   review_me,
      //   scheduled,
      //   template: 'sentinel',
      // }
      beforeBoxMadeCallbacks.forEach((callback) => callback(...argList));
      const originalResult = target.apply(thisArg, argList);
      // originalResult has the form {
      //   learnable_id,  same as before
      //   scheduled,  same as before
      //   template: 'typing', or other, depending on the Memrise' scheduling
      // }
      afterBoxMadeCallbacks.forEach((callback) => callback(originalResult));
      return originalResult;
    },
  });
});

exists(window, ['MEMRISE', 'garden', 'session', 'make_box']).then(([makeBox, session]) => {
  session.make_box = new Proxy(makeBox, {
    apply(target, thisArg, argList) {
      // box given as argument has the same form as for box.make
      beforeBoxReadyCallbacks.forEach((callback) => callback(...argList));
      const result = target.apply(thisArg, argList);
      // result is a complete box in all its glory (except for the DOM elements)
      afterBoxReadyCallbacks.forEach((callback) => callback(result));
      result.activate = new Proxy(result.activate, {
        // stupid names because
        apply(innerTarget, innerThisArg, innerArgList) {
          beforeBoxActivatedCallbacks.forEach((callback) => callback(result, ...innerArgList));
          const innerResult = innerTarget.apply(innerThisArg, innerArgList);
          afterBoxActivatedCallbacks.forEach((callback) => callback(result, innerResult));
          return innerResult;
        },
      });
      return result;
    },
  });
});

export const onBeforeBoxMade = (callback) => beforeBoxMadeCallbacks.push(callback);
export const onAfterBoxMade = (callback) => afterBoxMadeCallbacks.push(callback);
export const onBeforeBoxReady = (callback) => beforeBoxReadyCallbacks.push(callback);
export const onAfterBoxReady = (callback) => afterBoxReadyCallbacks.push(callback);
export const onBeforeBoxActivated = (callback) => beforeBoxActivatedCallbacks.push(callback);
export const onAfterBoxActivated = (callback) => afterBoxActivatedCallbacks.push(callback);
