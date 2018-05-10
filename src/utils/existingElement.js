import SemiPromise from './semiPromise';

// promise resolves when the child of parentElement as described by childSelector exists
export default (parentElement, childSelector) => new SemiPromise((resolve) => {
  const child = parentElement.querySelector(childSelector);
  if (child !== null) {
    resolve(child);
  }
  // whenever something changed, test for existence again
  const observer = new MutationObserver(() => {
    const target = parentElement.querySelector(childSelector);
    if (target !== null) {
      observer.disconnect();
      resolve(target);
    }
  });
  // minimum required options
  const observeOptions = { childList: true, attributes: true, characterData: true };
  observer.observe(parentElement, observeOptions);
});
