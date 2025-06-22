import {getTransformer, getTransformCode, getCode, showTransformer, getAst} from './selectors';
import {SourceMapConsumer} from 'source-map/lib/source-map-consumer';
import { publish } from '../utils/pubsub';

async function transform(transformer, transformCode, code, ast) {
  // Transforms may make use of Node's __filename global. See GitHub issue #420.
  // So we define a dummy one.
  if (!global.__filename) {
    global.__filename = 'transform.js';
  }
  if (!transformer._promise) {
    transformer._promise = new Promise(transformer.loadTransformer);
  }
  let realTransformer;
  try {
    realTransformer = await transformer._promise;
    let result = await transformer.transform(realTransformer, transformCode, code, ast);
    let map = null;
    let match = null;
    if (typeof result !== 'string') {
      if (result.map) {
        map = new SourceMapConsumer(result.map);
      }
      match = result.match;
      result = result.code;
    }
    return { result, map, match, version: realTransformer.version, error: null };
  } catch(error) {
    return {
      error,
      version: realTransformer ? realTransformer.version : '',
    };
  }
}

export default store => next => async (action) => {
  const oldState = store.getState();
  next(action);
  const newState = store.getState();

  const show = showTransformer(newState);

  if (!show) {
    return
  }

  const newTransformer = getTransformer(newState);
  const newTransformCode = getTransformCode(newState);
  const newCode = getCode(newState);
  const newAst = getAst(newState);

  if (
    action.type === 'SET_PARSE_RESULT' ||
    show != showTransformer(oldState) ||
    getTransformer(oldState) !== newTransformer ||
    getTransformCode(oldState) !== newTransformCode ||
    getCode(oldState) !== newCode
  ) {
    if (!newTransformer || newCode == null) {
      return;
    }

    if (console.clear) {
      console.clear();
    }

    let result;
    try  {
      result = await transform(newTransformer, newTransformCode, newCode, newAst);
    } catch (error) {
      result = {error}
    }

    // Did anything change in the meantime?
    if (
      newTransformer !== getTransformer(store.getState()) ||
      newTransformCode !== getTransformCode(store.getState()) ||
      newCode !== getCode(store.getState())
    ) {
      return;
    }

    if (result.match) {
      publish("HIGHLIGHT", result.match);
    }

    if (result.error) {
      console.error(result.error); // eslint-disable-line no-console
    }
    next({
      type: 'SET_TRANSFORM_RESULT',
      result,
    });
  }
};
