// TODO: Write DOM tests

/**
 * Handles enable/disable events. This will deleage to the appropriate handler (the
 * enabled handler when the feature was enabled, or the disabled handler when the
 * feature was disabled).
 *
 * @param {Node} node the node to handle
 * @param {string} feature the feature which changed
 * @param {boolean} enabled the current enabled value of the feature
 * @param {Function} handler the function to delegate to
 */
const handleNode = (node, feature, enabled, handler) => handler(node, feature, enabled);

/**
 * Invoked when a node, which represents a feature, has needs to be disabled. This
 * implementation will hide text (in a "text" node) or hide the element (in
 * an "element" node).
 *
 * @param {Node} node the node representing the feature that changed
 */
const defaultDisableHandler = node => {
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
        node.style.display = 'none';
    }
};

/**
 * Invoked when a node, which represents a feature, has needs to be enabled. This
 * implementation will display text (in a "text" node) or show the element (in an
 * "element" node).
 *
 * @param {Node} node the node representing the feature that changed
 */
const defaultEnableHandler = node => {
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
        node.style.display = '';
    }
};


/**
 * Returns a list of nodes which are identified by feature comments (<!-- FEATURE.start(feature-name)-->
 * and <!-- FEATURE.end(feature-name) -->).
 *
 * @param {string} feature the feature name to find nodes identified by comment
 * @param {Node} [rootNode] the node to start traversal at (defaults to "document")
 * @param {Node[]} [nodesToDisable] a list of nodes to disable (used in recursion)
 * @returns {Node[]} a list of nodes matched by the feature comments
 */
const findNodesByComment = (feature, rootNode, nodesToDisable) => {
    let featureSwitchesStack = [];
    let expectedFeature;
    let nodeValue;
    let currentChildNode;
    let startMatch;
    let startFeatureName;
    let endMatch;
    let endFeatureName;

    rootNode = rootNode || document;
    nodesToDisable = nodesToDisable || [];

    // Loop over each node to search its children for nodes to remove
    currentChildNode = rootNode.firstChild;

    // Iterate over the child nodes
    while (currentChildNode) {
        // Mark the node for disabling if the node qualifies (do not disable comment nodes; that can lead to unbalanced feature identifiers)
        if (!!featureSwitchesStack.length && (Node.COMMENT_NODE !== currentChildNode.nodeType)) {
            // console.log('', 'marking node for disabling', 'current feature', featureSwitchesStack);
            nodesToDisable.push(currentChildNode);
        }

        // Only interested in comments
        if (Node.COMMENT_NODE === currentChildNode.nodeType) {
            nodeValue = (currentChildNode.nodeValue || '').trim();

            // Get the start match (if any)
            const startFeatureSwitchRegex = `FEATURE.start\\((${feature})\\)`;
            const endFeatureSwitchRegex = `FEATURE.end\\((${feature})\\)`;


            startMatch = nodeValue.match(startFeatureSwitchRegex);
            startFeatureName = (!!startMatch && startMatch[1]) || '';

            // Get the end match (if any)
            endMatch = nodeValue.match(endFeatureSwitchRegex);
            endFeatureName = (!!endMatch && endMatch[1]) || '';

            // Are we starting a block?
            if (!!startFeatureName) {
                // Start a feature
                if (feature === startFeatureName) {
                    // console.log('disabling[passive]', startFeatureName);
                    featureSwitchesStack.push(startFeatureName);
                }
            } else if (!!featureSwitchesStack.length) {
                if (!!endFeatureName) {
                    expectedFeature = featureSwitchesStack[featureSwitchesStack.length - 1];
                    if (endFeatureName === expectedFeature) {
                        // We are finishing a block
                        featureSwitchesStack.pop();
                    } else {
                        // Unbalanced feature switch blocks
                        console.warn('WARNING', 'Unbalanced feature switch block; expected', expectedFeature, 'actual', endFeatureName);
                    }
                }
            }
        } else if (Node.ELEMENT_NODE === currentChildNode.nodeType) {
            // Traverse this node deeply
            findNodesByComment(feature, currentChildNode, nodesToDisable);
        }

        // Move to the next sibling.
        currentChildNode = currentChildNode.nextSibling;
    }

    return nodesToDisable;
};

/**
 * Finds all nodes which correspond to the feature
 *
 * @param {string} feature the feature whose nodes should be found
 * @returns {Node[]} an array of nodes which correspond to the feature
 */
const findFeatureNodes = (feature) => {
    // The matching nodes
    const nodes = [];

    // Node.ELEMENT_NODE
    document.querySelectorAll(`feature-${feature}`).forEach(node => nodes.push(node));
    document.querySelectorAll(`feature[name="${feature}"]`).forEach(node => nodes.push(node));
    document.querySelectorAll(`[feature-name="${feature}"]`).forEach(node => nodes.push(node));

    // Node.ELEMENT_NODE, Node.TEXT_NODE
    findNodesByComment(feature).forEach(node => nodes.push(node));

    return nodes;
};

/**
 * A class which manipulates DOM elements based on feature states. This class is not aware of features; all
 * features will need to be provided within the function calls.
 *
 * Features can be defined in HTML in the following ways:
 * <feature-name>...</feature-name>
 * <div feature-name=></div>
 */
export class FeatureSwitchDOM {

    /**
     * Enables a feature. This will find all DOM elements that are represented by features and invoke an optional
     * handler on each DOM element (or the default handler, if no handler is provided).
     *
     * @param {string} feature the feature to enable
     * @param {Function} [handler] the handler function to invoke (node: Node, feature: string, enabled: boolean)
     */
    enable(feature, handler) {
        findFeatureNodes(feature).forEach(node => handleNode(node, feature, true, handler || defaultEnableHandler));
    }

    /**
     * Disables a feature. This will find all DOM elements that are represented by features and invoke an optional
     * handler on each DOM element (or the default handler, if no handler is provided).
     *
     * @param {string} feature the feature to disable
     * @param {Function} [handler] the handler function to invoke (node: Node, feature: string, enabled: boolean)
     */
    disable(feature, handler) {
        findFeatureNodes(feature).forEach(node => handleNode(node, feature, false, handler || defaultDisableHandler));
    }

    /**
     * Synchronizes the any DOM elements represented by features to their associated state
     *
     * @param {Object} features the features to sync (keys are feature names and values should be boolean values)
     * @param {Function} [enableHandler] the handler function to enable nodes (node: Node, feature: string, enabled: boolean)
     * @param {Function} [disableHandler] the handler function to disable nodes (node: Node, feature: string, enabled: boolean)
     */
    syncToDom(features, enableHandler, disableHandler) {
        Object.keys(features).filter(feature => features[feature]).forEach(feature => this.enable(feature, enableHandler));
        Object.keys(features).filter(feature => !features[feature]).forEach(feature => this.disable(feature, disableHandler));
    }

}
