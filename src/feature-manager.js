import * as Context from './context.js';
import * as Util from './util.js' ;

/**
 * Determines if a value is a features object. The value must be an object (not an array) and each
 * value must be a boolean.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is a feature object; false otherwise
 */
export const isFeatures = features => Util.isObjectStrict(features) && Object.values(features).every(Util.isBoolean);

/**
 * Iterates through a function and assigns values to be strictly boolean true or false,
 * based on the <i>deciderFn</i>.
 *
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {Function} deciderFn the function which decides if values are boolean true
 * @returns {Object} a strict features object
 */
const castAsFeatures = (features, deciderFn) => {
    const strictFeatures = Util.isObjectStrict(features) ? features : {};
    const fn = Util.isFunction(deciderFn) ? deciderFn : Util.isTrue;
    Object.keys(strictFeatures).forEach(feature => strictFeatures[feature] = Util.isTrue(fn(strictFeatures[feature])));
    return strictFeatures;
};

/**
 * Iterates through a function and assigns values to be strictly boolean true or false, based on
 * the output of  Util.isBoolean().
 *
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @returns {Object} a strict features object
 */
export const asFeatures = features => {
    return castAsFeatures(features, Util.isTrue);
};

/**
 * Clones an object. This dereferences all values and strips out functions. Should be
 * used for cloning feature object.s
 *
 * @param {Object} source clones an object
 * @returns {Object} a clone
 */
const clone = source => {
    return JSON.parse(JSON.stringify(source));
};

/**
 * Fires events to the listeners.
 *
 * @param {string} feature the name of the feature
 * @param {boolean} value the new value (will be normalized using Util.isTrue)
 * @param {object} features the features
 * @param {objet[]} [listeners] a list of listeners
 * @param {function} [onError] the error function (when listener execution fails)
 */
const fireEvent = (feature, value, features, listeners, onError) => {
    const featureSnapshot = clone(features);

    listeners.forEach(listener => {
        // Async execution for speed and also to avoid errors when a callback throws
        setTimeout(() => {
            try {
                if (Util.isFunction(listener)) {
                    listener.apply({}, [featureSnapshot, feature, value]);
                }
            } catch (error) {
                if (Util.isFunction(onError)) {
                    onError.apply({}, [error, listener, feature, value, featureSnapshot]);
                } else {
                    console.warn('listener threw an exception', error);
                }
            }
        });
    });
};

/**
 *
 * @param {string} feature the name of the feature
 * @param {boolean} value the new value (will be normalized using Util.isTrue)
 * @param {object} features the features
 * @param {objet[]} [listeners] a list of listeners
 * @param {function} [onError] the error function (when listener execution fails)
 */
const setAndFireEvent = (feature, value, features, listeners, onError) => {
    if (Util.isUndefined(value)) {
        delete features[feature];
    } else {
        features[feature] = Util.isTrue(value);
    }
    fireEvent(feature, value, features, listeners, onError);
};

/**
 * Use the context to determine truthiness and normalize the value as a boolean.
 *
 * @param {any} value the value to make as a boolean
 * @param {Object} context the context to use to check for truthiness
 * @returns {Boolean} true if the context indicates that the value is true; false otherwise
 */
const normalizeContextTrue = (value, context) => {
    return Util.isTrue(context.isTrue(value));
};


/**
 * Manages features. Just like most feature management libaries.
 */
export class FeatureManager {

    /**
     * Constructs a new instance.
     *
     * @param {Object} features the feature object; values are feature names and values should be boolean
     * @param {Object} [context] optional context which can alter behavior
     */
    constructor(features, context) {
        // The listeners
        this.listeners = [];

        // This approach will use the context.isTrue for the initial normalization
        this.features = castAsFeatures(clone(features), context && context.isTrue);
        this.context = Context.createContext(this.features, context);
    }

    /**
     * Determines if features can be added to this FeatureManager.
     *
     * @returns {boolean} true, if feaures can be added; false otherwise
     */
    canAddFeatures() {
        return this.context.canAddFeatures();
    }

    /**
     * Adds features to this FeatureManager.
     *
     * @param {string} feature the feature name
     * @param {boolean} value the feature value
     */
    addFeature(feature, value) {
        if (this.canAddFeatures()) {
            // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
            const newValue = normalizeContextTrue(value,  this.context);
            setAndFireEvent(feature, newValue, this.features, this.listeners, this.context.onListenerError);
        }
    }

    /**
     * Determines if features can be removed from this FeatureManager.
     *
     * @returns {boolean} true, if feaures can be removed; false otherwise
     */

    canRemoveFeatures() {
        return this.context.canRemoveFeatures();
    }

