import * as Util from './util.js';

export const createContext = (features, context) => {

    let actualContext = Util.isObject(context) ? context : {};
    return {
        // execute: actualContext.execute || ((fn, args) => fn.apply(args)),
        execute: (Util.isFunction(actualContext.execute) ? actualContext.execute : (fn, args) => fn.apply({}, args)),
        // isTrue: actualContext.isTrue || (value => Util.isTrue(value)),
        isTrue: (Util.isFunction(actualContext.isTrue) ? actualContext.isTrue : value => Util.isTrue(value)),
        // isEnabled: actualContext.isEnabled || (featureName => Util.isTrue(features[featureName])),
        isEnabled: (Util.isFunction(actualContext.isEnabled) ? actualContext.isEnabled : featureName => Util.isTrue(features[featureName])),
        // canSet: actualContext.canSet || ((featureName, proposedEnabled) => true), // jshint ignore:line
        canSet: (Util.isFunction(actualContext.canSet) ? actualContext.canSet : (featureName, proposedEnabled) => true), // jshint ignore:line
        // canAddFeatures: actualContext.canAddFeatures || (() => true),
        canAddFeatures: (Util.isFunction(actualContext.canAddFeatures) ? actualContext.canAddFeatures : () => true),
        // canRemoveFeatures: actualContext.canRemoveFeatures || (() => true)
        canRemoveFeatures: (Util.isFunction(actualContext.canRemoveFeatures) ? actualContext.canRemoveFeatures : () => true),
        onListenerError: (Util.isFunction(actualContext.onListenerError) ? actualContext.onListenerError : error => console.warn(`uncaught error during listener invocation "${error}"`))
    };

};
