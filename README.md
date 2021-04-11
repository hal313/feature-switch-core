# [feature-switch-core](https://github.com/hal313/feature-switch-core)

[![Build Status](http://img.shields.io/travis/hal313/feature-switch-core/master.svg?style=flat-square)](https://travis-ci.org/hal313/feature-switch-core)
[![Dependency Status](https://david-dm.org/hal313/feature-switch-core.svg?style=flat-square)](https://david-dm.org/hal313/feature-switch-core)[![DevDependency Status](https://david-dm.org/hal313/feature-switch-core/dev-status.svg?style=flat-square)](https://david-dm.org/hal313/feature-switch-core)
[![npm Version](https://badge.fury.io/js/%40hal313%2Ffeature-switch-core.svg)](https://badge.fury.io/js/%40hal313%2Ffeature-switch-core)
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

### Feature state notification example:
It may be useful to respond to feature state changes.
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

### Function Generation
Sometimes it is useful to create a function whose body will execute only when a specific feature is enabled or disabled:
```javascript
// Define some features
const features = {
    featureOne: true
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);
const ifFeatureOne = featureManager.ifFunction('featureOne', (name) => console.log(`featureOne is enabled, ${name}`));
const elseFeatureOne = featureManager.elseFunction('featureOne', (name) => console.log(`featureOne is disabled, ${name}`));

ifFeatureOne('Sam');
elseFeatureOne('Mel');
// output: featureOne is enabled, Sam

featureManager.disable('featureOne');
ifFeatureOne('Sam');
elseFeatureOne('Mel');
// output: featureTwo is disabled, Mel
```
It is possible to combine the above two functions as one:
```javascript
// Define some features
const features = {
    featureOne: true
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features);
const ifElseFeatureOne = featureManager.ifElseFunction(
    'featureOne',
    (name) => console.log(`featureOne is enabled, ${name}`),
    (name) => console.log(`featureOne is disabled, ${name}`)
);

ifElseFeatureOne('Sam');
// output: featureOne is enabled, Sam

featureManager.disable('featureOne');
ifElseFeatureOne('Mel');
// output: featureOne is disabled, Mel
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
const isBeta = () => Math.random() < .5;

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
// output: varies on the random value, but will be either true or false
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
console.log(featureManager.canAddFeatures());
// output: true
// Determines if features can be removed
console.log(featureManager.canRemoveFeatures());
// output: true
// Determines if features can be set
console.log(featureManager.canSetFeature('someFeature', true));
// output: false (because feature 'someFeature' does not exist)

// Checks to see if the feature can be enabled
console.log(featureManager.canEnable('someFeature'));
// output: false (because feature 'someFeature' does not exist)
// Checks to see if the feature can be disabled
console.log(featureManager.canDisable('someFeature'));
// output: false (because feature 'someFeature' does not exist)
// Checks to see if the feature can be toggled
console.log(featureManager.canToggle('someFeature'));
// output: false (because feature 'someFeature' does not exist)
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
const apiClient = featureManager.decide('apiV2', () => {return {version: 2}}, () => {return {version: 1}});
console.log('apiClient', apiClient);
```

### Example: A/B Testing
Using a custom `Context` can be used to support A/B testing.
```javascript
// Define some features
const features = {
    abTestingFeatureX: true,
};

// Custom context
const context = {
    // If the current user is enrolled in the alternate implementation, consider the features enabled
    isEnabled: (feature, features) => {
        // If the feature is an A/B testing feature, defer to the A/B testing decider
        if ('abTestingFeatureX' === feature) {
            // Use username sharding to dermine eligibility, for example: if the username starts with a-m, case insensitive
            // getUser().match(/^[a-mA-M]/);
            //
            // In this example, return true
            return true;
        }

        // Otherwise, return the default value
        return features[feature];
    }
};

// Create an instance of a FeatureManager
const featureManager = new FeatureManager(features, context);

// Test
const result = featureManager.decide('abTestingFeatureX', () => 'implemenationA', () => 'implemenationB');
console.log('result', result);
// output: true
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
const attempt = (fn) => {
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
const featureManager = new FeatureManager(features);

// If dark testing is enabled, then both the current and next implementations will be executed.
const result = featureManager.decide('darkTestImplementationA', () => evaluateMetrics(() => 'currentImplementation result', () => 'nextImplementation result'), () => 'currentImplementation result')
console.log('result', result);
// output: varies based on which function executed the quickest
```

## Stripping Features
The file `feature-switch-strip` exports a function (`strip`), which reads a string and attempts to strip out features as described the an `options` object. Features may be described by HTML comments, slash-style comments or star-style comments. Within HTML files, features may also be described in markup.

It is important to note that the stripper is _not_ a parser and therefore may act erratically when presented with complex configurations or situations. It is recommended to avoid embedded features all together, or to use the DOM manipulation functionality when managing complex DOM structures.

### Comments
All comment types require two sets of comments, a start marker and an end marker. Having unbalanced blocks (i.e. missing end markers or end markers which are not in the correct order) may result in unexpected behavior. For this reason, it is recommended to be sure that both start and end marker blocks are formatted correctly and present in the correct place.

#### HTML Comments
HTML comments are generally found within HTML or XML files and look like:
```html
<!-- FEATURE.start(feature-name) -->
    <div>content for feature-name</div>
<!-- FEATURE.end(feature-name) -->
```

#### Slash
Slash comments are generally found in JavaScript or LESS files:
```javascript
// FEATURE.start(feature-name)
console.log('feature-name is enabled');
// FEATURE.end(feature-name)
```
#### Star
Star comments are common in JavaScript as well as CSS:
```javascript
/* FEATURE.start(feature-name) */
console.log('feature-name is enabled');
/* FEATURE.start(feature-name) */
```

### HTML Elements
In addition to comments in HTML files, some elements can also be configured to describe features. This functionality is experimental and may not work as desired. The DOM management functionality should produce more reliable results (as well as provide more options of specifying features).

#### Feature Name as Element
Using elements whose name is the feature name is supported.
```html
<feature-name>feature-name content</feature-name>
```

#### Element with the "feature-name" Attribute
Supports the `feature-name` attribute on elements. This will not work well with DOM elements of the same type within the content of the feature. The DOM management functionality should produce more reliable results (as well as provide more options of specifying features).
```html
<div feature-name="feature-name"></div>
```

### Options
The `strip` function can take an optional second arguement, `options`. This is the structure of the options and represents the default options. Note that the `replace` attribute replaces disabled features and that `${FEATURE}` will be replaced with the name of the feature being disabled.

```javascript
// The default options
{

    // /* FEATURE.start(feature-name) */ ... /* FEATURE.end(feature-name) */
    starComments: {
        enabled: true,
        replace: '/* Feature [${FEATURE}] DISABLED */'
    },
    // feature.start(feature-name) -> // feature.end(feature-name)
    slashComments: {
        enabled: true,
        replace: '// Feature [${FEATURE}] DISABLED //'
    },
    // <!-- feature.start(feature-name) -->...<!-- feature.end(feature-name) -->
    htmlComments: {
        enabled: true,
        replace: '<!-- Feature [${FEATURE}] DISABLED -->'
    },
    // <feature-name ...></feature-name>
    htmlElements: {
        enabled: true,
        replace: '<!-- Feature [${FEATURE}] DISABLED -->'
    },
    // <div ... feature-name="feature-name" ...></div>
    htmlAttributes: {
        // This is experimental and probably only works on well formated HTML that is not complex and certainly not embedded elements, thank you very much
        enabled: true,
        replace: '<!-- Feature [${FEATURE}] DISABLED -->'
    }
};
```

### DOM Manipulation
Live DOM manipulation can be used to alter the DOM to show or hide DOM elements which represent features.

#### HTML Comments
HTML comments are generally found within HTML or XML files and look like:
```html
<!-- FEATURE.start(feature-name) -->
    <div>content for feature-name</div>
<!-- FEATURE.end(feature-name) -->
```

#### Feature Name as Element
Using elements whose name is the feature name is supported.
```html
<feature-name>feature-name content</feature-name>
```

#### Element with the "feature-name" Attribute
Supports the `feature-name` attribute on elements.
```html
<div feature-name="feature-name"></div>
```

#### Feature as Element with the "feature-name" Attribute
Using elements of type `feature` and whose name is specified by the `feature-name` attribute are supported.
```html
<feature feature-name="feature-name">feature-name content</feature>
```

### Using the FeatureSwitchDOM Object
The `FeatureSwitchDOM` is not aware of features per-se and instead operates solely on feature names. While simple cases may be serviced by the `enable` and `disable` functions, more complex cases should instead use `syncToDom`.
```javascript
// Import the class
import { FeatureSwitchDOM } from './feature-switch-dom';

// Instantiate the class
const fsDom = new FeatureSwitchDOM();

// Manipulate the DOM
//
// Enable all DOM elements described by the name "feature-one"
fsDOM.enable('feature-one');

// Disable all DOM elements described by the name "feature-one"
fsDOM.disable('feature-one`);

// Synchronize all DOM elements to the specified features
fsDOM.syncToDom({'feature-one': true, 'feature-two': false});
```

It is more common to use the FeatureSwitchDOM class with a FeatureManager instance:
```javascript
// Import the class
import { FeatureSwitchDOM } from './feature-switch-dom';
import { FeatureManager } from './feature-manager';

// The features
const features = {
    featureone: true,
    featuretwo: false,
    featurethree: true,
    featurefour: false
};

// Instantiate the DOM management
const fsDom = new FeatureSwitchDOM();

// The FeatureManager instance
const featureManager = new FeatureManager(features);

// Enable a feature
featureManager.enable('featuretwo');

// Sync the DOM
fsDom.syncToDom(featureManager.getFeatures());
```

Automatically managing the HTML can be accomplished fairly easily.
```javascript
import { FeatureSwitchDOM } from './feature-switch-dom.js';
import { FeatureManager } from './feature-manager.js';

// The features
const features = {
    featureone: true,
    featuretwo: false,
    featurethree: true,
    featurefour: false
};

// The FeatureManager instance
const featureManager = new FeatureManager(features);

// The FeatureSwitchDOM instance
const fsDom = new FeatureSwitchDOM(featureManager.getFeatures());

// The FeatureSwitchDOM instance will sync the features to the DOM every time the features change
featureManager.addChangeListener((featureSnapshot, feature, enabled) => fsDom.syncToDom(featureManager.getFeatures(featureSnapshot)));
```

#### Custom Handlers
The FeatureSwitchDOM methods take optional handlers which can be used to change how a DOM element is rendered when enabled or disabled. The signature is:
```javascript
/**
 * @param {Node} node the node being managed
 * @param {String} feature the feature
 * @param {boolean} enabled the state of the feature
 */
const handler = (node, feature, enabled) => {};
```

NOTE: Because the FeatureSwichDOM is a parser and the stripper is not a parser, achieving the same functionality between the two is not possible (in particular, the stripper does not support the same functionality as the DOM management functionality). However, both the stripper and the DOM management functionality support HTML comments. For this reason, it is recommended to use strictly HTML comments if consistent behavior is desired across the stripper and the DOM management functionality.

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
```

#### Bugs
To report a defect or unexpected behavior, please visit the (GitHub issues page)[https://github.com/hal313/feature-switch-core/issues].
