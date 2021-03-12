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
        const unknownFeatureName = 'unknownFeature';
        const featureName = 'booleanFeature';
        const originalFeatureValue = true;
        const features = {};
        features[featureName] = originalFeatureValue;

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
            const newFeatureName = 'booleanFeatureTwo';

            test('the default context should allow a feature to be added', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.addFeature(newFeatureName, true);
                expect(featureManager.isEnabled(newFeatureName)).toBe(true);
            });

            test('a custom context should handle adding features', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {isTrue: () => true});
                featureManager.addFeature(newFeatureName, true);
                expect(featureManager.isEnabled(newFeatureName)).toBe(true);

                featureManager = new FeatureManager.FeatureManager(features, {isTrue: () => false});
                featureManager.addFeature(newFeatureName, true);
                expect(featureManager.hasFeature(newFeatureName)).toBe(true);
                expect(featureManager.isEnabled(newFeatureName)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canAddFeatures: () => false});
                featureManager.addFeature(newFeatureName, true);
                expect(featureManager.hasFeature(newFeatureName)).toBe(false);
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
                featureManager.removeFeature(featureName);
                expect(featureManager.hasFeature(featureName)).toBe(false);
            });

            test('a custom context should handle removing features', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => true});
                featureManager.removeFeature(featureName);
                expect(featureManager.hasFeature(featureName)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canRemoveFeatures: () => false});
                featureManager.removeFeature(featureName);
                expect(featureManager.hasFeature(featureName)).toBe(true);
            });

        });

        describe('hasFeature', () => {

            test('should return true when the feature exists', () => {
                expect(new FeatureManager.FeatureManager(features).hasFeature(featureName)).toBe(true);
            });

            test('should return true when the feature does not exist', () => {
                expect(new FeatureManager.FeatureManager(features).hasFeature(unknownFeatureName)).toBe(false);
            });

        });

        describe('isEnabled', () => {

            test('the default context should return the correct value', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.isEnabled(featureName)).toBe(originalFeatureValue);

                featureManager.setEnabled(featureName, !originalFeatureValue);
                expect(featureManager.isEnabled(featureName)).toBe(!originalFeatureValue);
            });

            test('a custom context should handle the value', () => {
                // This feature manager will return the opposite of the actual value
                const featureManager = new FeatureManager.FeatureManager(features, {isEnabled: () => !originalFeatureValue});
                expect(featureManager.isEnabled(featureName)).toBe(!originalFeatureValue);
            });

        });

        describe('isDisabled', () => {

            test('the default context should return the correct value', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.isDisabled(featureName)).toBe(!originalFeatureValue);

                featureManager.setEnabled(featureName, !originalFeatureValue);
                expect(featureManager.isDisabled(featureName)).toBe(originalFeatureValue);
            });

            test('a custom context should handle the value', () => {
                // This feature manager will return the opposite of the actual value
                const featureManager = new FeatureManager.FeatureManager(features, {isEnabled: () => !originalFeatureValue});
                expect(featureManager.isDisabled(featureName)).toBe(originalFeatureValue);
            });

        });

        describe('canSetFeature', () => {

            test('the default context should return true if the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                expect(featureManager.canSetFeature(featureName)).toBe(true);
                expect(featureManager.canSetFeature(unknownFeatureName)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});
                expect(featureManager.canSetFeature(featureName)).toBe(true);
                expect(featureManager.canSetFeature(unknownFeatureName)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                expect(featureManager.canSetFeature(featureName)).toBe(false);
                expect(featureManager.canSetFeature(unknownFeatureName)).toBe(false);
            });

        });

        describe('setEnabled', () => {

            test('the default context should set the feature when the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(featureName, !originalFeatureValue);
                // The feature should be set to false
                expect(featureManager.isEnabled(featureName)).toBe(!originalFeatureValue);
            });

            test('the default context should not set the feature when the feature is not known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(unknownFeatureName, true);
                expect(featureManager.isEnabled(unknownFeatureName)).toBe(false);
            });

            test('a custom context should handle setting the value', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Toggle the feature value
                featureManager.setEnabled(featureName, !originalFeatureValue);
                // The feature can not be set and should have the original value
                expect(featureManager.isEnabled(featureName)).toBe(originalFeatureValue);

                featureManager.setEnabled(unknownFeatureName, true);
                expect(featureManager.isEnabled(unknownFeatureName)).toBe(false);
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
                featureManager.ifEnabled(featureName, fn, args);
                expect(fn.mock.calls.length).toBe(1);
                expect(fn.mock.calls[0][0]).toBe(args[0]);
                expect(fn.mock.calls[0][1]).toBe(args[1]);
            });

            test('the default context should not execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(featureName, !originalFeatureValue);
                featureManager.ifEnabled(featureName, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('the default context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifEnabled(unknownFeatureName, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('a custom context should execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifEnabled(featureName, fn, args);
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(fn);
                expect(contextExecute.mock.calls[0][1]).toBe(args);
            });

            test('a custom context should not execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(featureName, false);
                featureManager.ifEnabled(featureName, fn, args);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

            test('a custom context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifEnabled(unknownFeatureName, fn);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

        });

        describe('ifDisabled', () => {

            test('the default context should execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(featureName, false);
                featureManager.ifDisabled(featureName, fn, args);
                expect(fn.mock.calls.length).toBe(1);
                expect(fn.mock.calls[0][0]).toBe(args[0]);
                expect(fn.mock.calls[0][1]).toBe(args[1]);
            });

            test('the default context should not execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifDisabled(featureName, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('the default context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.ifDisabled(unknownFeatureName, fn);
                expect(fn.mock.calls.length).toBe(0);
            });

            test('a custom context should execute the provided function if the feature is disabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(featureName, false);
                featureManager.ifDisabled(featureName, fn, args);
                expect(contextExecute.mock.calls.length).toBe(1);
                expect(contextExecute.mock.calls[0][0]).toBe(fn);
                expect(contextExecute.mock.calls[0][1]).toBe(args);
            });

            test('a custom context should not execute the provided function if the feature is enabled', () => {
                const fn = jest.fn();
                const args = ['one', 'two'];
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.setEnabled(featureName, true);
                featureManager.ifDisabled(featureName, fn, args);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

            test('a custom context should not execute the provided function if the feature is unknown', () => {
                const fn = jest.fn();
                const contextExecute = jest.fn();
                const featureManager = new FeatureManager.FeatureManager(features, {execute: contextExecute});
                featureManager.ifDisabled(unknownFeatureName, fn);
                expect(contextExecute.mock.calls.length).toBe(0);
            });

        });

        describe('decide', () => {

            const enabledArgs = ['enabledOne', 'enabledTwo'];
            const disabledArgs = ['disabledOne', 'disabledTwo'];

            test('the default context should run the enabled function and not the disabled function when the feature is enabled', () => {
                const enabledFn = jest.fn();
                const disabledFn = jest.fn();

                const featureManager = new FeatureManager.FeatureManager(features);
                featureManager.setEnabled(featureName, true);
                featureManager.decide(featureName, enabledFn, disabledFn, enabledArgs, disabledArgs);
                expect(enabledFn.mock.calls.length).toBe(1);
                expect(enabledFn.mock.calls[0][0]).toBe(enabledArgs[0]);
                expect(enabledFn.mock.calls[0][1]).toBe(enabledArgs[1]);
                // Make sure the disabled function was not executed
                expect(disabledFn.mock.calls.length).toBe(0);
            });

            test('the default context should run the disabled function and not the enabled function when the feature is disabled', () => {
                const enabledFn = jest.fn();
                const disabledFn = jest.fn();

                const featureManager = new FeatureManager.FeatureManager(features);
                // Set the feature to be disabled
                featureManager.setEnabled(featureName, false);
                featureManager.decide(featureName, enabledFn, disabledFn, enabledArgs, disabledArgs);
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
                featureManager.setEnabled(featureName, true);
                featureManager.decide(featureName, enabledFn, disabledFn, enabledArgs, disabledArgs);

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
                featureManager.setEnabled(featureName, false);
                featureManager.decide(featureName, enabledFn, disabledFn, enabledArgs, disabledArgs);

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
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canEnable(featureName)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canEnable(featureName)).toBe(true);

                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeatureName)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canEnable(featureName)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canEnable(featureName)).toBe(true);
                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeatureName)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                // Should not be able to set enabled when the feature is true
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canEnable(featureName)).toBe(false);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canEnable(featureName)).toBe(false);

                // Should not be able to set an unknown feature
                expect(featureManager.canEnable(unknownFeatureName)).toBe(false);
            });

        });

        describe('canDisable', () => {

            test('the default context should return true if the feature is known', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canDisable(featureName)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canDisable(featureName)).toBe(true);

                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeatureName)).toBe(false);
            });

            test('a custom context should handle the ability to set a feature', () => {
                let featureManager = new FeatureManager.FeatureManager(features, {canSet: () => true});

                // Should be able to set enabled when the feature is true
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canDisable(featureName)).toBe(true);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canDisable(featureName)).toBe(true);
                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeatureName)).toBe(false);

                featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});
                // Should not be able to set enabled when the feature is true
                featureManager.setEnabled(featureName, true);
                expect(featureManager.canDisable(featureName)).toBe(false);
                // Should be able to set enabled when the feature is false
                featureManager.setEnabled(featureName, false);
                expect(featureManager.canDisable(featureName)).toBe(false);

                // Should not be able to set an unknown feature
                expect(featureManager.canDisable(unknownFeatureName)).toBe(false);
            });

        });

        describe('enable', () => {

            test('the default context should enable a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Make sure the feature is disabled
                featureManager.setEnabled(featureName, false);
                expect(featureManager.isEnabled(featureName)).toBe(false);

                // Enable the feature and check the state
                featureManager.enable(featureName);
                expect(featureManager.isEnabled(featureName)).toBe(true);
            });

        });

        describe('disable', () => {

            test('the default context should disable a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Make sure the feature is enabled
                featureManager.setEnabled(featureName, true);
                expect(featureManager.isEnabled(featureName)).toBe(true);

                // Disable the feature and check the state
                featureManager.disable(featureName);
                expect(featureManager.isEnabled(featureName)).toBe(false);
            });

        });

        describe('canToggle', () => {

            test('the default context should be able to toggle a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Check that the toggle works one way
                expect(featureManager.canToggle(featureName)).toBe(true);
                // And check the other way
                featureManager.setEnabled(featureManager, !originalFeatureValue);
                expect(featureManager.canToggle(featureName)).toBe(true);
            });

            test('a custom context should handle allowing toggle', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Check that the toggle works one way
                expect(featureManager.canToggle(featureName)).toBe(false);
            });

        });
        describe('toggle', () => {

            test('the default context should toggle a feature', () => {
                const featureManager = new FeatureManager.FeatureManager(features);

                // Check that the toggle works one way
                let beforeValue = featureManager.isEnabled(featureName);
                featureManager.toggle(featureName);
                expect(featureManager.isEnabled(featureName)).toBe(!beforeValue);
                // And check the other way
                featureManager.toggle(featureName);
                expect(featureManager.isEnabled(featureName)).toBe(beforeValue);
            });

            test('a custom context should handle allowing toggle', () => {
                const featureManager = new FeatureManager.FeatureManager(features, {canSet: () => false});

                // Check that the toggle does not work
                let beforeValue = featureManager.isEnabled(featureName);
                featureManager.toggle(featureName);
                expect(featureManager.isEnabled(featureName)).toBe(beforeValue);
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
                featuresAfterToggle[featureName] = !originalFeatureValue;

                // The features after adding a new feature
                const newFeatureName = 'newFeature';
                const newFeatureValue = true;
                const featuresAfterAdd = clone(featuresAfterToggle);
                featuresAfterAdd[newFeatureName] = newFeatureValue;

                // The features after removing a feature
                const featuresAfterRemove = clone(featuresAfterAdd);
                delete featuresAfterRemove[newFeatureName];

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
                    featureManager.toggle(featureName);

                    // Add a feature
                    featureManager.addFeature(newFeatureName, newFeatureValue);

                    // Remove a feature
                    featureManager.removeFeature(newFeatureName);
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
                    expect(listener.mock.calls[0][1]).toBe(featureName);
                    expect(listener.mock.calls[0][2]).toBe(!originalFeatureValue);

                    // After adding a feature
                    //
                    // Check the expected values
                    expect(listener.mock.calls[1][0]).toEqual(featuresAfterAdd);
                    // Should be a clone
                    expect(listener.mock.calls[1][0]).not.toBe(features);
                    // Check the feature name and value
                    expect(listener.mock.calls[1][1]).toBe(newFeatureName);
                    expect(listener.mock.calls[1][2]).toBe(newFeatureValue);

                    // After removing a feature
                    //
                    // Check the expected values
                    expect(listener.mock.calls[2][0]).toEqual(featuresAfterRemove);
                    // Should be a clone
                    expect(listener.mock.calls[2][0]).not.toBe(features);
                    // Check the feature name and value
                    expect(listener.mock.calls[2][1]).toBe(newFeatureName);
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
                featuresAfterToggle[featureName] = !originalFeatureValue;

                const newFeatureName = 'newFeature';
                const newFeatureValue = true;
                const featuresAfterAdd = clone(featuresAfterToggle);
                featuresAfterAdd[newFeatureName] = newFeatureValue;

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
                    featureManager.toggle(featureName);

                    // Unsubscribe the first listener
                    firstUnsubscribe();

                    // Toggle the feature (to invoke the listners)
                    featureManager.toggle(featureName);
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
                    expect(firstListener.mock.calls[0][1]).toBe(featureName);
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
                    expect(secondListener.mock.calls[0][1]).toBe(featureName);
                    expect(secondListener.mock.calls[0][2]).toBe(!originalFeatureValue);
                    //
                    // Second invocation
                    //
                    // Check the expected values
                    expect(secondListener.mock.calls[1][0]).toEqual(featuresBeforeToggle);
                    // Should be a clone
                    expect(secondListener.mock.calls[1][0]).not.toBe(features);
                    // Check the feature name and value (undefined, since the feature was removed)
                    expect(secondListener.mock.calls[1][1]).toBe(featureName);
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
                featuresAfterToggle[featureName] = !originalFeatureValue;

                return new Promise(resolve => {
                    onListenerError = jest.fn(resolve);
                    const featureManager = new FeatureManager.FeatureManager(features, {onListenerError});
                    listener = jest.fn(() => {throw error;});
                    unsubscribe = featureManager.addChangeListener(listener);

                    // Toggle a feature
                    featureManager.toggle(featureName);
                })
                .then(() => {
                    // Check the call counts
                    expect(listener.mock.calls.length).toBe(1);
                    expect(onListenerError.mock.calls.length).toBe(1);

                    // Check the parametgers
                    expect(onListenerError.mock.calls[0][0]).toBe(error);
                    expect(onListenerError.mock.calls[0][1]).toEqual(expect.any(Function));
                    expect(onListenerError.mock.calls[0][2]).toEqual(featureName);
                    // The feature was toggled; check the value
                    expect(onListenerError.mock.calls[0][3]).toEqual(!originalFeatureValue);
                    expect(onListenerError.mock.calls[0][4]).toEqual(featuresAfterToggle);
                })
                .finally(unsubscribe);
            });

        });

    });

});
