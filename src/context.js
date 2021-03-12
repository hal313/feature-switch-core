import * as Util from './util.js';

/**
 * Creates a context, overriding default implementations with passed in values
 *
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {Object} context an object with any provided overrides
 * @returns {Object} an object which has all API functions implemented, some of which may be overriden
 */
export const createContext = (features, context) => {

    // Make sure that the passed in value was an object
    let actualContext = Util.isObject(context) ? context : {};

    return {
        /**
         * Executes a function.
         *
         * @param {Function} fn the function to execute
         * @param {Array} args the arguments to be passed to the function at execution time
         * @returns the value from the execution of <i>fn</i>
         */
        execute: (Util.isFunction(actualContext.execute) ? actualContext.execute : (fn, args) => fn.apply({}, args)),

        /**
         * Determines if a value should be treated as true. Useful for implementations which intend to consider values
         * such as "yes" or "on" as being true.
         *
         * @param {any} value the value to evaluate for truthiness
         * @returns true, if the <i>value</i> should be considered true
         */
        isTrue: (Util.isFunction(actualContext.isTrue) ? actualContext.isTrue : value => Util.isTrue(value)),

        /**
         * Determines if a feature is enabled.
         *
         * @param {string} feature the feature name
         * @param {Object} features the feature object; values are feature names and values should be boolean
         * @returns {boolean} true if the feature should be enabled
         */
        isEnabled: (Util.isFunction(actualContext.isEnabled) ? actualContext.isEnabled : feature => Util.isTrue(features[feature])),

        /**
         * Determines if the feature can be set.
         *
         * @param {string} feature the feature name to set
         * @param {boolean} proposedEnabled the proposed new value
         * @returns {boolean} returns true if the feature can be set to the proposed value
         */
        canSet: (Util.isFunction(actualContext.canSet) ? actualContext.canSet : (feature, proposedEnabled) => true), // jshint ignore:line

        /**
         * Determines if features can be added.
         *
         * @returns {boolean} true if features are allowed to be added
         */
        canAddFeatures: (Util.isFunction(actualContext.canAddFeatures) ? actualContext.canAddFeatures : () => true),

        /**
         * Determines if features can be removed.
         *
         * @returns {boolean} true if features are allowed to be removed
         */
        canRemoveFeatures: (Util.isFunction(actualContext.canRemoveFeatures) ? actualContext.canRemoveFeatures : () => true),

        /**
         * The error handler for when changeListeners on the FeatureManager throw an error. Since these
         * are executed asynchronously, the error are uncaught. By overriding this in the context,
         * errors can be dealt with. The default implementation logs the error.
         */
        onListenerError: (Util.isFunction(actualContext.onListenerError) ? actualContext.onListenerError : error => console.warn(`uncaught error during listener invocation "${error}"`))
    };

};
