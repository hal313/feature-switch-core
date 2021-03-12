// TODO: Comment code

import * as Context from './context.js';
import * as Util from './util.js' ;

export const isFeatures = features => !!features && !Array.isArray(features) && 'object' === typeof features;

export const isFeaturesStrict = features => isFeatures(features) && Object.values(features).every(Util.isBoolean);

const castAsFeatures = (features, deciderFn) => {
    const strictFeatures = Util.isObjectStrict(features) ? features : {};
    const fn = Util.isFunction(deciderFn) ? deciderFn : Util.isTrue;
    Object.keys(strictFeatures).forEach(name => strictFeatures[name] = Util.isTrue(fn(strictFeatures[name])));
    return strictFeatures;
};

export const asFeatures = features => {
    return castAsFeatures(features, Util.isTrue);
};

const clone = source => {
    return JSON.parse(JSON.stringify(source));
};

const pluckValues = (names, features, context) => {
    const namesToPluck = Util.isArray(names) ? names : [];
    return namesToPluck.map(name => Util.isTrue(context.isEnabled(name, clone(features)), features));
};


/**
 * Fires events to the listeners.
 *
 * @param {string} name the name of the feature to
 * @param {boolean} value the new value (will be normalized using Util.isTrue)
 * @param {object} features the features to modify
 * @param {objet[]} [listeners] a list of listeners
 * @param {function} [onError] the error function (when listener execution fails)
 */
const fireEvent = (name, value, features, listeners, onError) => {
    const featureSnapshot = clone(features);

    listeners.forEach(listener => {
        // Async
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
 * @param {object} features the features to modify
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
 * @param {*} value the value to make as a boolean
 * @param {Object} context the context to use to check for truthiness
 * @returns {Boolean} true if the context indicates that the value is true; false otherwise
 */
const normalizeContextTrue = (value, context) => {
    return Util.isTrue(context.isTrue(value));
};

export class FeatureManager {

    constructor(features, context) {
        // The listeners
        this.listeners = [];

        // This approach will use the context.isTrue for the initial normalization
        this.features = castAsFeatures(clone(features), context && context.isTrue);
        this.context = Context.createContext(this.features, context);
    }

    canAddFeatures() {
        return this.context.canAddFeatures();
    }

    addFeature(name, value) {
        if (this.canAddFeatures()) {
            // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
            const newValue = normalizeContextTrue(value,  this.context);
            setAndFireEvent(name, newValue, this.features, this.listeners, this.context.onListenerError);
        }
    }

    canRemoveFeatures() {
        return this.context.canRemoveFeatures();
    }

    removeFeature(name) {
        if (this.hasFeature(name) && this.canRemoveFeatures()) {
            setAndFireEvent(name, undefined, this.features, this.listeners, this.context.onListenerError);
        }
    }

    hasFeature(name) {
        return Util.isDefined(this.features[name]);
    }

    isEnabled(name) {
        return this.hasFeature(name) ? this.context.isEnabled(name, clone(this.features)) : false;
    }

    isDisabled(name) {
        // This is tricky; cannot return false if the feature is unknown because that would mean that
        //   isDisabled(unknown) === isEnabled(unknown) === false
        // And the world would explode
        return !this.isEnabled(name);
    }

    canSetFeature(name, value) {
        // Pass the raw value to the context
        return this.hasFeature(name) ? this.context.canSet(name, value) : false;
    }

    setEnabled(name, value) {
        // Use the context version of isTrue (which may support things such as 'yes', 1 or 'enabled')
        const normalizedValue = normalizeContextTrue(value, this.context);
        if (this.hasFeature(name) && this.canSetFeature(name, normalizedValue)) {
            setAndFireEvent(name, normalizedValue, this.features, this.listeners, this.context.onListenerError);
        }
    }

    getFeatures() {
        // Return a clone of the features
        return clone(this.features);
    }

    ifEnabled(name, fn, args) {
        if(this.isEnabled(name)) {
            return this.context.execute(fn, args);
        }
    }

    ifDisabled(name, fn, args) {
        if (this.hasFeature(name) && this.isDisabled(name)) {
            return this.context.execute(fn, args);
        }
    }

    decide(name, enabledFn, disabledFn, enabledArgs, disabledArgs) {
        this.ifEnabled(name, enabledFn, enabledArgs);
        this.ifDisabled(name, disabledFn, disabledArgs);
    }

    canEnable(name) {
        return this.canSetFeature(name, true);
    }

    canDisable(name) {
        return this.canSetFeature(name, false);
    }

    enable(name) {
        if (this.canEnable(name)) {
            this.setEnabled(name, true);
        }
    }

    disable(name) {
        if (this.canDisable(name)) {
            this.setEnabled(name, false);
        }
    }

    canToggle(name) {
        return this.isEnabled(name) ? this.canDisable(name) : this.canEnable(name);
    }


    toggle(name) {
        if (this.canToggle(name)) {
            this.isEnabled(name) ? this.disable(name) : this.enable(name); // jshint ignore:line
        }
    }

    isAnyEnabled(names) {
        return pluckValues(names, this.features, this.context).some(value => !!value);
    }

    isAllEnabled(names) {
        return pluckValues(names, this.features, this.context).every(value => !!value);
    }

    isAnyDisabled(names) {
        return pluckValues(names, this.features, this.context).some(value => !value);
    }
    isAllDisabled(names) {
        return pluckValues(names, this.features, this.context).every(value => !value);
    }

    /**
     *
     * @param {Function} listener
     * @returns
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
