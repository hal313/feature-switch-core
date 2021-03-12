/*FEATURE.start(feature-one)*/console.log('feature-one is enabled');/*FEATURE.end(feature-one)*/

/*FEATURE.start(feature-two)*/console.log('feature-two is enabled');/*FEATURE.end(feature-two)*/

/**FEATURE.start(feature-two)
 *
 * Perhaps it is helpful to put the start/end tokens
 */
let fn = () => console.log('feature-two is enabled');
/**
 * This is the end of the feature, and the function declaration.
 *
FEATURE.end(feature-two)*/

/**
 * This is a demonstration of how the "FEATURE.start(feature-two)" string
 * can be multiple lines:
 *
 * FEATURE.start(feature-two)
 *
 * In fact, it is OK to have comments AFTER the string, too!
 *
 */
fn();
/**
 * Likewise, the feature end declaration can be multiple lines:
 *
FEATURE.end(feature-two)*/
