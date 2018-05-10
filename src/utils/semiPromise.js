/*
  half promise half callback
  Works like a promise, but you can add callbacks to the constructor (if you prefer that style)
  and using the 'then' and 'catch' methods. Those callbacks will be called synchronously after the
  promise has settled, rather than being added to the micro task queue. This is important if you
  can't afford to wait for the current call stack to empty before running the callbacks. However,
  you still shouldn't use the 'await' keyword with these, because apparently 'await x' is NOT just
  syntactical sugar for x.then, because the function given to x.then is called syncronously
  (assuming x has already resolved), whereas 'await x', again, guarantees that x will be put at the
  end of the micro task queue (and thus only gets evaluated after the current callstack is empty).
  That's what the awaitDecorator is for. So now you can have the best of promises, callbacks and
  generators all in one class!
*/
export default class SemiPromise extends Promise {
  // specifying onFulfilled and onRejected functions in the constructor has the same effect as
  // calling .then with those functions as arguments
  constructor(executor, onFulfilled, onRejected) {
    // hack, because you cannot use 'this' in the constructor before calling super
    const stateContainer = {
      state: 'pending',
      value: undefined,  // return value in case of fulfillment or reason in case of rejection
      // list of callbacks registered in the constructor and through .then and/or .catch
      onFulfilledCallbacks: onFulfilled === undefined? []: [onFulfilled],
      onRejectedCallbacks: onRejected === undefined? []: [onRejected],
    };
    // here we build a new executor that wraps around the one given as an argument to the
    // constructor, where we call the appropriate callbacks synchronously
    super((resolve, reject) => executor(
      (value) => {
        stateContainer.state = 'fulfilled';
        stateContainer.value = value;
        stateContainer.onFulfilledCallbacks.forEach((callback) => callback(value));
        resolve(value);
      },
      (reason) => {
        stateContainer.state = 'rejected';
        stateContainer.value = reason;
        stateContainer.onRejectedCallbacks.forEach((callback) => callback(reason));
        reject(reason);
      })
    );
    this.stateContainer = stateContainer;
  }
  then(onFulfilled, onRejected) {
    switch (this.stateContainer.state) {
      case 'fulfilled':
        if (onFulfilled === undefined) {
          return SemiPromise.resolve(this.stateContainer.value);
        }
        return SemiPromise.resolve(onFulfilled(this.stateContainer.value));
      case 'rejected':
        if (onRejected === undefined) {
          return SemiPromise.reject(this.stateContainer.value);
        }
        return SemiPromise.reject(onRejected(this.stateContainer.value));
      case 'pending':
        // Return a new promise that will resolve (or reject) with the return value of the
        // respective function given as arguments. If the appropriate function was not given as an
        // argument, default to the identity.
        return new SemiPromise((resolve, reject) => {
          if (onFulfilled === undefined) {
            this.stateContainer.onFulfilledCallbacks.push((value) => resolve(value));
          } else {
            this.stateContainer.onFulfilledCallbacks.push((value) => SemiPromise.resolve(onFulfilled(value)).then(resolve));
          }
          if (onRejected === undefined) {
            this.stateContainer.onRejectedCallbacks.push((reason) => reject(reason));
          } else {
            this.stateContainer.onRejectedCallbacks.push((reason) => SemiPromise.resolve(onRejected(reason)).then(reject));
          }
        });
    }
    return undefined;
  }
}
