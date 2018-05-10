/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import { onAfterBoxReady } from '../../others/boxArrival';
import awaitDecorator from '../../utils/awaitDecorator';
import { bind, isJapanese, unbind } from '../../libraries/wanakana';
import SemiPromise from '../../utils/semiPromise';
import { promisesPromise as thingAndPoolPromisesPromise } from '../../others/thingsAndPools';
import { chainIterators } from '../../utils/helperFunctions';

// ask the content page for the custom thing with a given thingId and resolve with that thing
const getCustomThingPromise = (thingId) => new SemiPromise((resolve) => {
  const onReceive = (customThing) => {
    channel.removeListener(onReceive);
    resolve(customThing);
  };
  channel.onReceive(onReceive);
  channel.send({ type: 'getThing', thingId });
});

// return {columnId: [label, getter, setter], ...}
const parseTemplateScreen = (template, columnA, columnB, templateScreen, thing, pool) => {
  switch (template) {
    case 'presentation': {
      const result = {};

      // for finding the hidden (and shown) info by elimination
      const thingColumnsCopy = Object.assign({}, thing.columns);

      if (!columnA || !columnB) {
        throw new Error('The test on and prompt columns have not been identified');
      }

      const testOn = columnA;
      result[testOn] = [
        pool.columns[testOn].label,
        () => templateScreen.item.value,
        (newValue) => templateScreen.item.value = newValue,
      ];
      delete thingColumnsCopy[testOn];

      const promptWith = columnB;
      result[promptWith] = [
        pool.columns[promptWith].label,
        () => templateScreen.definition.value,
        (newValue) => templateScreen.definition.value = newValue,
      ];
      delete thingColumnsCopy[promptWith];

      const visibleInfo = templateScreen.visible_info;
      // the info that you have to click "show more" for
      const hiddenInfo = templateScreen.hidden_info;
      for (const column of chainIterators(visibleInfo, hiddenInfo)) {
        const label = column.label;
        // first label match
        const [columnId] = Object.keys(thingColumnsCopy)
          .find((thingColumnId) => pool.columns[thingColumnId].label === label);

        if (columnId === undefined) {
          // should not be possible, but whatever
          continue;
        }

        // lexicographically binding the value in this scope
        const templateColumn = column;
        result[columnId] = [
          label,
          () => templateColumn.value,
          (newValue) => templateColumn.value = newValue,
        ];

        delete thingColumnsCopy[columnId];
      }

      return result;
    }
    case 'reversed_multiple_choice':
    case 'multiple_choice': {
      const result = {};

      const testOn = columnA;
      result[testOn] = [
        pool.columns[testOn].label,
        () => templateScreen.answer.value,
        (newValue) => {
          const oldValue = templateScreen.answer.value;
          templateScreen.answer.value = newValue;
          const correctIndex = templateScreen.correct.findIndex((value) => value === oldValue);
          if (correctIndex !== -1) templateScreen.correct[correctIndex] = newValue;
          const choicesIndex = templateScreen.choices.findIndex((value) => value === oldValue);
          if (choicesIndex !== -1) templateScreen.choices[choicesIndex] = newValue;
        },
      ];

      // can only change text
      if (templateScreen.prompt.text === null) return result;

      const promptWith = columnB;
      result[promptWith] = [
        pool.columns[promptWith].label,
        () => templateScreen.prompt.text.value,
        (newValue) => templateScreen.prompt.text.value = newValue,
      ];

      return result;
    }
    case 'typing': {
      const result = {};

      const testOn = columnA;
      result[testOn] = [
        pool.columns[testOn].label,
        () => templateScreen.answer.value,
        (newValue) => {
          const oldValue = templateScreen.answer.value;
          templateScreen.answer.value = newValue;
          const correctIndex = templateScreen.correct.findIndex((value) => value === oldValue);
          if (correctIndex !== -1) templateScreen.correct[correctIndex] = newValue;
        },
      ];

      // can only change text
      if (templateScreen.prompt.text === null) return result;

      const promptWith = columnB;
      result[promptWith] = [
        pool.columns[promptWith].label,
        () => templateScreen.prompt.text.value,
        (newValue) => templateScreen.prompt.text.value = newValue,
      ];

      // todo: try to handle templateScreen.post_answer_info, as it not clear, how to decide what column id corresponds to this

      return result;
    }
  }
  return {};
};

// screen is { box template: attributes, ... };
// update all the template screens for a given thing (i.e. changing the value of their columns)
const updateTemplateScreens = (templateScreens, columnA, columnB, thing, pool, customThing) =>
  Object.entries(templateScreens)
    // for every one of those, we want the properties that can be modified
    .map(([template, templateScreen]) => Object.entries(parseTemplateScreen(
      template, columnA, columnB, templateScreen, thing, pool
    )))
    // flatten, because we don't need the template anymore (columnProperties has taken care of that)
    .reduce((acc, elements) => acc.concat(elements), [])
    // but we only care about the ones that we actually modify
    .filter(([columnId]) => columnId in customThing)
    // the labels are the keys with which we get the custom values from the custom things
    .map(([columnId, [label, getter, setter]]) => [customThing[columnId], setter])
    // now set the new values
    .forEach(([customValue, setter]) => setter(customValue));

