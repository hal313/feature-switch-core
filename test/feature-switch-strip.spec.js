// TODO: Add more test cases into the strip test files
// TODO: Document how the source/expected files work
// TODO: Test passing options to the stripper

import * as FeatureSwitchStrip from '../src/feature-switch-strip';
import * as fs from 'fs';

// The directory where input files reside
const STRIP_FILES_DIR = './test/strip-files';

const readFileAsString = path => fs.readFileSync(path, 'utf-8');

const getTestStripsByExtension = extension => fs.readdirSync(STRIP_FILES_DIR).filter(name => name.match(new RegExp(`.*-source\\.${extension}\$`))).map(name => name.replace(`-source.${extension}`, ''));
// const getTestStripsByExtension = extension => ['star-comment'];
const truncateAndFlatten = (string, padding) => {
    let content = string;

    // Only truncate if the string is longer than twice the padding plus 3 (ellipsis)
    if (padding >= 0 && string.length > (2 * padding + 3)) {
        content = `${string.substring(0, padding)}...${string.substring(string.length - padding)}`;
    }
    content = content.replace(/\r?\n|\r/g, '');

    return content;
};

expect.extend({
    // Adds a matcher for comparing HTML
    toMatchHTML(received, expected) {
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

    const features = {
        'feature-one': true,
        'feature-two': false
    };

        const options = {};

    ['js', 'html', 'css'].forEach(extension => {

        describe(`Descriptors of type "${extension}"`, () => {

            getTestStripsByExtension(extension).forEach(stripDescriptor => {

                test(stripDescriptor, () => {
                    const sourceFile = `${STRIP_FILES_DIR}/${stripDescriptor}-source.${extension}`;
                    const expectedFile = `${STRIP_FILES_DIR}/${stripDescriptor}-expected.${extension}`;
                    expect(FeatureSwitchStrip.strip(readFileAsString(sourceFile), features, options)).toMatchHTML(readFileAsString(expectedFile));
                });

            });

        });


    });

});
