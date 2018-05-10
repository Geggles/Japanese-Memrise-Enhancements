/* global channel, optionsReady */

import exists from '../../utils/existingProperty';
import { onAfterBoxReady } from '../../others/boxArrival';
import awaitDecorator from '../../utils/awaitDecorator';
import takePrioritized from '../../utils/takePrioritized';
import { containsKanji } from '../../utils/helperFunctions';
import thingsAndPools from '../../others/thingsAndPools';

onAfterBoxReady(awaitDecorator(function* (box) {
  if (!(box.template === 'typing' || box.template === 'audio_typing')) return;
  const options = yield optionsReady;
  if (!options.getValue('showKanjiAfterCorrect')) return;

  // collecting the necessary information
  const thingId = box.learnable.thing_id;

  const [onCorrect, session] = yield exists(window, ['MEMRISE', 'garden', 'session', 'onCorrect']);
  session.onCorrect = new Proxy(onCorrect, {
    apply(target, thisArg, argList) {
      exists(box, ['thinguser', 'column_b']).then(([promptColumn]) => {
        const thingAndPool = thingsAndPools[thingId];
        if (thingAndPool === undefined) return;  // missed our chance
        const [thingReference, poolReference] = thingAndPool;
        const thing = Object.assign({}, thingReference);
        const pool = Object.assign({}, poolReference);

        // we except the column used for the prompt
        delete thing.columns[promptColumn];

        // [thingColumn, poolColumn] pairs
        const zippedColumns = Object
          .entries(thing.columns)
          .map(([index, thingColumn]) => [thingColumn, pool.columns[index]]);

        // heuristics by which to select the column that probably contains the kanji version of the
        // vocab, descendingly ordered by their likelihood of being the correct column to choose
        const priorities = [
          ([thingColumn, poolColumn]) => poolColumn.label.toLowerCase() === 'kanji',
          ([thingColumn, poolColumn]) => containsKanji(thingColumn.val),
        ];
        // on text columns can be kanji columns
        const filter = ([thingColumn, poolColumn]) => poolColumn.kind === 'text';

        const kanjiColumn = takePrioritized(zippedColumns, priorities, filter);
        if (kanjiColumn === null) return;
        const kanjiAnswer = kanjiColumn[0].val;

        exists(box, ['$input', 'setValue']).then(([setInputValue]) => {
          box.$input.setValue(kanjiAnswer);
          setInputValue(kanjiAnswer);
        });
      });
      return target.apply(thisArg, argList);
    },
  });
}));