onAfterBoxReady((box) => {
  optionsReady.then((options) => {

  });
});

// the DOM element id of the container used as the editing interface
const customThingContainerId = 'customThingContainerl6b7e4156C20011e7Abc4Cec278b6b50a';
const separatorId = 'separatorl6b7e4156C20011e7Abc4Cec278b6b50a';

// html interface for changing the columns
onAfterBoxReady(awaitDecorator(function* (box) {
  const [[leftArea]] = yield exists(window, ['MEMRISE', 'garden', '$leftarea']);
  const oldContainer = document.getElementById(customThingContainerId);
  const oldSeparator = document.getElementById(separatorId);
  const options = yield optionsReady;

  if (!options.getValue('useCustomThings')) {
    // remove added ui elements if they exist
    if (oldSeparator !== null) leftArea.removeChild(oldSeparator);
    if (oldContainer !== null) leftArea.removeChild(oldContainer);
    return;
  }

  // add separator if one doesn't exist yet
  if (oldSeparator === null) {
    const newSeparator = document.createElement('hr');
    newSeparator.setAttribute('id', separatorId);
    leftArea.appendChild(newSeparator);
  }

  const [screens] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']);
  const learnableId = box.learnable_id;
  const templateScreens = screens[learnableId];

  const [getLearnable] = yield exists(window, ['MEMRISE', 'garden', 'getLearnable']);
  const learnable = getLearnable(box);
  const thingId = learnable.thing_id;

  // contains all the columns for this thing
  const customThingContainer = document.createElement('div');
  customThingContainer.setAttribute('id', customThingContainerId);

  const [[thing, pool], customThing] = yield SemiPromise.all([
    thingAndPoolPromisesPromise.then((thingAndPoolPromises) => thingAndPoolPromises[thingId]),
    getCustomThingPromise(thingId),
  ]);

  let maybeColumnA;
  let maybeColumnB;
  const thingUser = box.thinguser;
  if (thingUser !== null && thingUser !== undefined) {
    maybeColumnA = thingUser.column_a;
    maybeColumnB = thingUser.column_b;
  } else {
    const [session] = yield exists(window, ['MEMRISE', 'garden', 'session']);
    const level = session.level;
    if (level !== null && level !== undefined) {
      maybeColumnA = level.column_a;
      maybeColumnB = level.column_b;
    }
  }

  if (
    maybeColumnA === null ||
    maybeColumnA === undefined ||
    maybeColumnB === null ||
    maybeColumnB === undefined
  ) return;

  const columnA = maybeColumnA;
  const columnB = maybeColumnB;

  // apply the changes on the screen
  const updateBox = () => {
    updateTemplateScreens(templateScreens, columnA, columnB, thing, pool, customThing);

    // because the jQuery focus event scrolls the page
    const x = window.scrollX;
    const y = window.scrollY;
    box.activate();
    window.scrollTo(x, y);
  };

  const subContainers = [];

  Object
    .entries(thing.columns)
    // only care about text columns
    .filter(([columnId, column]) => column.kind === 'text')
    // for every column, extract the label and value
    .map(([columnId, column]) => {
      let value = '';
      // the custom value has priority
      if (columnId in customThing) value = customThing[columnId];
      // if we don't have a custom value for this column, fall back to the default one
      else if (columnId in thing.columns) value = thing.columns[columnId].val;
      return [columnId, pool.columns[columnId].label, value];
    })
    .forEach(([id, label, value], index) => {
      const columnId = id;

      const saveNewValue = (newValue) => {
        customThing[columnId] = newValue;
        updateBox();
        channel.send({
          type: 'updateThing',
          thingId,
          value: customThing,
        });
      };

      // contains a single column of this thing
      const columnElement = document.createElement('div');

      // contains all the other elements and has its visibility toggled by the user
      const subContainer = document.createElement('div');
      subContainer.style.display = 'none';
      subContainer.style.width = '100%';
      subContainers.push(subContainer);

      const labelElement = document.createElement('p');
      labelElement.innerText = label;

      const valueElement = document.createElement('input');
      valueElement.setAttribute('type', 'text');
      valueElement.style.width = '100%';
      valueElement.value = value;

      // lets you activate wanakana on the input for a column
      const wanaKanaElement = document.createElement('input');
      wanaKanaElement.setAttribute('type', 'checkbox');
      wanaKanaElement.setAttribute('id', `wk-${index}`);
      wanaKanaElement.style.float = 'right';

      // the label for the wanakana checkbox
      const wanaKanaLabel = document.createElement('label');
      wanaKanaLabel.setAttribute('for', wanaKanaElement.getAttribute('id'));
      wanaKanaLabel.innerText = 'WanaKana';
      wanaKanaLabel.style.display = 'inline-block';

      // saves the changes and updates the box
      const saveButton = document.createElement('button');
      saveButton.innerText = 'save';
      saveButton.style.width = '100%';
      saveButton.style.margin = '0';
      saveButton.classList = 'btn btn-primary';

      // discard the changes and reset the input
      const cancelButton = document.createElement('button');
      cancelButton.innerText = 'cancel';
      cancelButton.style.width = '100%';
      cancelButton.style.margin = '0';
      cancelButton.classList = 'btn btn-warning';

      // reset it to the original
      const resetButton = document.createElement('button');
      resetButton.innerText = 'reset';
      resetButton.style.width = '100%';
      resetButton.style.margin = '0';
      resetButton.classList = 'btn btn-danger';

      subContainer.appendChild(valueElement);
      subContainer.appendChild(wanaKanaLabel);
      subContainer.appendChild(wanaKanaElement);
      subContainer.appendChild(saveButton);
      subContainer.appendChild(cancelButton);
      subContainer.appendChild(resetButton);

      columnElement.appendChild(labelElement);
      columnElement.appendChild(subContainer);

      customThingContainer.appendChild(columnElement);

      // show the elements for a column on click and hide all others
      labelElement.addEventListener('click', () => {
        // show on click if it was hidden before
        const show = subContainer.style.display === 'none';
        // hide all containers
        subContainers.forEach((container) => container.style.display = 'none');
        if (show) {
          subContainer.style.display = 'unset';
          valueElement.focus();
        }
      });

      // bind and unbind wanakana to the input as given by the checkbox
      wanaKanaElement.addEventListener('change', () => {
        if (wanaKanaElement.checked) bind(valueElement);
        else unbind(valueElement);
      });

      // update the custom learnable and apply the changes on screen
      saveButton.addEventListener('click', () => {
        value = valueElement.value;
        saveNewValue(value);
      });

      valueElement.addEventListener('keyup', (event) => {
        if (event.key !== 'Enter') return;
        saveButton.click();
      });

      cancelButton.addEventListener('click', () => {
        // reset the value in the input field
        valueElement.value = value;
        valueElement.focus();
      });

      resetButton.addEventListener('click', () => {
        // reset the value in the input field
        value = thing.columns[columnId].val;
        valueElement.value = value;
        saveNewValue(value);
        valueElement.focus();
      });

      let memriseKeydown = box.keydown;
      // stop memrise from intercepting keystrokes
      valueElement.addEventListener('focus', () => {
        memriseKeydown = box.keydown;
        box.keydown = () => {};
      });
      valueElement.addEventListener('blur', () => {
        box.keydown = memriseKeydown;
      });

      // activate wanakana by default if the current column value contains japanese characters
      if (value.split('').some(isJapanese)) {
        wanaKanaElement.checked = true;
        bind(valueElement);
      }
    });

  // the container doesn't get deleted whenever a new box arrived, so we have to do that manually
  if (oldContainer !== null) leftArea.replaceChild(customThingContainer, oldContainer);
  else leftArea.appendChild(customThingContainer);
}));

