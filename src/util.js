/**
 * Determines if a value is true.
 *
 * @param {any} value the value to evaluate.
 * @returns {boolean} true, if <i>value</i> should be considered true; false otherwise
 */
export const isTrue = value => true === value || 'true' === (value + '').toLowerCase();

/**
 * Determines if a value is false.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is false
 */
export const isFalse = value => false === value || 'false' === (value + '').toLowerCase();

/**
 * Determines if a value is a boolean.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is a boolean
 */
export const isBoolean = value => isTrue(value) || isFalse(value);

/**
 * Determines if a value is undefined.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is undefined
 */
export const isUndefined = value => undefined === value;

/**
 * Determines if a value is null.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is null
 */
export const isNull = value => null === value;

/**
 * Determines if a value is either null or undefined.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is either null or undefined
 */
export const isNil = value => isUndefined(value) || isNull(value);

/**
 * Determines if a value is defined (not null and not undefined).
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is not null and not undefined
 */
export const isDefined = value => !isNil(value);

/**
 * Determines if a value is an array.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is an array
 */
export const isArray = Array.isArray;

/**
 * Determines if a value is an object. Includes arrays.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is an object or array
 */
export const isObject = value => isDefined(value) && 'object' === typeof value;

/**
 * Determines if a value is an object strictly (that is, not an array).
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is an object and also not an array
 */
export const isObjectStrict = value => isObject(value) && !isArray(value);

/**
 * Determines if a value is a function.
 *
 * @param {any} value the value to evaluate
 * @returns {boolean} true, if <i>value</i> is a function
 */
export const isFunction = value => 'function' === typeof value;

/**
 * Merges objets recursively. Precedence goes from left to right with the source object at the left taking
 * the least precedence (meaning that source objects to the right can overwrite values).
 *
 * @param {Object} target the object to write values to
 * @param  {...any} sources the sources, read from left to right, with the right-most source taking precedence
 * @returns {Object} returns <i>target</i>
 */
export const mergeDeep = (target, ...sources) => {
    // Shamelessly copied from:
    //   https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, {
                        [key]: {}
                    });
                }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            }
        }
    }

    return mergeDeep(target, ...sources);
};
