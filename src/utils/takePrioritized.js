// Iterate through an array and return the element with the lowest priority, as specified by the
// priority functions. The functions are ordered from lowest to highest priority and get evaluated
// on every element of the array. If a function returns true for a given element, it will get the
// priority of the priority function (that is, its index in the priorityFunctions argument). An
// elements total priority is the minimum across all the priority functions that return true for it.
// If multiple elements have the same priority, the one that comes first in the array is returned.

export default (array, priorityFunctions, filter) => {
  let minimumPriority = Infinity;
  let minimumElement = null;
  for (const element of array) {
    if (filter !== undefined && !filter(element)) continue;
    // we don't have to check all functions, just the ones that might result in a lower priority
    for (const [priority, func] of priorityFunctions.slice(0, minimumPriority).entries()) {
      if (func(element) && priority < minimumPriority) {
        if (minimumPriority === 0) {
          // no need to look any further
          return element;
        }
        minimumPriority = priority;
        minimumElement = element;
      }
    }
  }
  return minimumElement;
};
