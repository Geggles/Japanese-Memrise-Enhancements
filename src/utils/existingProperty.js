import watch from './watchProperty';
import SemiPromise from './semiPromise';

const defaultCondition = (prop) => prop !== undefined && prop !== null;

const exists = (object, properties, callback, resultObjects, condition=defaultCondition) => {
  if (!properties.length) {
    callback([object].concat(resultObjects));
    return;
  }
  const nextIteration = (nextObject) => exists(nextObject, properties.slice(1), callback, [object].concat(resultObjects), condition);

  const nextProperty = properties[0];
  const property = object[nextProperty];
  if (condition(property)) {
    if (typeof property !== 'function') nextIteration(property);
    else nextIteration(property.bind(object));
    return;
  }
  const removeCallback = watch(object, nextProperty, (nextObject) => {
    if (!condition(nextObject)) return;
    removeCallback();
    nextIteration(nextObject);
  });
};

export default (object, properties, callback, condition) => new SemiPromise((resolve) => exists(object, properties, resolve, [], condition), callback);
