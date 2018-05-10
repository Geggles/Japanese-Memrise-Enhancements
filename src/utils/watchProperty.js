const watcher = (object, property, previousPropertyDescriptor, remove) => {
  // if the property didn't exist before
  let propertyValue;
  let callbacks = [];

  const callCallbacks = (value) => callbacks.forEach((callback) => {
    if (callback !== undefined) callback(value);
  });

  return {
    registerCallback(callback) {
      callbacks.push(callback);
      let removed = false;
      // remove
      return () => {
        if (removed) return;
        callbacks = callbacks.filter((value) => value !== callback);
        removed = true;
        if (!callbacks.length) remove(propertyValue);
      };
    },
    get propertyDescriptor() {
      return {
        configurable: true,
        get enumerable() {
          if (previousPropertyDescriptor !== undefined) {
            return previousPropertyDescriptor.enumerable;
          }
          return false;
        },
        get set() {
          if (previousPropertyDescriptor !== undefined) {
            if ('value' in previousPropertyDescriptor) {
              return (value) => {
                previousPropertyDescriptor.value = value;
                callCallbacks(value);
              };
            }
            return (value) => {
              previousPropertyDescriptor.set(value);
              callCallbacks(value);
            };
          }
          return (value) => {
            propertyValue = value;
            callCallbacks(value);
          };
        },
        get get() {
          if (previousPropertyDescriptor !== undefined) {
            if ('value' in previousPropertyDescriptor) return () => previousPropertyDescriptor.value;
            return previousPropertyDescriptor.get;
          }
          return () => propertyValue;
        },
      };
    },
  };
};

const watchers = [];

// call callback with new value when the property on the object is set
export default (object, property, callback) => {
  const reDefinePropery = (descriptor) => Object.defineProperty(object, property, descriptor);

  const propertyWatchers = (() => {
    for (const [watchedObject, propWatchers] of watchers) {
      if (watchedObject === object) return propWatchers;
    }
    const propWatchers = [];
    watchers.push([object, propWatchers]);
    return propWatchers;
  })();

  const propertyWatcher = (() => {
    for (const [propertyName, propWatcher] of propertyWatchers) {
      if (propertyName === property) return propWatcher;
    }
    // create new watcher
    const previousPropertyDescriptor = Object.getOwnPropertyDescriptor(object, property);
    let removed = false;
    const propWatcher = watcher(object, property, previousPropertyDescriptor, (value) => {
      if (removed) return;
      // return the property descriptor to its previous state
      reDefinePropery(previousPropertyDescriptor !== undefined? previousPropertyDescriptor: { value, writable: true, enumerable: true });

      // remove the watcher from the list
      for (const [objectIndex, [watchedObject, watchedProperties]] of watchers.entries()) {
        if (watchedObject !== object) continue;

        if (watchedProperties.length === 1) {
          // remove the object entirely, since no properties are being watched anymore
          watchers.splice(objectIndex, 1);
          removed = true;
          break;
        }

        for (const [propertyIndex, [propertyName]] of watchedProperties.entries()) {
          if (propertyName !== property) continue;

          watchedProperties.splice(propertyIndex, 1);
          removed = true;
          break;
        }
        break;
      }
    });
    propertyWatchers.push([property, propWatcher]);
    reDefinePropery(propWatcher.propertyDescriptor);
    return propWatcher;
  })();
  return propertyWatcher.registerCallback(callback);
};
