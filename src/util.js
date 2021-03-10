export const isTrue = value => true === value || 'true' === (value + '').toLowerCase();
export const isFalse = value => false === value || 'false' === (value + '').toLowerCase();
export const isBoolean = value => isTrue(value) || isFalse(value);
export const isUndefined = value => undefined === value;
export const isNull = value => null === value;
export const isNil = value => isUndefined(value) || isNull(value);
export const isDefined = value => !isNil(value);
export const isArray = Array.isArray;
export const isObject = value => isDefined(value) && 'object' === typeof value;
export const isObjectStrict = value => isObject(value) && !isArray(value);
export const isFunction = value => 'function' === typeof value;

export const mergeDeep = (target, ...sources) => {
    // https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
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