// initially update screens
(awaitDecorator(function* () {
  const options = yield optionsReady;
  if (!options.getValue('useCustomThings')) return;

  const [screens] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'screens']);
  const [learnables] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'learnables']);
  const [thingUsers] = yield exists(window, ['MEMRISE', 'garden', 'session_data', 'thingusers']);
  const [session] = yield exists(window, ['MEMRISE', 'garden', 'session']);

  // for every learnable in this session, update the screen with the according custom thing
  learnables
    .map((learnable) => [
      learnable.thing_id,
      learnable.learnable_id,
    ])
    .map(([thingId, learnableId]) => [
      (() => {
        const thingUser = thingUsers.find((user) => user.thing_id === thingId);
        if (thingUser !== null && thingUser !== undefined) {
          return [thingUser.column_a, thingUser.column_b];
        }
        const level = session.level;
        if (level !== null && level !== undefined) {
          return [level.column_a, level.column_b];
        }
        return [undefined, undefined];
      })(),
      screens[learnableId],
      SemiPromise.all([
        thingAndPoolPromisesPromise.then((thingAndPoolPromises) => thingAndPoolPromises[thingId]),
        getCustomThingPromise(thingId),
      ]),
    ])
    .forEach(([[columnA, columnB], templateScreens, promise]) => promise
      .then(([[thing, pool], customThing]) => updateTemplateScreens(
        templateScreens, columnA, columnB, thing, pool, customThing
      )));
}))();
