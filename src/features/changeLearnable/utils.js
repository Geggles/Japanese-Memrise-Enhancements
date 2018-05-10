import exists from '../../utils/existingProperty';
import { onBeforeBoxMade, onAfterBoxMade, onAfterBoxReady, onBeforeBoxReady } from '../../others/boxArrival';
import { chainIterators } from '../../utils/helperFunctions';
import awaitDecorator from '../../utils/awaitDecorator';
import { bind, isJapanese, unbind } from '../../libraries/wanakana';
import SemiPromise from '../../utils/semiPromise';
import { withoutAccumulator as reducer } from '../../utils/reduceObjectAssignment';
import { promisesPromise as thingAndPoolPromisesPromise } from '../../others/thingsAndPools';
