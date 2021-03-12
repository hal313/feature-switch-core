// FEATURE.start(feature-one)
console.log('feature-one is enabled');
// FEATURE.end(feature-one)


// Case 1: Minimum
// FEATURE.start(feature-two)
// FEATURE.end(feature-two)


// Case 2: One line
// FEATURE.start(feature-two)
console.log('feature-two enabled');
// FEATURE.end(feature-two)


// Case 3: Add some noise to the end of the comments
// FEATURE.start(feature-two)some noise
// FEATURE.end(feature-two)some noise

// FEATURE.start(feature-two) some noise
// FEATURE.end(feature-two) some noise

// FEATURE.start(feature-two)some noise
console.log('feature-two enabled');
// FEATURE.end(feature-two)some noise

// FEATURE.start(feature-two) some noise
console.log('feature-two enabled');
// FEATURE.end(feature-two) some noise


// Case 4: Add whitespace in the comments
// FEATURE.start(feature-two)

console.log('feature-two is enabled');

// FEATURE.end(feature-two)

// FEATURE.start(feature-two)some noise

console.log('feature-two is enabled');

// FEATURE.end(feature-two)some noise

// FEATURE.start(feature-two) some noise

console.log('feature-two is enabled');

// FEATURE.end(feature-two) some noise


// Case 5: Multiline code
// FEATURE.start(feature-two)
console.log('feature-two is enabled');
console.log('feature-two is enabled');
// FEATURE.end(feature-two)

// FEATURE.start(feature-two)some noise
console.log('feature-two is enabled');
console.log('feature-two is enabled');
// FEATURE.end(feature-two)some noise

// FEATURE.start(feature-two) some noise
console.log('feature-two is enabled');
console.log('feature-two is enabled');
// FEATURE.end(feature-two) some noise


// Case 6: Whitespace in multiline code
// FEATURE.start(feature-two)

console.log('feature-two is enabled');

console.log('feature-two is enabled');

// FEATURE.end(feature-two)

// FEATURE.start(feature-two)some noise

console.log('feature-two is enabled');

console.log('feature-two is enabled');

// FEATURE.end(feature-two)some noise

// FEATURE.start(feature-two) some noise

console.log('feature-two is enabled');

console.log('feature-two is enabled');

// FEATURE.end(feature-two) some noise


// FEATURE.start(feature-one)
console.log('feature-one is enabled');
// FEATURE.end(feature-one)
