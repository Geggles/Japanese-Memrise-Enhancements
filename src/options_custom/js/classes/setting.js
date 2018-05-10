//
// Copyright (c) 2011 Frank Kohlhepp
// https://github.com/frankkohlhepp/fancy-settings
// License: LGPL v2.1
//

(function () {
  var settings,
      Bundle;

  settings = new Store('settings');
  Bundle = new Class({
    // Attributes:
    // - tab
    // - group
    // - name
    // - type
    //
    // Methods:
    //  - initialize
    //  - createDOM
    //  - setupDOM
    //  - addEvents
    //  - get
    //  - set
    'Implements': Events,

    'initialize': function (params) {
      this.params = params;
      this.params.searchString = '•' + this.params.tab + '•' + this.params.group + '•';

      this.createDOM();
      this.setupDOM();
      this.addEvents();

      if (this.params.id !== undefined) {
        this.element.set('id', this.params.id);
      }

      if (this.params.name !== undefined) {
        this.set(settings.get(this.params.name), true);
      }

      this.params.searchString = this.params.searchString.toLowerCase();
    },

    'addEvents': function () {
      this.element.addEvent('change', (function (event) {
        if (this.params.name !== undefined) {
          settings.set(this.params.name, this.get());
        }

        this.fireEvent('action', this.get());
      }).bind(this));
    },

    'get': function () {
      return this.element.get('value');
    },

    'set': function (value, noChangeEvent) {
      this.element.set('value', value);

      if (noChangeEvent !== true) {
        this.element.fireEvent('change');
      }

      return this;
    }
  });

  Bundle.Description = new Class({
    // text
    'Extends'  : Bundle,
    'addEvents': undefined,
    'get'      : undefined,
    'set'      : undefined,

    'initialize': function (params) {
      this.params = params;
      this.params.searchString = '';

      this.createDOM();
      this.setupDOM();
    },

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle description'
      });

      this.container = new Element('div', {
        'class': 'setting container description'
      });

      this.element = new Element('p', {
        'class': 'setting element description'
      });
    },

    'setupDOM': function () {
      if (this.params.text !== undefined) {
        this.element.set('html', this.params.text);
      }

      this.element.inject(this.container);
      this.container.inject(this.bundle);
    }
  });

  Bundle.Button = new Class({
    // label, text
    // action -> click
    'Extends': Bundle,
    'get'    : undefined,
    'set'    : undefined,

    'initialize': function (params) {
      this.params = params;
      this.params.searchString = '•' + this.params.tab + '•' + this.params.group + '•';

      this.createDOM();
      this.setupDOM();
      this.addEvents();

      if (this.params.id !== undefined) {
        this.element.set('id', this.params.id);
      }

      this.params.searchString = this.params.searchString.toLowerCase();
    },

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle button'
      });

      this.container = new Element('div', {
        'class': 'setting container button'
      });

      this.element = new Element('input', {
        'class': 'setting element button',
        'type' : 'button'
      });

      this.label = new Element('label', {
        'class': 'setting label button'
      });
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }

      if (this.params.text !== undefined) {
        this.element.set('value', this.params.text);
        this.params.searchString += this.params.text + '•';
      }

      this.element.inject(this.container);
      this.container.inject(this.bundle);
    },

    'addEvents': function () {
      this.element.addEvent('click', (function () {
        this.fireEvent('action');
      }).bind(this));
    }
  });

  /* File Button -- Work In Progress
   *
   * Bundle.FileButton = new Class({
   *     // label, text
   *     // action -> click
   *     'Extends': Bundle.Button,
   *     'initialize': function (params) {
   *         this.params = params;
   *         this.params.searchString = '•' + this.params.tab + '•' + this.params.group + '•';
   *
   *         this.createDOM();
   *         this.setupDOM();
   *         this.addEvents();
   *
   *         if (this.params.id !== undefined) {
   *             this.element.set('id', this.params.id);
   *         }
   *
   *         this.params.searchString = this.params.searchString.toLowerCase();
   *     },
   *
   *     'createDOM': function () {
   *         //-- do same DOM creation as `Button`
   *         this.parent();
   *
   *         //-- add file specific DOM creation
   *         this.element = new Element('input', {
   *             'class': 'setting element button',
   *             'type': 'file'
   *         });
   *
   *         this.label = new Element('label', {
   *             'class': 'setting label button'
   *         });
   *     },
   *
   *     'setupDOM': function () {
   *         //-- do same DOM setup as `Button`
   *         this.parent();
   *     },
   *
   *     'addEvents': function () {
   *         this.modalElement.addEvent('click', (function () {
   *             this.fireEvent('action');
   *         }).bind(this));
   *     }
   * });
   */

  Bundle.ModalButton = new Class({
    // label, text
    // action -> click
    'Extends': Bundle.Button,

    'createDOM': function () {
      //-- do same DOM creation as `Button`
      this.parent();

      //-- add modal specific DOM creation
      this.modalBackdrop = new Element('div', {
        'class': 'modal backdrop hide'
      });

      this.modalContainer = new Element('div', {
        'class': 'modal container'
      });

      this.modalTitle = new Element('h2', {
        'class': 'modal title'
      });

      this.modalDone = new Element('button', {
        'class': 'modal done'
      })
    },

    'setupDOM': function () {
      //-- do same DOM setup as `Button`
      this.parent();

      //-- add modal specific DOM setup
      var that = this;

      if (this.params.modal.title !== undefined) {
        this.modalTitle.set('html', this.params.modal.title);
        this.modalTitle.inject(this.modalContainer);
        this.params.searchString += this.params.label + '•';
      }

      this.modalContainer.inject(this.modalBackdrop);
      this.modalBackdrop.inject(this.bundle);

      this.params.modal.contents.forEach(function (item) {
        (new Setting(that.modalContainer)).create(item);
      });

      this.modalDone.set('html', 'Done');
      this.modalDone.inject(this.modalContainer);
    },

    'addEvents': function () {
      //-- do same addEvents as `Button`
      this.parent();

      //-- add model specific events
      this.element.addEvent('click', (function () {
        this.modalBackdrop.removeClass('hide');
      }).bind(this));

      this.modalDone.addEvent('click', (function () {
        this.modalBackdrop.addClass('hide');
        this.fireEvent('modal_done');
      }).bind(this));
    }
  });

  Bundle.Text = new Class({
    // label, text, masked
    // action -> change & keyup
    'Extends': Bundle,

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle text'
      });

      this.container = new Element('div', {
        'class': 'setting container text'
      });

      this.element = new Element('input', {
        'class': 'setting element text',
        'type' : 'text'
      });

      this.label = new Element('label', {
        'class': 'setting label text'
      });
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }

      if (this.params.text !== undefined) {
        this.element.set('placeholder', this.params.text);
        this.params.searchString += this.params.text + '•';
      }

      if (this.params.masked === true) {
        this.element.set('type', 'password');
        this.params.searchString += 'password' + '•';
      }

      this.element.inject(this.container);
      this.container.inject(this.bundle);
    },

    'addEvents': function () {
      var change = (function (event) {
        if (this.params.name !== undefined) {
          settings.set(this.params.name, this.get());
        }

        this.fireEvent('action', this.get());
      }).bind(this);

      this.element.addEvent('change', change);
      this.element.addEvent('keyup', change);
    }
  });

  Bundle.Checkbox = new Class({
    // label
    // action -> change
    'Extends': Bundle,

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle checkbox'
      });

      this.container = new Element('div', {
        'class': 'setting container checkbox'
      });

      this.element = new Element('input', {
        'id'   : String.uniqueID(),
        'class': 'setting element checkbox',
        'type' : 'checkbox',
        'value': 'true'
      });

      this.label = new Element('label', {
        'class': 'setting label checkbox',
        'for'  : this.element.get('id')
      });
    },

    'setupDOM': function () {
      this.element.inject(this.container);
      this.container.inject(this.bundle);

      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }
    },

    'get': function () {
      return this.element.get('checked');
    },

    'set': function (value, noChangeEvent) {
      this.element.set('checked', value);

      if (noChangeEvent !== true) {
        this.element.fireEvent('change');
      }

      return this;
    }
  });

  Bundle.Slider = new Class({
    // label, max, min, step, display, displayModifier
    // action -> change
    'Extends': Bundle,

    'initialize': function (params) {
      this.params = params;
      this.params.searchString = '•' + this.params.tab + '•' + this.params.group + '•';

      this.createDOM();
      this.setupDOM();
      this.addEvents();

      if (this.params.name !== undefined) {
        this.set((settings.get(this.params.name) || 0), true);
      } else {
        this.set(0, true);
      }

      this.params.searchString = this.params.searchString.toLowerCase();
    },

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle slider'
      });

      this.container = new Element('div', {
        'class': 'setting container slider'
      });

      this.element = new Element('input', {
        'class': 'setting element slider',
        'type' : 'range'
      });

      this.label = new Element('label', {
        'class': 'setting label slider'
      });

      this.display = new Element('span', {
        'class': 'setting display slider'
      });
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }

      if (this.params.max !== undefined) {
        this.element.set('max', this.params.max);
      }

      if (this.params.min !== undefined) {
        this.element.set('min', this.params.min);
      }

      if (this.params.step !== undefined) {
        this.element.set('step', this.params.step);
      }

      this.element.inject(this.container);
      if (this.params.display !== false) {
        if (this.params.displayModifier !== undefined) {
          this.display.set('text', this.params.displayModifier(0));
        } else {
          this.display.set('text', 0);
        }
        this.display.inject(this.container);
      }
      this.container.inject(this.bundle);
    },

    'addEvents': function () {
      this.element.addEvent('change', (function (event) {
        if (this.params.name !== undefined) {
          settings.set(this.params.name, this.get());
        }

        if (this.params.displayModifier !== undefined) {
          this.display.set('text', this.params.displayModifier(this.get()));
        } else {
          this.display.set('text', this.get());
        }
        this.fireEvent('action', this.get());
      }).bind(this));
    },

    'get': function () {
      return Number.from(this.element.get('value'));
    },

    'set': function (value, noChangeEvent) {
      this.element.set('value', value);

      if (noChangeEvent !== true) {
        this.element.fireEvent('change');
      } else {
        if (this.params.displayModifier !== undefined) {
          this.display.set('text', this.params.displayModifier(Number.from(value)));
        } else {
          this.display.set('text', Number.from(value));
        }
      }

      return this;
    }
  });

  Bundle.PopupButton = new Class({
    // label, options[{value, text}]
    // action -> change
    'Extends': Bundle,

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle popup-button'
      });

      this.container = new Element('div', {
        'class': 'setting container popup-button'
      });

      this.element = new Element('select', {
        'class': 'setting element popup-button'
      });

      this.label = new Element('label', {
        'class': 'setting label popup-button'
      });

      if (this.params.options === undefined) {
        return;
      }

      // convert array syntax into object syntax for options
      function arrayToObject(option) {
        if (typeOf(option) == 'array') {
          option = {
            'value': option[0],
            'text' : option[1] || option[0],
          };
        }
        return option;
      }

      // convert arrays
      if (typeOf(this.params.options) == 'array') {
        var values = [];
        this.params.options.each((function (values, option) {
          values.push(arrayToObject(option));
        }).bind(this, values));
        this.params.options = {'values': values};
      }

      var groups;
      if (this.params.options.groups !== undefined) {
        groups = {};
        this.params.options.groups.each((function (groups, group) {
          this.params.searchString += (group) + '•';
          groups[group] = (new Element('optgroup', {
            'label': group,
          }).inject(this.element));
        }).bind(this, groups));
      }

      if (this.params.options.values !== undefined) {
        this.params.options.values.each((function (groups, option) {
          option = arrayToObject(option);
          this.params.searchString += (option.text || option.value) + '•';

          // find the parent of this option - either a group or the main element
          var parent;
          if (option.group && this.params.options.groups) {
            if ((option.group - 1) in this.params.options.groups) {
              option.group = this.params.options.groups[option.group - 1];
            }
            if (option.group in groups) {
              parent = groups[option.group];
            }
            else {
              parent = this.element;
            }
          }
          else {
            parent = this.element;
          }

          (new Element('option', {
            'value': option.value,
            'text' : option.text || option.value,
          })).inject(parent);
        }).bind(this, groups));
      }
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }

      this.element.inject(this.container);
      this.container.inject(this.bundle);
    }
  });

  Bundle.ListBox = new Class({
    // label, options[{value, text}]
    // action -> change
    'Extends': Bundle.PopupButton,

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle list-box'
      });

      this.container = new Element('div', {
        'class': 'setting container list-box'
      });

      this.element = new Element('select', {
        'class': 'setting element list-box',
        'size' : '2'
      });

      this.label = new Element('label', {
        'class': 'setting label list-box'
      });

      if (this.params.options === undefined) {
        return;
      }
      this.params.options.each((function (option) {
        this.params.searchString += (option.text || option.value) + '•';

        (new Element('option', {
          'value': option.value,
          'text' : option.text || option.value
        })).inject(this.element);
      }).bind(this));
    },

    'get': function () {
      return (this.element.get('value') || undefined);
    }
  });

  Bundle.Textarea = new Class({
    // label, text, value
    // action -> change & keyup
    'Extends': Bundle,

    'createDOM': function () {
      this.bundle = new Element('div', {
        'class': 'setting bundle textarea'
      });

      this.container = new Element('div', {
        'class': 'setting container textarea'
      });

      this.element = new Element('textarea', {
        'class': 'setting element textarea'
      });

      this.label = new Element('label', {
        'class': 'setting label textarea'
      });
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.container);
        this.params.searchString += this.params.label + '•';
      }

      if (this.params.text !== undefined) {
        this.element.set('placeholder', this.params.text);
        this.params.searchString += this.params.text + '•';
      }

      if (this.params.value !== undefined) {
        this.element.appendText(this.params.text);
      }

      this.element.inject(this.container);
      this.container.inject(this.bundle);
    },

    'addEvents': function () {
      var change = (function (event) {
        if (this.params.name !== undefined) {
          settings.set(this.params.name, this.get());
        }

        this.fireEvent('action', this.get());
      }).bind(this);

      this.element.addEvent('change', change);
      this.element.addEvent('keyup', change);
    }
  });

  Bundle.RadioButtons = new Class({
    // label, options[{value, text}]
    // action -> change
    'Extends': Bundle,

    'createDOM': function () {
      var settingID = String.uniqueID();

      this.bundle = new Element('div', {
        'class': 'setting bundle radio-buttons'
      });

      this.label = new Element('label', {
        'class': 'setting label radio-buttons'
      });

      this.containers = [];
      this.elements = [];
      this.labels = [];

      if (this.params.options === undefined) {
        return;
      }
      this.params.options.each((function (option) {
        var optionID,
            container;

        this.params.searchString += (option.text || option.value) + '•';

        optionID = String.uniqueID();
        container = (new Element('div', {
          'class': 'setting container radio-buttons'
        })).inject(this.bundle);
        this.containers.push(container);

        this.elements.push((new Element('input', {
          'id'   : optionID,
          'name' : settingID,
          'class': 'setting element radio-buttons',
          'type' : 'radio',
          'value': option.value
        })).inject(container));

        this.labels.push((new Element('label', {
          'class': 'setting element-label radio-buttons',
          'for'  : optionID,
          'text' : option.text || option.value
        })).inject(container));
      }).bind(this));
    },

    'setupDOM': function () {
      if (this.params.label !== undefined) {
        this.label.set('html', this.params.label);
        this.label.inject(this.bundle, 'top');
        this.params.searchString += this.params.label + '•';
      }
    },

    'addEvents': function () {
      this.bundle.addEvent('change', (function (event) {
        if (this.params.name !== undefined) {
          settings.set(this.params.name, this.get());
        }

        this.fireEvent('action', this.get());
      }).bind(this));
    },

    'get': function () {
      var checkedEl = this.elements.filter((function (el) {
        return el.get('checked');
      }).bind(this));
      return (checkedEl[0] && checkedEl[0].get('value'));
    },

    'set': function (value, noChangeEvent) {
      var desiredEl = this.elements.filter((function (el) {
        return (el.get('value') === value);
      }).bind(this));
      desiredEl[0] && desiredEl[0].set('checked', true);

      if (noChangeEvent !== true) {
        this.bundle.fireEvent('change');
      }

      return this;
    }
  });

  Bundle.CustomThingsTable = new Class({
    /**
     * DISCLAIMER: Quick and Dirty way of making this work. For your own safety, don't look at this too closely...
     */
    // label, text, value
    // action -> change & keyup
    Extends: Bundle,

    // {poolId: {thingId: {columnId: value}}}
    data: {},

    //  {poolId: DOM Element}
    pools: {},

    thingIdAndColumnIdToDomId: (thingId, columnId) => `thing_cell_input_${thingId}_${columnId}`,
    poolIdToDomId: (poolId) => `pool_table_${poolId}`,
    thingIdToDomId: (thingId) => `thing_row_${thingId}`,

    updatePool(poolId, thingsColumns, searchFunction, onUpdate) {
      debugger;
      const { poolColumns, thingsColumns: currentThingsColumns } = this.data[poolId];
      const currentThingIds = new Set(Object.keys(currentThingsColumns));
      const thingIds = new Set(Object.keys(thingsColumns));
      const allThingIds = new Set([...currentThingIds, ...thingIds]);
      const [commonThingIds, removedThingIds, addedThingIds] = allThingIds
        .reduce(([common, removed, added], thingId) => {
          if (currentThingIds.has(thingId) && thingIds.has(thingId)) {
            return [common.add(thingId), removed, added];
          } else if (currentThingIds.has(thingId)) {
            return [common, removed.add(thingId), added];
          }
          return [common, removed, added.add(thingId)];
        },
        [Set(), Set(), Set()]
      );

      // const objectMap = (object, func) => Object.assign(
      //   ...Object.entries(object).map(([key, value]) => ({ [key]: func(value) }))
      // );

      const zip = (...arrays) => [...arrays[0]].map(
        (_, index) => arrays.map((array) => array[index])
      );

      const zipObjectWithFunctionAndCondition = (keys, values, func, condition) => Object.assign(
        ...zip(keys, values).filter(condition).map(([key, value]) => ({ [key]: func(value, key) }))
      );

      const objectMap = (object, func, condition=() => true) => zipObjectWithFunctionAndCondition(
        ...Object.entries(object), func, condition
      );

      const mapKeysToObject = (keys, func) => Object.assign(
        ...keys.map((key) => ({ [key]: func(key) }))
      );

      const commonColumns = zipObjectWithFunctionAndCondition(
        commonThingIds
      );

      const commonThingIdThings = commonThingIds
        .map((thingId) => [thingId, this.data[thingId], thingsColumns[thingId]]);

      const zippedColumns = commonThingIdThings
        .map(([thingId, thing, newThing]) => Object.keys(poolColumns)
          .map((columnId) => [thingId, columnId, thing[columnId], newThing[columnId]]));

      const changedColumns = zippedColumns.filter(
        ([thingId, columnId, oldColumn, newColumn]) => oldColumn !== newColumn
      );

      const newChangedColumns = changedColumns
        .map(([thingId, columnId, oldColumn, newColumn]) => [thingId, columnId, newColumn]);

      const changedColumnsElementId = newChangedColumns
        .map(([thingId, columnId, newColumn]) => [
          this.thingIdAndColumnIdToDomId(thingId, columnId),
          newColumn,
        ]);

      const changedColumnsElement = changedColumnsElementId
        .map(([elementId, newColumn]) => [document.getElementById(elementId), newColumn]);

      changedColumnsElement.forEach(([element, value]) => element.value = value);

      // commonThingIds
      //   .map((thingId) => [thingId, currentThingsColumns[thingId], thingsColumns[thingId]])
      //   .map(([thingId, currentColumns, newColumns]) => [thingId, Object.keys(poolColumns)
      //     .map((columnId) => [columnId, currentColumns[columnId] || '', newColumns[columnId] || ''])
      //     .filter(([columnId, currentValue, newValue]) => currentValue !== newValue)
      //     .map(([columnId, currentValue, newValue]) => [columnId, newValue])])
      //   .forEach(([thingId, changedColumns]) => changedColumns
      //     .map((columnId, newValue) => [newValue, document.getElementById(
      //       this.thingIdAndColumnIdToDomId(thingId, columnId)
      //     )])
      //     .forEach((newValue, inputElement) => inputElement.value = newValue));

      commonThingIds
      // thingId => [thingId, [inputElement, new Value]]
        .map((thingId) => Object
          // [columnId]
          .keys(poolColumns)
          // columnId => [inputElement, new Value]
          .map((columnId) => [
            currentThingsColumns[thingId],
            thingsColumns[thingId],
          ])
        );
    },

    addPool(poolId, poolColumns, thingsColumns, searchFunction, onUpdated) {
      const containerElement = new Element('div', { id: this.poolIdToDomId(poolId) });
      const tableElement = new Element('table', {});

      // add an extra column for the thing ids
      poolColumns[0] = 'Thing ID';

      // add headers of the table
      const header = Object.values(poolColumns);
      const headerRow = new Element('tr', {});
      new Element('th', {}).inject(headerRow);
      header.forEach((head) => {
        new Element('th', { text: head }).inject(headerRow);
      });
      headerRow.inject(tableElement);

      const tableHeader = new Element('thead');
      headerRow.inject(tableHeader);

      const tableBody = new Element('tbody');

      // add search boxes for all columns
      const searchBoxes = {};
      const searchRow = new Element('tr', {});
      new Element('td', {}).inject(searchRow);
      Object.keys(poolColumns).forEach((columnId) => {
        const searchBox = new Element('input', {
          type: 'search',
          placeholder: 'Search...',
          style: 'width:100%;',
        });
        const searchCell = new Element('td', {});
        searchBox.inject(searchCell);
        searchCell.inject(searchRow);
        searchBoxes[columnId] = searchBox;
      });
      searchRow.inject(tableBody);

      const rows = {};

      Object.entries(thingsColumns).forEach(([thingId, thingColumns]) => {
        const rowElement = new Element('tr', { id: this.thingIdToDomId(thingId) });

        const extraButtons = new Element('div', { style: 'display:flex;' });

        const deleteButton = new Element('input', { type: 'button', value: 'Delete' });
        const fillButton = new Element('input', { type: 'button', value: 'Fill missing' });

        const container = new Element('td', {});

        deleteButton.inject(extraButtons);
        fillButton.inject(extraButtons);
        extraButtons.inject(container);
        container.inject(rowElement);

        Object.keys(poolColumns).forEach((columnId) => {
          const columnValue = columnId === '0'? thingId: (thingColumns[columnId] || '');
          const dataCell = new Element('td', {});
          const inputElement = new Element('input', {
            type: 'text',
            value: columnValue,
            style: 'width:100px;',
            id: this.thingIdAndColumnIdToDomId(thingId, columnId),
          });
          // todo: maybe add a colored border around the input element when the change was not saved yet and only save it once the enter key is pressed or something like that
          inputElement.addEventListener('input', () => onUpdated(
            thingId, columnId, inputElement.value
          ));
          inputElement.inject(dataCell);
          dataCell.inject(rowElement);
        });
        rows[thingId] = rowElement;
        rowElement.inject(tableBody);
      });

      Object.entries(searchBoxes).forEach(([columnId, searchBox]) =>
        searchBox.addEventListener('input', () => {
          // todo: add sorting?
          const pattern = searchBox.value;
          if (pattern === '') {
            // show all rows
            Object.values(rows).forEach((row) => row.style.display = 'table-row');
            return;
          }
          // the rows already have the thing id as their DOM element id
          const matchingThingIds = (columnId === '0')? [`thing_${pattern}`]: searchFunction(columnId, pattern);
          // hide all rows
          Object.values(rows).forEach((row) => row.style.display = 'none');
          // show the matching rows
          matchingThingIds.forEach((thingId) => rows[thingId].style.display = 'table-row');
        })
      );

      const headerText = `Pool #${poolId}:`;
      this.params.searchString += `${headerText}•`;
      const headingElement = new Element('h2', { text: headerText });
      headingElement.inject(containerElement);
      tableElement.inject(containerElement);

      tableHeader.inject(tableElement);
      tableBody.inject(tableElement);

      // const searchStringBefore = this.params.searchString;
      // headingElement.addEventListener('input', () => {
      //   this.params.searchString = searchStringBefore + headingElement.innerText + '•';
      // });
      // this.params.searchString += headingElement.innerText + '•';

      return containerElement;
    },

    createDOM() {
      this.bundle = new Element('div', {
        class: 'setting bundle customThingsTable',
      });

      this.element = new Element('div', {
        class: 'setting element customThingsTable',
      });

      // const poolColumns = this.params.poolColumns || {};
      // this.things = this.params.things || {};
      // const onThingUpdated = this.params.onThingUpdated || (() => {});
      // const searchFunction = this.params.searchFunction || (() => []);
      // this.heading = this.params.heading || '';

      this.element.inject(this.bundle);
    },

    setupDOM() {

    },

    get() {
      return this.value;
    },

    set(value, noChangeEvent) {
      debugger;
      if (value === undefined) return;
      console.log('value set to', value);

      // for the pools that already exist, update them
      Object.entries(value)
        .filter(([poolId]) => poolId in this.pools)
        .map(([poolId, { thingsColumns, poolColumns }]) => this.updatePool(poolId, thingsColumns, () => [], () => {}));
      debugger;
      Object.entries(value).filter(([poolId]) => !(poolId in this.pools)).map(([poolId, { thingsColumns, poolColumns }]) =>
        this.addPool(poolId, poolColumns, thingsColumns, (columnId, pattern) => {
          const regex = RegExp(pattern);
          return Object.entries(thingsColumns)
            .filter(([thingId, thingColumns]) => regex.test(thingColumns[columnId]))
            .map(([thingId]) => thingId);
        })
      ).forEach((containerElement) => containerElement.inject(this.element));

      this.data = value;

      if (!noChangeEvent) {
        this.bundle.fireEvent('change');
      }

      return this;
    },

    'addEvents': function () {
      const self = this;
      window.addEventListener('storage', (event) => {
        debugger;
        if (event.key !== `store.settings.${self.params.name}`) return;
        event.key === 'store.settings.customThings';
        event.newValue === '[object Object]';
      });
      // var change = (function (event) {
      //   if (this.params.name !== undefined) {
      //     settings.set(this.params.name, this.get());
      //   }
      //
      //   this.fireEvent('action', this.get());
      // }).bind(this);
      //
      // this.element.addEvent('change', change);
      // this.element.addEvent('keyup', change);
    }
  });

  this.Setting = new Class({
    'initialize': function (container) {
      this.container = container;
    },

    'create': function (params) {
      var types,
          bundle;

      // Available types
      types = {
        'description' : 'Description',
        'button'      : 'Button',
        'text'        : 'Text',
        'textarea'    : 'Textarea',
        'checkbox'    : 'Checkbox',
        'slider'      : 'Slider',
        'popupButton' : 'PopupButton',
        'listBox'     : 'ListBox',
        'radioButtons': 'RadioButtons',
        'modalButton' : 'ModalButton',
        'customThingsTable' : 'CustomThingsTable',
        //'fileButton': 'FileButton'
      };

      if (types.hasOwnProperty(params.type)) {
        bundle = new Bundle[types[params.type]](params);
        bundle.bundleContainer = this.container;
        bundle.bundle.inject(this.container);
        return bundle;
      } else {
        throw 'invalidType';
      }
    }
  });
}());
