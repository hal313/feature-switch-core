// TODO: Add more test cases into the strip test files

import * as FeatureSwitchStrip from '../src/feature-switch-strip';
import * as fs from 'fs';

// The directory where input files reside
const STRIP_FILES_DIR = './test/strip-files';

/**
 * A function to get the contents of a file as a string, based on the path.
 *
 * @param {string} path the file to read in
 * @returns {string} the contents of the file
 */
const readFileAsString = path => fs.readFileSync(path, 'utf-8');

/**
 * Gets a list of test names, based on files in STRIP_FILES_DIR. Any file which matches the pattern *-source.<i>extension</i> will be matched.
 *
 * @param {string} extension the file extension to get files for
 * @returns {string[]} an array of file names within the STRIP_FILES_DIR which match the pattern *-source.<extension>
 */
const getTestStripsByExtension = extension => fs.readdirSync(STRIP_FILES_DIR).filter(fileName => fileName.match(new RegExp(`.*-source\\.${extension}\$`))).map(fileName => fileName.replace(`-source.${extension}`, ''));

/**
 * Returns a string which is either truncated, or the full string. Strings are truncated only
 * when <i>length</i> is a positive number AND the string is longer than twice the specified
 * length plus 3 (the ellipsis). The returned string will be of the form (start...end).
 *
 * @param {string} string the string to use
 * @param {number} length the length of the string to render on each side (left and right)
 * @returns {string} the truncated string
 */
const truncateAndFlatten = (string, length) => {
    let content = string;

    // Only truncate if the string is longer than twice the padding plus 3 (ellipsis)
    if (length >= 0 && string.length > (2 * length + 3)) {
        content = `${string.substring(0, length)}...${string.substring(string.length - length)}`;
    }
    content = content.replace(/\r?\n|\r/g, '');

    return content;
};

// Extends the matchers for jest
expect.extend({
    /**
     * A matcher for HTML differences.
     *
     * @param {string} received the received value
     * @param {string} expected the expected value
     * @returns {Object} a string "message" and a boolean "pass" attribute
     */
    toMatchExpected(received, expected) {
        // Set to a positive number in order to truncate
        const padding = -1;
        const pass = received.trim() === expected.trim();
        const message = () => `expected ${truncateAndFlatten(received, padding)} to be ${truncateAndFlatten(expected, padding)}`;

        if (pass) {
            return {
                message,
                pass
            };
        } else {
            return {
                message,
                pass
            };
        }
    },
});


describe('FeatureSwitchStrip', () => {

    describe('General functionality', () => {

        const features = {
            'feature-one': true,
            'feature-two': false
        };

        // This block of code will find all files which match:
        // STRIP_FILES_DIR/*-source.<extension>
        //
        // For each match, the source file is read in as well as the expected
        // results (STRIP_FILES_DIR/*-epected.<extension>). The source is
        // fed through the stripper and the results of the strip operation are
        // matched against the HTML matcher.
        ['js', 'html', 'css'].forEach(extension => {

            describe(`Descriptors of type "${extension}"`, () => {

                getTestStripsByExtension(extension).forEach(stripDescriptor => {

                    test(stripDescriptor, () => {
                        const sourceFile = `${STRIP_FILES_DIR}/${stripDescriptor}-source.${extension}`;
                        const expectedFile = `${STRIP_FILES_DIR}/${stripDescriptor}-expected.${extension}`;
                        expect(FeatureSwitchStrip.strip(readFileAsString(sourceFile), features, {})).toMatchExpected(readFileAsString(expectedFile));
                    });

                });

            });

        });

    });

    describe('Options', () => {

        const features = {
            'feature-one': false,
            'feature-two': false
        };

        const source = `
            // FEATURE.start(feature-one)
            feature 1
            // FEATURE.end(feature-one)

            // FEATURE.start(feature-two)
            feature 2
            // FEATURE.end(feature-two)

            /*FEATURE.start(feature-one)*/feature 1/*FEATURE.end(feature-one)*/
            /*FEATURE.start(feature-two)*/feature 2/*FEATURE.end(feature-two)*/

            <feature feature-name="feature-one">feature 1</feature>
            <feature feature-name="feature-two">feature 2</feature>

            <element feature-name="feature-one">feature 1</element>
            <element feature-name="feature-two">feature 2</element>
        `.trim();

        test('should ignore replacement when specified', () => {
            // This test turns off all features and expects no replacements

            // First, validate that the source will not match itself with the default behavior
            expect(FeatureSwitchStrip.strip(source, features)).not.toMatchExpected(source);

            // Next, disable all options and verify that the source matches itself (ie: no changes)
            expect(FeatureSwitchStrip.strip(source, features, {
                starComments: {enabled: false},
                slashComments: {enabled: false},
                htmlComments: {enabled: false},
                htmlElements: {enabled: false},
                htmlAttributes: {enabled: false}
            })).toMatchExpected(source);
        });

        test('should use the replacers when specified', () => {
            // For both the actual and expected, trim and remove whitespace in order to ignore whitespace due to the formating of the string literal within code
            expect(FeatureSwitchStrip.strip(source, features, {
                starComments: {replace: 'replaced'},
                slashComments: {replace: 'replaced'},
                htmlComments: {replace: 'replaced'},
                htmlElements: {replace: 'replaced'},
                htmlAttributes: {replace: 'replaced'}
            }).trim().replace(/\s/g, '')).toMatchExpected(`
                replaced
                replaced
                replaced
                replaced
                replaced
                replaced
                replaced
                replaced
            `.trim().replace(/\s/g, ''));
        });


    });

});
