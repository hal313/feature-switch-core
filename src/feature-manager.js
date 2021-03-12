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
    Object.keys(strictFeatures).forEach(name => strictFeatures[name] = Util.isTrue(fn(strictFeatures[name])));
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
 * @param {string} name the name of the feature to
 * @param {boolean} value the new value (will be normalized using Util.isTrue)
 * @param {object} features the features
 * @param {objet[]} [listeners] a list of listeners
 * @param {function} [onError] the error function (when listener execution fails)
 */
const fireEvent = (name, value, features, listeners, onError) => {
    const featureSnapshot = clone(features);

    listeners.forEach(listener => {
        // Async execution for speed and also to avoid errors when a callback throws
        setTimeout(() => {
            try {
                if (Util.isFunction(listener)) {
                    listener.apply({}, [featureSnapshot, name, value]);
                }
            } catch (error) {
                if (Util.isFunction(onError)) {
                    onError.apply({}, [error, listener, name, value, featureSnapshot]);
                } else {
                    console.warn('listener threw an exception', error);
                }
            }
        });
    });
};

/**
 *
 * @param {string} name the name of the feature to
 * @param {boolean} value the new value (will be normalized using Util.isTrue)
 * @param {object} features the features
 * @param {objet[]} [listeners] a list of listeners
 * @param {function} [onError] the error function (when listener execution fails)
 */
