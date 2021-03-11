import * as Util from './util.js';

export const createContext = (features, context) => {

    let actualContext = Util.isObject(context) ? context : {};
    return {
        execute: (Util.isFunction(actualContext.execute) ? actualContext.execute : (fn, args) => fn.apply({}, args)),
        isTrue: (Util.isFunction(actualContext.isTrue) ? actualContext.isTrue : value => Util.isTrue(value)),
        isEnabled: (Util.isFunction(actualContext.isEnabled) ? actualContext.isEnabled : featureName => Util.isTrue(features[featureName])),
        canSet: (Util.isFunction(actualContext.canSet) ? actualContext.canSet : (featureName, proposedEnabled) => true), // jshint ignore:line
        canAddFeatures: (Util.isFunction(actualContext.canAddFeatures) ? actualContext.canAddFeatures : () => true),
        canRemoveFeatures: (Util.isFunction(actualContext.canRemoveFeatures) ? actualContext.canRemoveFeatures : () => true),
        onListenerError: (Util.isFunction(actualContext.onListenerError) ? actualContext.onListenerError : error => console.warn(`uncaught error during listener invocation "${error}"`))
    };

};
