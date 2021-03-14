import { FeatureSwitchDOM } from '../../src/feature-switch-dom.js';
import { FeatureManager } from '../../src/feature-manager.js';

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

// Setup the DOM to match the initial feature state
// fsDom.syncToDom(featureManager.getFeatures());

const customDisableHandler = (node, feature, enabled) => {
    // Text:
    if (Node.TEXT_NODE === node.nodeType) {
        // If the cached node value is not set, then set it (this protects against
        // setting invalid cache values when "disable" is called multiple times
        // without a call to "enable")
        if (!node.__$nodeValue) {
            node.__$nodeValue = node.nodeValue;
        }
        node.nodeValue = '';
    }

    // Element:
    if (Node.ELEMENT_NODE === node.nodeType) {
        node.style.border = '1px solid red';
    }
};

const customEnableHandler = (node, feature, enabled) => {
    // Text:
    if (Node.TEXT_NODE === node.nodeType) {
        // Set the node value from cache (if the value is not set; this protects
        // against multipe calls to "enable" without calling "disable")
        node.nodeValue = node.nodeValue || node.__$nodeValue;
        // Clear the cache (this will refresh the cache on the next
        // "disable" in the case where the text has changed)
        node.__$nodeValue = null;
    }

    // Element:
    if (Node.ELEMENT_NODE === node.nodeType) {
        node.style.border = '1px solid green';
    }
};

const useCustomHandlersCheckbox = document.getElementById('js-use-custom-handlers');
const getEnableHandler = () => useCustomHandlersCheckbox.checked ? customEnableHandler : undefined;
const getDisableHandler = () => useCustomHandlersCheckbox.checked ? customDisableHandler : undefined;


// Add a change listener to the FeatureManager; when a value is changed,
// this handler will dispatch the appropriate method (enable/disable) to
// the FSDOM instance, along with the feature and the handler
featureManager.addChangeListener((featureSnapshot, feature, enabled) => !!enabled ? fsDom.enable(feature, getEnableHandler()) : fsDom.disable(feature, getDisableHandler()));
// NOTE: Use fsDom.syncToDom() instead of fsDom.enable and fsDom.disable for consistent results when using embedded features
// featureManager.addChangeListener((featureSnapshot, feature, enabled) => fsDom.syncToDom(featureManager.getFeatures(featureSnapshot)));

// Add click listeners for the "sync" button; this will invoke the FSDOM.syncToDom function with the current state of the features
document.querySelectorAll('.js-sync-to-dom').forEach(element => element.addEventListener('click', () => fsDom.syncToDom(featureManager.getFeatures(), getEnableHandler(), getDisableHandler())));


// Add listeners for the "toggle" buttons. This will get the feature name
// from the clicked element (data-feature-name attribute) and toggle the value
// in the FeatureManager
document.querySelectorAll('.js-toggle-feature').forEach(element => element.addEventListener('click', () => featureManager.toggle(element.attributes['data-feature-name'].value)));

document.getElementById('js-observe-scenario-one').addEventListener('click', event => {
    // Prevent the default event behavior (in this case, the page would normally reload)
    event.preventDefault();

    // Disable custom event handlers
    useCustomHandlersCheckbox.checked = false;

    // Sync the features (start with a clean plate)
    fsDom.syncToDom(featureManager.getFeatures());

    // While not necessary, setting the features will keep the table display in sync with the rendered values
    // Disable feature 1
    featureManager.disable('featureone');
    // Enable feature 2
    featureManager.enable('featuretwo');

    // Because there is a change listener on the FeatureManager instance, all values are rendered correctly;
    // consequently, this code is needed to illustrate the issue
    fsDom.disable('featureone');
    fsDom.enable('featuretwo');

    return false;
});
