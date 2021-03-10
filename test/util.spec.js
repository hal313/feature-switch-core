import * as Util from '../src/util';

describe('Util', () => {

    describe('isTrue', () => {

        test('should return true for boolean true values', () => {
            expect(Util.isTrue(true)).toBe(true);
        });

        test('should return true for string true values', () => {
            expect(Util.isTrue('true')).toBe(true);
            expect(Util.isTrue('TRUE')).toBe(true);
        });

        test('should return false for boolean false values', () => {
            expect(Util.isTrue(false)).toBe(false);
        });

        test('should return false for string false values', () => {
            expect(Util.isTrue('false')).toBe(false);
            expect(Util.isTrue('FALSE')).toBe(false);
        });

        test('should return false for number values', () => {
            expect(Util.isTrue(123)).toBe(false);
        });

        test('should return false for object values', () => {
            expect(Util.isTrue({})).toBe(false);
        });

        test('should return false for function values', () => {
            expect(Util.isTrue(() => {})).toBe(false);
        });

    });

    describe('isFalse', () => {

        test('should return true for boolean false values', () => {
            expect(Util.isFalse(false)).toBe(true);
        });

        test('should return true for string false values', () => {
            expect(Util.isFalse('false')).toBe(true);
            expect(Util.isFalse('FALSE')).toBe(true);
        });

        test('should return false for boolean true values', () => {
            expect(Util.isFalse(true)).toBe(false);
        });

        test('should return false for string true values', () => {
            expect(Util.isFalse('true')).toBe(false);
            expect(Util.isFalse('TRUE')).toBe(false);
        });

        test('should return false for number values', () => {
            expect(Util.isFalse(123)).toBe(false);
        });

        test('should return false for object values', () => {
            expect(Util.isFalse({})).toBe(false);
        });

        test('should return false for function values', () => {
            expect(Util.isFalse(() => {})).toBe(false);
        });

    });

    describe('isBoolean', () => {

        [true, false, 'true', 'false', 'TRUE', 'FALSE'].forEach(value => {
            test(`should return true when "${value}" (${typeof value}) is a boolean`, () => {
                expect(Util.isBoolean(value)).toBe(true);
            });
        });

    });

    describe('isUndefined', () => {

        test('should be true when the value is undefined', () => {
            expect(Util.isUndefined(undefined)).toBe(true);
        });

        [null, '', {}, 123, [], true, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isUndefined(value)).toBe(false);
            });
        });

    });

    describe('isNull', () => {

        test('should be true when the value is null', () => {
            expect(Util.isNull(null)).toBe(true);
        });

        [undefined, '', {}, 123, [], true, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isNull(value)).toBe(false);
            });
        });

    });

    describe('isNil', () => {

        test('should be true when the value is null or undefined', () => {
            expect(Util.isNil(undefined)).toBe(true);
            expect(Util.isNil(null)).toBe(true);
        });

        ['', {}, 123, [], true, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isNil(value)).toBe(false);
            });
        });

    });

    describe('isDefined', () => {

        ['', {}, 123, [], true, 'string value'].forEach(value => {
            test(`should be true when the value is ${value} (${typeof value})`, () => {
                expect(Util.isDefined(value)).toBe(true);
            });
        });

        test('should be false when the value is null or undefined', () => {
            expect(Util.isDefined(undefined)).toBe(false);
            expect(Util.isDefined(null)).toBe(false);
        });

    });

    describe('isArray', () => {

        test('should be true when the value is null or undefined', () => {
            expect(Util.isArray([])).toBe(true);
            expect(Util.isArray([1, 'two', {}])).toBe(true);
        });

        ['', {}, 123, true, false, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isArray(value)).toBe(false);
            });
        });

    });

    describe('isObject', () => {

        test('should be true when the value is null or undefined', () => {
            expect(Util.isObject({})).toBe(true);
        });

        ['', 123, true, false, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isObject(value)).toBe(false);
            });
        });

    });

    describe('isObjectStrict', () => {

        test('should be true when the value is null or undefined', () => {
            expect(Util.isObjectStrict({})).toBe(true);
        });

        ['', 123, [], () => {}, true, false, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isObjectStrict(value)).toBe(false);
            });
        });

    });

    describe('isFunction', () => {

        test('should be true when the value is a function', () => {
            expect(Util.isFunction(() => {})).toBe(true);
        });

        ['', 123, {}, [], true, false, 'string value'].forEach(value => {
            test(`should be false when the value is ${value} (${typeof value})`, () => {
                expect(Util.isFunction(value)).toBe(false);
            });
        });

    });

});
