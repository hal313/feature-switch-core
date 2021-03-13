# [feature-switch-core](https://github.com/hal313/feature-switch-core)

[![Build Status](http://img.shields.io/travis/hal313/feature-switch-core/master.svg?style=flat-square)](https://travis-ci.org/hal313/feature-switch-core)
[![Dependency Status](https://david-dm.org/hal313/feature-switch-core.svg?style=flat-square)](https://david-dm.org/hal313/feature-switch-core)[![DevDependency Status](https://david-dm.org/hal313/feature-switch-core/dev-status.svg?style=flat-square)](https://david-dm.org/hal313/feature-switch-core)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/hal313/feature-switch-core)


> A JavaScript synchronous implementation of feature switches, with a few bells and whistles. In general, features are describe as plain JavaScript objects whose values are boolean:

```javascript
const features = {
    featureOne: true,
    featureTwo: false
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);

// Enable, disable and toggle a feature
console.log('featureOne', featureManager.isEnabled('featureOne'));
// output: featureOne true
```

The `FeatureManager` object receives features at instantiation time; these features are cloned so that any changes to the initial feature object is _not_ realized by the `FeatureManager`. Likewise any feature objects obtained from the `FeatureManager` are also clones and will not realize subsequent changes.

As well, the `FeatureManager` will normalize the passed in features; any value which is the boolean true or the string literal "true" will be considered `true` and all other values will be considered `false`. It is possible to customize this behavior (this is covered in detail later).

Advanced use scenarios support A/B testing and dark testing a new implemenation of some complex functionality (see examples below).

In addition to the `FeatureManager`, there are facilities to strip out features from HTML, JavaScript and CSS. Such functionality may be useful at build time in order to provide different builds based on which features are enabled. This functionality could be leveraged in middleware. For example, an express server may filter HTML documents or JavaScript examples based on server-side features.

Lastly, DOM management code is provided for supporting dynamic management of features within an HTML page.

It is noteworthy that there are no runtime depedencies required for this library.

# Usage
Usage examples are provided below.
## Basic Usage
The most basic usage:
```javascript
// Define some features
const features = {
    featureOne: true,
    featureTwo: false
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);

// Enable, disable and toggle a feature
console.log('featureOne', featureManager.isEnabled('featureOne'));
// output: featureOne true
//
// Disable the feature
featureManager.disable('featureOne');
console.log('featureOne', featureManager.isEnabled('featureOne'));
// output: featureOne false
//
// Enable the feature
featureManager.enable('featureOne');
console.log('featureOne', featureManager.isEnabled('featureOne'));
// output: featureOne true
//
// Toggle the feature
featureManager.toggle('featureOne');
console.log('featureOne', featureManager.isEnabled('featureOne'));
// output: featureOne false

// Output the state of the feature:
console.log('featureOne is enabled', featureManager.isEnabled('featureOne'));
// output: featureOne is enabled false
console.log('featureOne is disabled', featureManager.isDisabled('featureOne'));
// output: featureOne is disabled true
```

## Advanced Usage
Some advanced usage:
```javascript
// Define some features
const features = {
    featureOne: true,
    featureTwo: false
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);

// getFeatures() -> gets a copy of the features object
console.log(featureManager.getFeatures().featureOne);
// output: true

// hasFeature(feature) -> determines if a feature is known to the feature manager
console.log(featureManager.hasFeature('featureOne'));
// output: true
console.log(featureManager.hasFeature('invalidFeature'));
// output: false

// isAnyEnabled(features) -> returns true of any of the specified features are enabled
console.log(featureManager.isAnyEnabled(['featureOne', 'featureTwo']));
// output: true

// isAllEnabled(features) -> returns true of all of the specified features are enabled
console.log(featureManager.isAllEnabled(['featureOne', 'featureTwo']));
// output: false

// isAnyDisabled(features) -> returns true if any of the specified features are disabled
console.log(featureManager.isAnyDisabled(['featureOne', 'featureTwo']));
// output: true

// isAllDisabled(features) -> returns true of all of the specified features are disabled
console.log(featureManager.isAllDisabled(['featureOne', 'featureTwo']));
// output: false

// ifEnabled(feature, fn, args) -> executes a function if the specified feature is enabled
featureManager.ifEnabled('featureOne', (words) => console.log(words.join(' ')), [['feature', 'one']]);
// output: feature one

// ifDisabled(feature, fn, args) -> executes a function if the specified feature is disabled
featureManager.ifDisabled('featureTwo', (words) => console.log(words.join(' ')), [['feature', 'two']]);
// output: feature two

// decide(feature, enabledFn, disabledFn, enabledArgs, disabledArgs) -> ifEnabled and ifDisabled, all rolled up into one
featureManager.decide('featureOne', () => console.log('enabled'), () => console.log('disabled'));
// output: enabled
featureManager.decide('featureTwo', () => console.log('disabled'), () => console.log('disabled'));
// output: disabled

// addFeature(feature, value) -> adds a feature to the feature manager
featureManager.addFeature('featureThree', true);
console.log(featureManager.isEnabled('featureThree'));
// output: true

// removeFeature(feature) -> removes a feature from the feature manager
// NOTE: It is often not a good idea to remove features at runtime as this may cause some logical bugs
featureManager.removeFeature('featureThree');
console.log(featureManager.hasFeature('featureThree'));
// output: false

// setEnabled(feature, value) -> used by enable() and disable()
featureManager.setEnabled('featureTwo', true);
console.log(featureManager.isEnabled('featureTwo'));
// output: true
```

Feature state notification example:
```javascript
// Define some features
const features = {
    featureOne: true,
    featureTwo: false
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);
const removeListener = featureManager.addChangeListener((featuresSnapshot, feature, value) => {
    console.log('feature', name, 'was changed to', value);
    removeListener();
});
featureManager.enable('featureTwo');
// output: feature featureTwo was changed to true
// NOTE: The return value of the function is a function which will remove the listener from
//       the FeatureManager
```

### Context
Sometimes it is required to extend some functionality of the `FeatureManager`. It is important to understand the `Context` object, how to use it and what can be done with it.


The 'Context' object:
```javascript
{
    // This function will execute callbacks for ifEnabled(), ifDisabled() and decide()
    execute: (fn, args) => fn.apply({}, args),
    // This might be helpful in order to track how often callbacks are invoked

    // Determines if a value is true
    isTrue: (value) => true === value || 'true' === value,
    // Useful if other values should be considered true ('yes', 'on', etc.)

    // Determines if a feature is enabled
    isEnabled: (feature, features) => return features[feature],
    // Can be used to provide different features based on user (see example below)
    // NOTE: Use this with care

    // Determines if a feature can be set
    canSet: (feature, enabled) => true,
    // Sometimes it is not possible to alter feature states

    // Determines if features can be added
    canAddFeatures: () => return true,
    // Useful for read-only features

    // Determines if features can be removed
    canRemoveFeatures: () => return true
    // Useful for read-only features
```

A `Context` object may be supplied to the `FeatureManager` at construction time. It is not required to provide all members; only the desired members.

```javascript
// Assume that the window.beta flag is set to true on beta systems
const isBeta = () => !!window.beta;

// Define some features
const features = {
    // The beta feature is disabled for everyone
    betaFeature: false
};

const context = {
    // Enable all features for beta users
    isEnabled: (feature, features) => isBeta()
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features, context);

console.log(featureManager.isEnabled('betaFeature'));
// output: true
```

The `FeatureManager` API also has these functions, which dispatch to the `Context`.
```javascript
// Define some features
const features = {
    featureOne: true,
    featureTwo: false
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);

// Determines if features can be added
featureManager.canAddFeatures();
// Determines if features can be removed
featureManager.canRemoveFeatures();
// Determines if features can be set
featureManager.canSetFeature('someFeature', true);

// Checks to see if the feature can be enabled
featureManager.canEnable('someFeature');
// Checks to see if the feature can be disabled
featureManager.canDisable('someFeature');
// Checks to see if the feature can be toggled
featureManager.canToggle('someFeature');
```

### Example: Supporting Different API Version
Sometimes it might be helpful to be able to feature switch API client libraries. This can be done like so:
```javascript
// Define some features
const features = {
    apiV2: true
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);

// Get API Client version 1, unless features.apiV2 is enabled
const apiClient = featureManager.decide('apiV2', SomeClientAPI.getClientVersionTwo, SomeClientAPI.getClientVersionOne);
```

### Example: A/B Testing
Using a custom `Context` can be used to support A/B testing.
```javascript
// Define some features
const features = {
    featureOne: true,
    featureTwo: false
};

// Custom context
const context = {
    // If the current user is enrolled in the alternate implementation, consider the features enabled
    isEnabled: (feature, features) => {
        // If the feature is an A/B testing feature, defer to the A/B testing decider
        if ('abTestingFeatureX' === feature) {
            // Use username sharding to dermine eligibility, for example: if the username starts with a-m, case insensitive
            getUser().match(/^[a-mA-M]/);
        }

        // Otherwise, return the default value
        return features[feature];
    }
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features, context);

// Test
featureManager.decide('abTestingFeatureX', implementationA, implementationB);
```

### Example: Dark Testing a new Implementation
Testing a new implementation can introduce breaking changes. The FeatureManager can be used to allow the original implementation to continue to be used for all users, while also executing the new implementation for analysis, controlled by a feature switch.
```javascript
// Define some features
const features = {
    darkTestImplementationA: true
};

/**
 * Executes a function, while keeping track of timing and results.
 *
 * @param {Function} fn the function to execute
 * @returns {Object} a descriptor of the execution results
 */
const attempt (fn) => {
    const attemptResult = {
        result: undefined,
        time: -1,
        thrown: false
    };
    let startTime;
    try {
        startTime = new Date().getTime();
        attemptResult.result = fn.apply({});
        attemptResult.time = new Date().getTime() - startTime;
    } catch (error) {
        attemptResult.thrown = error;
        attemptResult.time = new Date().getTime() - startTime;
    }
    return attemptResult;
};

/**
 * Evaluates the differences between the results of two different implementations.
 *
 * @param {Object} currentImplementation the current implementation
 * @param {Object} nextImplementation the implementation under test
 * @returns {any} the result of the current implementation execution
 */
const evaluateMetrics = (currentImplementation, nextImplementation) => {

    // Attempt both implementations
    const currentResult = attempt(currentImplementation);
    const nextResult = attempt(nextImplementation);

    console.log('current implementation results', currentResult);
    console.log('next implementation results', nextResult);
    console.log('the quicker implementation', (currentResult.time < nextResult.time) ? 'current' : 'next');
    // Perhaps check that the results are the same, or that both implementations threw or did not throw

    // If the current implementation threw an error, then this function will propogate the error
    if (!!currentResult.thrown) {
        throw currentResult.thrown;
    }

    // Otherwise, return the result of the current implementation
    return currentResult.result
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features, context);

// If dark testing is enabled, then both the current and next implementations will be executed.
let result = decide('darkTestImplementationA', () => evaluateMetrics(currentImplementation, nextImplementation), currentImplementation)



```

## Developing
To setup a development environment:
```bash
## Get the dev deps (jest and babel)
npm install
```

### Testing
Tests are handled by `jest`. The following script will run tests continuously:
```bash
npm test
```

To see coverage:
```bash
npx jest --coverage
```

#### Playground
Using "live server" functionality with an IDE, serve up `test/dom-files/dom-sample.html`. If no live server is available:
```bash
## Run a server and open a browser to the page
npx http-server -o test/dom-files/dom-sample.html