    /**
     * Removes a feature from this FeatureManager. This is probably a bad idea.
     *
     * @param {string} feature the feature name to remove
     * @returns {boolean} true, if feaures was removed; false otherwise
     */
    removeFeature(feature) {
        if (this.hasFeature(feature) && this.canRemoveFeatures()) {
            setAndFireEvent(feature, undefined, this.features, this.listeners, this.context.onListenerError);
            return true;
        }
        return false;
    }

    /**
     * Determines if a feature exists.
     *
     * @param {string} feature the feature name
     * @returns {boolean} returns true if the feature exists; false otherwise
     */
    hasFeature(feature) {
        return Util.isDefined(this.features[feature]);
    }

    /**
     * Determines if a feature is enabled.
     *
     * @param {string} the feature name
     * @returns {boolean} true, if the feature is enabled; false otherwise
     */
    isEnabled(feature) {
        return this.hasFeature(feature) ? this.context.isEnabled(feature, clone(this.features)) : false;
    }

    /**
     * Determines if a feature is disbled.
     *
     * @param {string} the feature name
     * @returns {boolean} true, if the feature is disabled; false otherwise
     */
    isDisabled(feature) {
        // This is tricky; cannot return false if the feature is unknown because that would mean that
        //   isDisabled(unknown) === isEnabled(unknown) === false
        // And the world would explode
        return !this.isEnabled(feature);
    }

    /**
     * Determines if a feature can be set.
     *
     * @param {string} feature the name of the feature to set
     * @param {boolean} value the value of the feature to be set
     */
    canSetFeature(feature, value) {
        // Pass the raw value to the context
        return this.hasFeature(feature) ? this.context.canSet(feature, value) : false;
    }

    /**
     * Sets a feature
     *
     * @param {string} feature the name of the feature to set
     * @param {boolean} value the value of the feature to be set
     * @returns {boolean} true, if feaures can be enabled; false otherwise
     */
    setEnabled(feature, value) {
        // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
        const normalizedValue = normalizeContextTrue(value, this.context);
        if (this.hasFeature(feature) && this.canSetFeature(feature, normalizedValue)) {
            setAndFireEvent(feature, normalizedValue, this.features, this.listeners, this.context.onListenerError);
            return true;
        }
        return false;
    }

    /**
     * Get a snapshot of the features. This is a clone and alterations to the returned object
     * will not be reflected in the FeatureManager.
     *
     * @returns {Object} features the feature object; values are feature names and values should be boolean
     */
    getFeatures() {
        // Return a clone of the features
        return clone(this.features);
    }

    /**
     * Executes a function if a specified feature is enabled.
     *
     * @param {string} feature the feature name
     * @param {Function} fn the function to execute, if the feature is enabled
     * @param {[]} [args] the arguments for the function
     * @returns {any} the return value of the executed function
     */
    ifEnabled(feature, fn, args) {
        if(this.isEnabled(feature)) {
            return this.context.execute(fn, args);
        }
    }

    /**
     * Executes a function if a specified feature is disabled.
     *
     * @param {string} feature the feature name
     * @param {Function} fn the function to execute, if the feature is disabled
     * @param {[]} [args] the arguments for the function
     * @returns {any} the return value of the executed function
     */
    ifDisabled(feature, fn, args) {
        if (this.hasFeature(feature) && this.isDisabled(feature)) {
            return this.context.execute(fn, args);
        }
    }

