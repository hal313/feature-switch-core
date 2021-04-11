import * as FeatureManager from '../src/feature-manager';

const clone = source => JSON.parse(JSON.stringify(source));

describe('FeatureManager', () => {

    const nonFeatures = [undefined, null, true, false, 12345, 'some string', []];



    describe('isFeaturesStrict', () => {

        const strictFeature = {
            booleanFeatureOne: true,
            booleanFeatureTwo: false
        };

        const nonStrictFeature = {
            booleanFeature: true,
            stringFeature: 'someString'
        };

        test('should return true when the value is strictly a feature object', () => {
            expect(FeatureManager.isFeatures({})).toBe(true);

            expect(FeatureManager.isFeatures(strictFeature)).toBe(true);
        });

        nonFeatures.concat(nonStrictFeature).forEach(type => {
            test(`should return false when the value (${type}: ${typeof type}) is not strictly a feature object`, () => {
                expect(FeatureManager.isFeatures(type)).toBe(false);
            });
        });

    });

    describe('asFeatures', () => {

        [undefined, null, 123, [], 'some string'].forEach(value => {
            test(`should return an empty object when ${value} (${typeof value}) is passed in`, () => {
                const strictFeatures = FeatureManager.asFeatures(value);
                expect(strictFeatures).toEqual({});
                expect(FeatureManager.isFeatures(strictFeatures)).toBe(true);
            });
        });

        test('should normalize an object to be strict features', () => {
            const nonStrictFeature = {
                booleanTrue: true,
                booleanFalse: false,
                stringTrue: 'true',
                stringFalse: 'false',
                numberFeature: 123,
                arrayFeature: [],
                nullFeature: null,
                undefinedFeature: undefined
            };
            const expectedStrictFeature = {
                booleanTrue: true,
                booleanFalse: false,
                stringTrue: true,
                stringFalse: false,
                numberFeature: false,
                arrayFeature: false,
                nullFeature: false,
                undefinedFeature: false
            };

            const strictFeatures = FeatureManager.asFeatures(nonStrictFeature);
            expect(strictFeatures).toEqual(expectedStrictFeature);
            expect(FeatureManager.isFeatures(strictFeatures)).toEqual(true);
        });

    });

    describe('Constructor', () => {
        const features = {featureOne: true};

        test('the constructor should use the features', () => {
            const featureManager = new FeatureManager.FeatureManager(features);
            expect(featureManager.features).toEqual(features);
        });

        test('the constructor should normalize the features', () => {
            const featureManager = new FeatureManager.FeatureManager({featureOne: 'true'});
            expect(featureManager.isEnabled('featureOne')).toBe(true);
        });

        test('the constructor should normalize the features using a custom context', () => {
            const featureManager = new FeatureManager.FeatureManager({featureOne: false}, {isTrue: () => true});
            expect(featureManager.isEnabled('featureOne')).toBe(true);
        });

        test('the constructor should clone the features', () => {
            const featureManager = new FeatureManager.FeatureManager(features);
            expect(featureManager.features).not.toBe(features);
        });

    });

    describe('API', () => {
        const unknownFeature = 'unknownFeature';
        const feature = 'booleanFeature';
        const originalFeatureValue = true;
        const features = {};
        features[feature] = originalFeatureValue;

        describe('canAddFeatures', () => {

            test('the default value should return true', () => {
                // Default value
                expect(new FeatureManager.FeatureManager(features, {}).canAddFeatures()).toBe(true);
            });

            test('a custom context should handle the ability to add features', () => {
                const expectedValue = 'someExpectedValue';

                // Custom value
                expect(new FeatureManager.FeatureManager(features, {canAddFeatures: () => expectedValue}).canAddFeatures()).toBe(expectedValue);
            });

        });

        describe('addFeature', () => {
            const newFeature = 'booleanFeatureTwo';

            test('the default context should allow a feature to be added', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.addFeature(newFeature, true);
                expect(featureManager.isEnabled(newFeature)).toBe(true);
            });

            test('a custom context should handle adding features', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {isTrue: () => true});
                featureManager.addFeature(newFeature, true);
                expect(featureManager.isEnabled(newFeature)).toBe(true);

                featureManager = new FeatureManager.FeatureManager(features, {isTrue: () => false});
                featureManager.addFeature(newFeature, true);
                expect(featureManager.hasFeature(newFeature)).toBe(true);
                expect(featureManager.isEnabled(newFeature)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canAddFeatures: () => false});
                featureManager.addFeature(newFeature, true);
                expect(featureManager.hasFeature(newFeature)).toBe(false);
            });

        });

        describe('canRemoveFeatures', () => {

            test('the default context should allow a feature to be removed', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.canRemoveFeatures()).toBe(true);
            });

            test('a custom context should handle the ability to remove features', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => true});
                expect(featureManager.canRemoveFeatures()).toBe(true);

                featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => false});
                expect(featureManager.canRemoveFeatures()).toBe(false);
            });

        });

        describe('removeFeature', () => {

            test('the default context should remove a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.removeFeature(feature);
                expect(featureManager.hasFeature(feature)).toBe(false);
            });

            test('a custom context should handle removing features', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => true});
                featureManager.removeFeature(feature);
                expect(featureManager.hasFeature(feature)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => false});
                featureManager.removeFeature(feature);
                expect(featureManager.hasFeature(feature)).toBe(true);
            });

        });

        describe('hasFeature', () => {

            test('should return true when the feature exists', () => {
                expect(new FeatureManager.FeatureManager(features).hasFeature(feature)).toBe(true);
            });

            test('should return true when the feature does not exist', () => {
                expect(new FeatureManager.FeatureManager(features).hasFeature(unknownFeature)).toBe(false);
            });

        });

        describe('isEnabled', () => {

            test('the default context should return the correct value', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.isEnabled(feature)).toBe(originalFeatureValue);

                featureManager.setEnabled(feature, !originalFeatureValue);
                expect(featureManager.isEnabled(feature)).toBe(!originalFeatureValue);
            });

            test('a custom context should handle the value', () => {
                // This feature manager will return the opposite of the actual value
                const featureManager = new FeatureManager.FeatureManager(features, {isEnabled: () => !originalFeatureValue});
                expect(featureManager.isEnabled(feature)).toBe(!originalFeatureValue);
            });

        });

        describe('isDisabled', () => {

            test('the default context should return the correct value', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.isDisabled(feature)).toBe(!originalFeatureValue);

                featureManager.setEnabled(feature, !originalFeatureValue);
                expect(featureManager.isDisabled(feature)).toBe(originalFeatureValue);
            });

            test('a custom context should handle the value', () => {
                // This feature manager will return the opposite of the actual value
                const featureManager = new FeatureManager.FeatureManager(features, {isEnabled: () => !originalFeatureValue});
                expect(featureManager.isDisabled(feature)).toBe(originalFeatureValue);
            });

        });

        describe('canSetFeature', () => {

            test('the default context should return true if the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.canSetFeature(feature)).toBe(true);
                expect(featureManager.canSetFeature(unknownFeature)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});
                expect(featureManager.canSetFeature(feature)).toBe(true);
                expect(featureManager.canSetFeature(unknownFeature)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                expect(featureManager.canSetFeature(feature)).toBe(false);
                expect(featureManager.canSetFeature(unknownFeature)).toBe(false);
            });

        });

        describe('setEnabled', () => {

            test('the default context should set the feature when the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(feature, !originalFeatureValue);
                // The feature should be set to false
                expect(featureManager.isEnabled(feature)).toBe(!originalFeatureValue);
            });

            test('the default context should not set the feature when the feature is not known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(unknownFeature, true);
                expect(featureManager.isEnabled(unknownFeature)).toBe(false);
            });

            test('a custom context should handle setting the value', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Toggle the feature value
                featureManager.setEnabled(feature, !originalFeatureValue);
                // The feature can not be set and should have the original value
                expect(featureManager.isEnabled(feature)).toBe(originalFeatureValue);

                featureManager.setEnabled(unknownFeature, true);
                expect(featureManager.isEnabled(unknownFeature)).toBe(false);
            });

        });

        describe('getFeatures', () => {

            test('the default context should return a copy of the features', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.getFeatures()).toEqual(features);
                expect(featureManager.getFeatures()).not.toBe(features);
            });

        });

        describe('ifEnabled', () => {

            test('the default context should execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifEnabled(feature, fn, args);
                expect(fn.mock.calls.length).toBe(1);
                expect(fn.mock.calls[0][0]).toBe(args[0]);
                expect(fn.mock.calls[0][1]).toBe(args[1]);
            });

            test('the default context should not execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(feature, !originalFeatureValue);
                featureManager.ifEnabled(feature, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('the default context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifEnabled(unknownFeature, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('a custom context should execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifEnabled(feature, fn, args);
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(fn);
                expect(contextExecute.mock.calls[0][1]).toBe(args);
            });

            test('a custom context should not execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(feature, false);
                featureManager.ifEnabled(feature, fn, args);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

            test('a custom context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifEnabled(unknownFeature, fn);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

        });

        describe('ifDisabled', () => {

            test('the default context should execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(feature, false);
                featureManager.ifDisabled(feature, fn, args);
                expect(fn.mock.calls.length).toBe(1);
                expect(fn.mock.calls[0][0]).toBe(args[0]);
                expect(fn.mock.calls[0][1]).toBe(args[1]);
            });

            test('the default context should not execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifDisabled(feature, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('the default context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifDisabled(unknownFeature, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('a custom context should execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(feature, false);
                featureManager.ifDisabled(feature, fn, args);
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(fn);
                expect(contextExecute.mock.calls[0][1]).toBe(args);
            });

            test('a custom context should not execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(feature, true);
                featureManager.ifDisabled(feature, fn, args);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

            test('a custom context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifDisabled(unknownFeature, fn);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

        });

        describe('decide', () => {

            const enabledArgs = ['enabledOne', 'enabledTwo'];
            const disabledArgs = ['disabledOne', 'disabledTwo'];

            test('the default context should run the enabled function and not the disabled function when the feature is enabled', () => {
                const enabledFn = jest.fn(() => 'enabled');
                const disabledFn = jest.fn(() => 'disabled');

                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(feature, true);
                const result = featureManager.decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs);
                expect(result).toEqual('enabled');
                expect(enabledFn.mock.calls.length).toBe(1);
                expect(enabledFn.mock.calls[0][0]).toBe(enabledArgs[0]);
                expect(enabledFn.mock.calls[0][1]).toBe(enabledArgs[1]);
                // Make sure the disabled function was not executed
                expect(disabledFn.mock.calls.length).toBe(0);
            });

            test('the default context should run the disabled function and not the enabled function when the feature is disabled', () => {
                const enabledFn = jest.fn(() => 'enabled');
                const disabledFn = jest.fn(() => 'disabled');

                const featureManager = new FeatureManager.FeatureManager(features);
                // Set the feature to be disabled
                featureManager.setEnabled(feature, false);
                const result = featureManager.decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs);
                expect(result).toEqual('disabled');
                // The enabled function should not have been executed again
                expect(enabledFn.mock.calls.length).toBe(0);
                // Make sure the disabled function was not executed
                expect(disabledFn.mock.calls.length).toBe(1);
                expect(disabledFn.mock.calls[0][0]).toBe(disabledArgs[0]);
                expect(disabledFn.mock.calls[0][1]).toBe(disabledArgs[1]);
            });

            test('a custom context should run the enabled function and not the disabled function when the feature is enabled', () => {
                const enabledFn = jest.fn();
                const disabledFn = jest.fn();
                const contextExecute = jest.fn();

                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(feature, true);
                featureManager.decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs);

                // Make sure the disabled function was not executed
                expect(disabledFn.mock.calls.length).toBe(0);
                // Check that the execute function was invoked with the enabled function only
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(enabledFn);
                expect(contextExecute.mock.calls[0][1]).toBe(enabledArgs);
            });

            test('a custom context should run the disabled function and not the enabled function when the feature is enabled', () => {
                const enabledFn = jest.fn();
                const disabledFn = jest.fn();
                const contextExecute = jest.fn();

                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(feature, false);
                featureManager.decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs);

                // Make sure the enabled function was not executed
                expect(enabledFn.mock.calls.length).toBe(0);
                // Check that the execute function was invoked with the disabled function only
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(disabledFn);
                expect(contextExecute.mock.calls[0][1]).toBe(disabledArgs);
            });

        });

        describe('canEnable', () => {

            test('the default context should return true if the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canEnable(feature)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canEnable(feature)).toBe(true);

                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeature)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canEnable(feature)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canEnable(feature)).toBe(true);
                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeature)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                // Should not be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canEnable(feature)).toBe(false);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canEnable(feature)).toBe(false);

                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeature)).toBe(false);
            });

        });

        describe('canDisable', () => {

            test('the default context should return true if the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canDisable(feature)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canDisable(feature)).toBe(true);

                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeature)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canDisable(feature)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canDisable(feature)).toBe(true);
                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeature)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                // Should not be able to set enabled when the feature is true
                featureManager.setEnabled(feature, true);
                expect(featureManager.canDisable(feature)).toBe(false);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(feature, false);
                expect(featureManager.canDisable(feature)).toBe(false);

                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeature)).toBe(false);
            });

        });

        describe('enable', () => {

            test('the default context should enable a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Make sure the feature is disabled
                featureManager.setEnabled(feature, false);
                expect(featureManager.isEnabled(feature)).toBe(false);

                // Enable the feature and check the state
                featureManager.enable(feature);
                expect(featureManager.isEnabled(feature)).toBe(true);
            });

        });

        describe('disable', () => {

            test('the default context should disable a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Make sure the feature is enabled
                featureManager.setEnabled(feature, true);
                expect(featureManager.isEnabled(feature)).toBe(true);

                // Disable the feature and check the state
                featureManager.disable(feature);
                expect(featureManager.isEnabled(feature)).toBe(false);
            });

        });

        describe('canToggle', () => {

            test('the default context should be able to toggle a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Check that the toggle works one way
                expect(featureManager.canToggle(feature)).toBe(true);
                // And check the other way
                featureManager.setEnabled(featureManager, !originalFeatureValue);
                expect(featureManager.canToggle(feature)).toBe(true);
            });

            test('a custom context should handle allowing toggle', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Check that the toggle works one way
                expect(featureManager.canToggle(feature)).toBe(false);
            });

        });

        describe('toggle', () => {

            test('the default context should toggle a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Check that the toggle works one way
                let beforeValue = featureManager.isEnabled(feature);
                featureManager.toggle(feature);
                expect(featureManager.isEnabled(feature)).toBe(!beforeValue);
                // And check the other way
                featureManager.toggle(feature);
                expect(featureManager.isEnabled(feature)).toBe(beforeValue);
            });

            test('a custom context should handle allowing toggle', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Check that the toggle does not work
                let beforeValue = featureManager.isEnabled(feature);
                featureManager.toggle(feature);
                expect(featureManager.isEnabled(feature)).toBe(beforeValue);
            });

        });

        describe('ifFunction', () => {

            test('should create a function which executes only when the feature is enabled', () => {
                // Create the feature manager and enable a feature
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.enable(feature);

                // Create a function (underlying implementation is a mock)
                const fnMock = jest.fn();
                const fn = featureManager.ifFunction(feature, fnMock);

                // The parameters to pass to the function
                const args = ['a', true, 3];
                fn(...args);
                //
                // The mock function was called once and with the correct parameters
                expect(fnMock).toHaveBeenCalledTimes(1);
                expect(fnMock).toHaveBeenCalledWith(...args);

                // Disable the feature
                featureManager.disable(feature);
                // Invoke the function again
                fn(...args);
                // The mock should not have been called
                expect(fnMock).toHaveBeenCalledTimes(1);
            });

        });

        describe('elseFunction', () => {

            test('should create a function which executes only when the feature is disabled', () => {
                // Create the feature manager and disable a feature
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.disable(feature);

                // Create a function (underlying implementation is a mock)
                const fnMock = jest.fn();
                const fn = featureManager.elseFunction(feature, fnMock);

                // The parameters to pass to the function
                const args = ['a', true, 3];
                fn(...args);
                //
                // The mock function was called once and with the correct parameters
                expect(fnMock).toHaveBeenCalledTimes(1);
                expect(fnMock).toHaveBeenCalledWith(...args);

                // Enable the feature
                featureManager.enable(feature);
                // Invoke the function again
                fn(...args);
                // The mock should not have been called again
                expect(fnMock).toHaveBeenCalledTimes(1);
            });

        });

        describe('ifElseFunction', () => {

            test('should create a function which executes one function when the feature is enabled and a different function when the feature is disabled', () => {
                // Create the feature manager and disable a feature
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.enable(feature);

                // Create a function (underlying implementation is a mock)
                const ifFnMock = jest.fn();
                const elseFnMock = jest.fn();
                const fn = featureManager.ifElseFunction(feature, ifFnMock, elseFnMock);

                // The parameters to pass to the function
                const args = ['a', true, 3];
                fn(...args);
                //
                // The if-mock should have been called once, with the correct parameters
                expect(ifFnMock).toHaveBeenCalledTimes(1);
                expect(ifFnMock).toHaveBeenCalledWith(...args);
                // The else-mock should not have been called
                expect(elseFnMock).not.toHaveBeenCalled();

                // Disable the feature
                featureManager.disable(feature);
                // Invoke the function again
                fn(...args);
                // The if-mock should not have been called again
                expect(ifFnMock).toHaveBeenCalledTimes(1);
                // The else-mock should have been called once, with the correct parameters
                expect(elseFnMock).toHaveBeenCalledTimes(1);
                expect(elseFnMock).toHaveBeenCalledWith(...args);
            });

        });

        describe('Aggregate Functions', () => {
            const someEnabled = {one: true, two: false};
            const allEnabled = {one: true, two: true};
            const noneEnabled = {one: false, two: false};

            describe('isAnyEnabled', () => {

                test('the default context should return true when some features are enabled', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled).isAnyEnabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled).isAnyEnabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled).isAnyEnabled(Object.keys(noneEnabled))).toBe(false);
                });

                test('a custom context should handle the results', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => true}).isAnyEnabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => true}).isAnyEnabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => true}).isAnyEnabled(Object.keys(noneEnabled))).toBe(true);

                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => false}).isAnyEnabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => false}).isAnyEnabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => false}).isAnyEnabled(Object.keys(noneEnabled))).toBe(false);
                });

            });

            describe('isAllEnabled', () => {

                test('the default context should return true when all features are enabled', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled).isAllEnabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled).isAllEnabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled).isAllEnabled(Object.keys(noneEnabled))).toBe(false);
                });

                test('a custom context should handle the results', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => true}).isAllEnabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => true}).isAllEnabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => true}).isAllEnabled(Object.keys(noneEnabled))).toBe(true);

                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => false}).isAllEnabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => false}).isAllEnabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => false}).isAllEnabled(Object.keys(noneEnabled))).toBe(false);
                });

            });

            describe('isAnyDisabled', () => {

                test('the default context should return true when some features are disabled', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled).isAnyDisabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled).isAnyDisabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled).isAnyDisabled(Object.keys(noneEnabled))).toBe(true);
                });

                test('a custom context should handle the results', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => true}).isAnyDisabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => true}).isAnyDisabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => true}).isAnyDisabled(Object.keys(noneEnabled))).toBe(false);

                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => false}).isAnyDisabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => false}).isAnyDisabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => false}).isAnyDisabled(Object.keys(noneEnabled))).toBe(true);
                });

            });

            describe('isAllDisabled', () => {

                test('the default context should return true when some features are disabled', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled).isAllDisabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled).isAllDisabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled).isAllDisabled(Object.keys(noneEnabled))).toBe(true);
                });

                test('a custom context should handle the results', () => {
                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => true}).isAllDisabled(Object.keys(someEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => true}).isAllDisabled(Object.keys(allEnabled))).toBe(false);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => true}).isAllDisabled(Object.keys(noneEnabled))).toBe(false);

                    expect(new FeatureManager.FeatureManager(someEnabled, {isEnabled: () => false}).isAllDisabled(Object.keys(someEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(allEnabled, {isEnabled: () => false}).isAllDisabled(Object.keys(allEnabled))).toBe(true);
                    expect(new FeatureManager.FeatureManager(noneEnabled, {isEnabled: () => false}).isAllDisabled(Object.keys(noneEnabled))).toBe(true);
                });

            });

        });

        describe('Listeners', () => {

            // Test add
            test('"addOnChangeListener" should return a function', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                const unsubscribe = featureManager.addChangeListener(() => {});
                expect(unsubscribe).toEqual(expect.any(Function));
            });

            test('listeners should be invoked when features are added or changed', () => {
                // Create the feature manager
                const featureManager = new FeatureManager.FeatureManager(features);

                // The features after a toggle
                const featuresAfterToggle = featureManager.getFeatures();
                featuresAfterToggle[feature] = !originalFeatureValue;

                // The features after adding a new feature
                const newFeature = 'newFeature';
                const newValue = true;
                const featuresAfterAdd = clone(featuresAfterToggle);
                featuresAfterAdd[newFeature] = newValue;

                // The features after removing a feature
                const featuresAfterRemove = clone(featuresAfterAdd);
                delete featuresAfterRemove[newFeature];

                let listener;
                let unsubscribe;

                return new Promise(resolve => {
                    // Keep track of how many times the listener is called
                    let listenerCallCount = 0;


                    // The listener
                    listener = jest.fn(() => {
                        if (3 === ++listenerCallCount) {
                            resolve(listener);
                        }
                    });

                    // Add the listener
                    unsubscribe = featureManager.addChangeListener(listener);

                    // Expect that the listener was not called
                    expect(listener.mock.calls.length).toBe(0);

                    // Toggle the feature
                    featureManager.toggle(feature);

                    // Add a feature
                    featureManager.addFeature(newFeature, newValue);

                    // Remove a feature
                    featureManager.removeFeature(newFeature);
                })
                .then(() => {
                    // Check that the listener has been called exactly twice
                    expect(listener.mock.calls.length).toBe(3);

                    // After the toggle
                    //
                    // Check the expected values
                    expect(listener.mock.calls[0][0]).toEqual(featuresAfterToggle);
                    // Should be a clone
                    expect(listener.mock.calls[0][0]).not.toBe(features);
                    // Check the feature name and value (opposite of the original value)
                    expect(listener.mock.calls[0][1]).toBe(feature);
                    expect(listener.mock.calls[0][2]).toBe(!originalFeatureValue);

                    // After adding a feature
                    //
                    // Check the expected values
                    expect(listener.mock.calls[1][0]).toEqual(featuresAfterAdd);
                    // Should be a clone
                    expect(listener.mock.calls[1][0]).not.toBe(features);
                    // Check the feature name and value
                    expect(listener.mock.calls[1][1]).toBe(newFeature);
                    expect(listener.mock.calls[1][2]).toBe(newValue);

                    // After removing a feature
                    //
                    // Check the expected values
                    expect(listener.mock.calls[2][0]).toEqual(featuresAfterRemove);
                    // Should be a clone
                    expect(listener.mock.calls[2][0]).not.toBe(features);
                    // Check the feature name and value
                    expect(listener.mock.calls[2][1]).toBe(newFeature);
                    // The feature value will be undefined, since it was removed
                    expect(listener.mock.calls[2][2]).toBe(undefined);
                })
                .finally(unsubscribe);
            });

            // Test remove (with multiple)
            test('the FeatureManager should remove a listener after it has been unsubscribed', () => {
                // Create the feature manager
                const featureManager = new FeatureManager.FeatureManager(features);
                // The original state of the features
                const featuresBeforeToggle = featureManager.getFeatures();
                // The features after a toggle
                const featuresAfterToggle = featureManager.getFeatures();
                featuresAfterToggle[feature] = !originalFeatureValue;

                const newFeature = 'newFeature';
                const newFeatureValue = true;
                const featuresAfterAdd = clone(featuresAfterToggle);
                featuresAfterAdd[newFeature] = newFeatureValue;

                let firstListener;
                let secondListener;
                let firstUnsubscribe;
                let secondUnsubscribe;
                let secondListenerCallCount = 0;

                return new Promise(resolve => {
                    // The listener
                    firstListener = jest.fn();
                    secondListener = jest.fn(() => {
                        if (2 === ++secondListenerCallCount) {
                            resolve();
                        }
                    });

                    // Add the listeners
                    firstUnsubscribe = featureManager.addChangeListener(firstListener);
                    secondUnsubscribe = featureManager.addChangeListener(secondListener);

                    // Expect that the listener was not called
                    expect(firstListener.mock.calls.length).toBe(0);
                    expect(secondListener.mock.calls.length).toBe(0);

                    // Toggle the feature (to invoke the listners)
                    featureManager.toggle(feature);

                    // Unsubscribe the first listener
                    firstUnsubscribe();

                    // Toggle the feature (to invoke the listners)
                    featureManager.toggle(feature);
                })
                .then(() => {
                    // Check the expectations for the first listener
                    //
                    // Check that the listener has been called exactly once
                    expect(firstListener.mock.calls.length).toBe(1);
                    // Check the expected values for the first listener
                    expect(firstListener.mock.calls[0][0]).toEqual(featuresAfterToggle);
                    // Should be a clone
                    expect(firstListener.mock.calls[0][0]).not.toBe(features);
                    // Check the feature name and value (opposite of the original value)
                    expect(firstListener.mock.calls[0][1]).toBe(feature);
                    expect(firstListener.mock.calls[0][2]).toBe(!originalFeatureValue);

                    // Check the expecations for the second listner
                    //
                    // Check that the listener has been called exactly twice
                    expect(secondListener.mock.calls.length).toBe(2);
                    // Check the expected values for the second listner
                    expect(secondListener.mock.calls[0][0]).toEqual(featuresAfterToggle);
                    // Should be a clone
                    expect(secondListener.mock.calls[0][0]).not.toBe(features);
                    // Check the feature name and value (opposite of the original value)
                    expect(secondListener.mock.calls[0][1]).toBe(feature);
                    expect(secondListener.mock.calls[0][2]).toBe(!originalFeatureValue);
                    //
                    // Second invocation
                    //
                    // Check the expected values
                    expect(secondListener.mock.calls[1][0]).toEqual(featuresBeforeToggle);
                    // Should be a clone
                    expect(secondListener.mock.calls[1][0]).not.toBe(features);
                    // Check the feature name and value (undefined, since the feature was removed)
                    expect(secondListener.mock.calls[1][1]).toBe(feature);
                    expect(secondListener.mock.calls[1][2]).toBe(originalFeatureValue);
                })
                .finally(secondUnsubscribe);
            });

            test('should not fail when a listener throws exception', () => {
                let unsubscribe;
                let onListenerError;
                let listener;
                const error = 'oops!';
                const originalFeatures = clone(features);
                // The features after a toggle
                const featuresAfterToggle = clone(originalFeatures);
                featuresAfterToggle[feature] = !originalFeatureValue;

                return new Promise(resolve => {
                    onListenerError = jest.fn(resolve);
                    const featureManager = new FeatureManager.FeatureManager(features, {onListenerError});
                    listener = jest.fn(() => {throw error;});
                    unsubscribe = featureManager.addChangeListener(listener);

                    // Toggle a feature
                    featureManager.toggle(feature);
                })
                .then(() => {
                    // Check the call counts
                    expect(listener.mock.calls.length).toBe(1);
                    expect(onListenerError.mock.calls.length).toBe(1);

                    // Check the parametgers
                    expect(onListenerError.mock.calls[0][0]).toBe(error);
                    expect(onListenerError.mock.calls[0][1]).toEqual(expect.any(Function));
                    expect(onListenerError.mock.calls[0][2]).toEqual(feature);
                    // The feature was toggled; check the value
                    expect(onListenerError.mock.calls[0][3]).toEqual(!originalFeatureValue);
                    expect(onListenerError.mock.calls[0][4]).toEqual(featuresAfterToggle);
                })
                .finally(unsubscribe);
            });

        });

    });

});