const setAndFireEvent = (name, value, features, listeners, onError) => {
    if (Util.isUndefined(value)) {
        delete features[name];
    } else {
        features[name] = Util.isTrue(value);
    }
    fireEvent(name, value, features, listeners, onError);
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
     * @param {string} name the feature name
     * @param {boolean} value the feature value
     */
    addFeature(name, value) {
        if (this.canAddFeatures()) {
            // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
            const newValue = normalizeContextTrue(value,  this.context);
            setAndFireEvent(name, newValue, this.features, this.listeners, this.context.onListenerError);
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
     * @param {string} name the feature name to remove
     * @returns {boolean} true, if feaures was removed; false otherwise
     */
    removeFeature(name) {
        if (this.hasFeature(name) && this.canRemoveFeatures()) {
            setAndFireEvent(name, undefined, this.features, this.listeners, this.context.onListenerError);
            return true;
        }
        return false;
    }

    /**
     * Determines if a feature exists.
     *
     * @param {string} name the feature name
     * @returns {boolean} returns true if the feature exists; false otherwise
     */
    hasFeature(name) {
        return Util.isDefined(this.features[name]);
    }

    /**
     * Determines if a feature is enabled.
     *
     * @param {string} the feature name
     * @returns {boolean} true, if the feature is enabled; false otherwise
     */
    isEnabled(name) {
        return this.hasFeature(name) ? this.context.isEnabled(name, clone(this.features)) : false;
    }

    /**
     * Determines if a feature is disbled.
     *
     * @param {string} the feature name
     * @returns {boolean} true, if the feature is disabled; false otherwise
     */
    isDisabled(name) {
        // This is tricky; cannot return false if the feature is unknown because that would mean that
        //   isDisabled(unknown) === isEnabled(unknown) === false
        // And the world would explode
        return !this.isEnabled(name);
    }

    /**
     * Determines if a feature can be set.
     *
     * @param {string} name the name of the feature to set
     * @param {boolean} value the value of the feature to be set
     */
    canSetFeature(name, value) {
        // Pass the raw value to the context
        return this.hasFeature(name) ? this.context.canSet(name, value) : false;
    }

    /**
     * Sets a feature
     *
     * @param {string} name the name of the feature to set
     * @param {boolean} value the value of the feature to be set
     * @returns {boolean} true, if feaures can be enabled; false otherwise
     */
    setEnabled(name, value) {
        // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
        const normalizedValue = normalizeContextTrue(value, this.context);
        if (this.hasFeature(name) && this.canSetFeature(name, normalizedValue)) {
            setAndFireEvent(name, normalizedValue, this.features, this.listeners, this.context.onListenerError);
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
     * @param {string} name the feature name
     * @param {Function} fn the function to execute, if the feature is enabled
     * @param {[]} [args] the arguments for the function
     * @returns {any} the return value of the executed function
     */
    ifEnabled(name, fn, args) {
        if(this.isEnabled(name)) {
            return this.context.execute(fn, args);
        }
    }

    /**
     * Executes a function if a specified feature is disabled.
     *
     * @param {string} name the feature name
     * @param {Function} fn the function to execute, if the feature is disabled
     * @param {[]} [args] the arguments for the function
     * @returns {any} the return value of the executed function
     */
    ifDisabled(name, fn, args) {
        if (this.hasFeature(name) && this.isDisabled(name)) {
            return this.context.execute(fn, args);
        }
    }

    /**
     * Executes one of two functions, based on if the specified feature is enabled.
     *
     * @param {string} name the name of the feature
     * @param {Function} enabledFn the function to execute if the feature is enabled
     * @param {Function} disabledFn the function to execute if the feature is disabled
     * @param {[]} [enabledArgs] arguments for the <i>enabledFn</i>
     * @param {[]} [disabledArgs] arguments for the <i>disabledFn</i>
     * @returns {any} the return value of the executed function
     */
    decide(name, enabledFn, disabledFn, enabledArgs, disabledArgs) {
        this.ifEnabled(name, enabledFn, enabledArgs);
        this.ifDisabled(name, disabledFn, disabledArgs);
    }

    /**
     * Determines if a feature can be enabled.
     *
     * @param {string} name the feature name
     * @returns {boolean} true, if the feature can be enabled; false otherwise
     */
    canEnable(name) {
        return this.canSetFeature(name, true);
    }

    /**
     * Determines if a feature can be disabled.
     *
     * @param {string} name the feature name
     * @returns {boolean} true, if the feature can be disbled; false otherwise
     */
    canDisable(name) {
        return this.canSetFeature(name, false);
    }

    /**
     * Enables a feature.
     *
     * @param {string} name the name of the feature to enable
     * @returns {boolean} true, if the feature was enabled; false otherwise
     */
    enable(name) {
        if (this.canEnable(name)) {
            this.setEnabled(name, true);
            return true;
        }
        return false;
    }

    /**
     * Disables a feature.
     *
     * @param {string} name the name of the feature to disable
     * @returns {boolean} true, if the feature was disabled; false otherwise
     */
    disable(name) {
        if (this.canDisable(name)) {
            this.setEnabled(name, false);
            return true;
        }
        return false;
    }

    /**
     * Determines if a feature can be toggled.
     *
     * @param {string} name the name of the feature to toggle.
     * @returns {boolean} true, if the feature can be toggled; false otherwise
     */
    canToggle(name) {
        return this.isEnabled(name) ? this.canDisable(name) : this.canEnable(name);
    }


    /**
     * Toggles a feature. If the feature is enabled, then the feature will be disabled. If
     * the feature is disabled, it will be enabled.
     *
     * @param {string} name the feature to toggle.
     * @returns {boolean} true, if the feature can be toggled; false otherwise
     */
    toggle(name) {
        if (this.canToggle(name)) {
            this.isEnabled(name) ? this.disable(name) : this.enable(name); // jshint ignore:line
            return true;
        }
        return false;
    }

    /**
     * Determines if any of the specified features are enabled.
     *
     * @param {string[]} names the feature names to check
     * @returns {boolean} true, if any features are enabled; false otherwise
     */
    isAnyEnabled(names=[]) {
        return names.map(feature => this.isEnabled(feature)).some(value => !!value);
    }

    /**
     * Determines if all of the specified features are enabled.
     *
     * @param {string[]} names the feature names to check
     * @returns {boolean} true, if all features are enabled; false otherwise
     */
    isAllEnabled(names=[]) {
        return names.map(feature => this.isEnabled(feature)).every(value => !!value);
    }

    /**
     * Determines if any of the specified features are disabled.
     *
     * @param {string[]} names the feature names to check
     * @returns {boolean} true, if any features are disabled; false otherwise
     */
    isAnyDisabled(names=[]) {
        return names.map(feature => this.isEnabled(feature)).some(value => !value);
    }

    /**
     * Determines if all of the specified features are disabled.
     *
     * @param {string[]} names the feature names to check
     * @returns {boolean} true, if all features are disabled; false otherwise
     */
    isAllDisabled(names=[]) {
        return names.map(feature => this.isEnabled(feature)).every(value => !value);
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