    /**
     * Executes one of two functions, based on if the specified feature is enabled.
     *
     * @param {string} feature the name of the feature
     * @param {Function} enabledFn the function to execute if the feature is enabled
     * @param {Function} disabledFn the function to execute if the feature is disabled
     * @param {[]} [enabledArgs] arguments for the <i>enabledFn</i>
     * @param {[]} [disabledArgs] arguments for the <i>disabledFn</i>
     * @returns {any} the return value of the executed function, or undefined if the feature is unknown
     */
    decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs) {
        if (this.isEnabled(feature)) {
            return this.ifEnabled(feature, enabledFn, enabledArgs);
        } else if (this.isDisabled(feature)) {
            return this.ifDisabled(feature, disabledFn, disabledArgs);
        }
        // Feature is not defined
        return;
    }

    /**
     * Determines if a feature can be enabled.
     *
     * @param {string} feature the feature name
     * @returns {boolean} true, if the feature can be enabled; false otherwise
     */
    canEnable(feature) {
        return this.canSetFeature(feature, true);
    }

    /**
     * Determines if a feature can be disabled.
     *
     * @param {string} feature the feature name
     * @returns {boolean} true, if the feature can be disbled; false otherwise
     */
    canDisable(feature) {
        return this.canSetFeature(feature, false);
    }

    /**
     * Enables a feature.
     *
     * @param {string} feature the name of the feature to enable
     * @returns {boolean} true, if the feature was enabled; false otherwise
     */
    enable(feature) {
        if (this.canEnable(feature)) {
            this.setEnabled(feature, true);
            return true;
        }
        return false;
    }

    /**
     * Disables a feature.
     *
     * @param {string} feature the name of the feature to disable
     * @returns {boolean} true, if the feature was disabled; false otherwise
     */
    disable(feature) {
        if (this.canDisable(feature)) {
            this.setEnabled(feature, false);
            return true;
        }
        return false;
    }

    /**
     * Determines if a feature can be toggled.
     *
     * @param {string} feature the name of the feature to toggle.
     * @returns {boolean} true, if the feature can be toggled; false otherwise
     */
    canToggle(feature) {
        return this.isEnabled(feature) ? this.canDisable(feature) : this.canEnable(feature);
    }

    /**
     * Toggles a feature. If the feature is enabled, then the feature will be disabled. If
     * the feature is disabled, it will be enabled.
     *
     * @param {string} feature the feature to toggle.
     * @returns {boolean} true, if the feature can be toggled; false otherwise
     */
    toggle(feature) {
        if (this.canToggle(feature)) {
            this.isEnabled(feature) ? this.disable(feature) : this.enable(feature); // jshint ignore:line
            return true;
        }
        return false;
    }

    /**
     * Creates a function which will execute the passed in function if and only if the specified feature is enabled at the
     * time that the returned function is executed.
     *
     * @param {string} feature the feature name
     * @param {Function} fn the function to execute
     * @returns {Function} a function that will execute <i>fn</i> IFF <i>feature</i> is enabled
     */
    ifFunction(feature, fn) {
        return this.ifElseFunction(feature, fn, undefined);
    }

    /**
     * Creates a function which will execute the passed in function if and only if the specified feature is disabled at the
     * time that the returned function is executed.
     *
     * @param {string} feature the feature name
     * @param {Function} fn the function to execute
     * @returns {Function} a function that will execute <i>fn</i> IFF <i>feature</i> is disabled
     */
    elseFunction(feature, fn) {
        return this.ifElseFunction(feature, undefined, fn);
    }

    /**
     * An amalgamation of ifFunction and elseFunction. Creates a function which, when executed, will execute fnIf if the feature is enabled; otherwise
     * fnElse is executed.
     *
     * @param {string} feature the feature name
     * @param {Function} fnIf the function to execute if the feature is enabled
     * @param {Function} fnElse the function to execute if the featgure is disabled
     * @returns {Function} a function that will execute <i>fnIf</i> IFF <i>feature</i> is enabled and will execute <i>fnElse</i> IFF the feature is disabled
     */
    ifElseFunction(feature, fnIf, fnElse) {
        return (...args) => {
            if (this.isEnabled(feature) && Util.isFunction(fnIf)) {
                return fnIf.apply({}, args);
            }
            else if (this.isDisabled(feature) && Util.isFunction(fnElse)) {
                return fnElse.apply({}, args);
            }
            else {
                return undefined;
            }
        };
    }

    /**
     * Determines if any of the specified features are enabled.
     *
     * @param {string[]} features the feature names to check
     * @returns {boolean} true, if any features are enabled; false otherwise
     */
    isAnyEnabled(features=[]) {
        return features.map(feature => this.isEnabled(feature)).some(value => !!value);
    }

    /**
     * Determines if all of the specified features are enabled.
     *
     * @param {string[]} features the feature names to check
     * @returns {boolean} true, if all features are enabled; false otherwise
     */
    isAllEnabled(features=[]) {
        return features.map(feature => this.isEnabled(feature)).every(value => !!value);
    }

    /**
     * Determines if any of the specified features are disabled.
     *
     * @param {string[]} features the feature names to check
     * @returns {boolean} true, if any features are disabled; false otherwise
     */
    isAnyDisabled(features=[]) {
        return features.map(feature => this.isEnabled(feature)).some(value => !value);
    }

    /**
     * Determines if all of the specified features are disabled.
     *
     * @param {string[]} features the feature names to check
     * @returns {boolean} true, if all features are disabled; false otherwise
     */
    isAllDisabled(features=[]) {
        return features.map(feature => this.isEnabled(feature)).every(value => !value);
    }

    /**
     * Adds a change listener. The listener will be invoked every time the features change.
     *
     * The listener callback takes the following parameters:
     *  features:Object the features, at the time the listener was invoked
     *  name:string     the name of the feature that changed
     *  value:string    the new value of the feature
     *
     * @param {Function} listener the listener function (features:Object, name:string, value:string)
     * @returns {Function} a function which, when invoked, will unregister the listener
     */
    addChangeListener(listener) {
        this.listeners.push(listener);
        return () => {
            // Find the index
            const index = this.listeners.findIndex(l => l === listener);
            if (-1 !== index) {
                this.listeners.splice(index, 1);
            }
        };
    }

}
