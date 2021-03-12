import { mergeDeep } from './util';

// The default options
const defaultOptions = {

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


/**
 * This is a utility method.
 *
 * @param {string} content the source
 * @param {RegExp} regex the regular expression to use
 * @param {string} replace the string to use as a replacement on any match to <i>regex</i>
 * @returns {string} a stripped string, with replacements
 */
const stripAndReplace = (content, regex, replace) => content.replace(regex, replace);

/**
 * Generates a string suitable for replacement during stripping. The string literal ${FEATURE} will
 * be replaced by the value of <i>feature</i>.
 *
 * @param {string} template the string template
 * @param {string} feature the feature name
 * @returns {string} a string which has had ${FEATURE} been replaced with the passed in feature name
 */
const generateReplacementString = (template, feature) => template.replace(/\$\{FEATURE\}/g, feature);

/**
 * Strips code between HTML comments from a file.
 *
 * A html comment is used in HTML, for example:
 * <!-- This is a slash comment -->
 *
 * Code between two specially formatted comments will be stripped out:
 * <!-- FEATURE.start(some-feature-name) -->
 * <div>some feature is enabled</div>
 * <!-- FEATURE.end(some-feature-name) -->
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {string} replace the replacement string (can include ${FEATURE}, which will be replaced with the feature name)
 * @returns a stripped string
 */
const stripHTMLComments = (content, feature, replace) => {
    // https://regex101.com/r/zNKVMO/1
    // <!--\s*\S*\s*FEATURE\.start\(feature-two\)[\s\S]*?FEATURE\.end\(feature-two\)\s*\S*\s*-->
    //
    // This regular expression looks for:
    //
    // { [start]
    //   The "<!--" string literal
    //   ANYTHING
    //   The "FEATURE.start(feature-name)" string literal
    // }
    // { [any]
    //   ANYTHING
    // }
    // { [end]
    //   The "FEATURE.end(feature-name)" string literal
    //   ANYTHING
    //   The "-->" string literal
    // }
    //

    const start = `<!--\\s*\\S*\\s*FEATURE\\.start\\(${feature}\\)`;
    const end = `FEATURE\\.end\\(${feature}\\)\\s*\\S*\\s*-->`;
    const any = `[\\s\\S]*?`;

    const regex = `${start}${any}${end}`;

    return stripAndReplace(content, new RegExp(regex, 'g'), generateReplacementString(replace, feature));
};

/**
 * Strips elements from within HTML files based on element names. This is experimental.
 *
 * An attribute is used in HTML, for example:
 *
 * Elements whose name is a feature name will be stripped out if the attributed name has a value of a disabled feature.
 * <feature-name="some-feature-name"></feature-name=>
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {string} replace the replacement string (can include ${FEATURE}, which will be replaced with the feature name)
 * @returns a stripped string
 */
const stripHTMLElements = (content, feature, replace) => {
    // https://regex101.com/r/9uVAgC/1
    // <feature-two[\s\S]*?<\/feature-two>
    //
    // This regular expression looks for:
    //
    // { [start]
    //   The "<feature-name" string literal
    // }
    // { [any]
    //   ANYTHING
    // }
    // { [end]
    //   The "</feature-name>" string literal
    // }
    //

    const start = `<${feature}`;
    const end = `<\\/${feature}>`;
    const any = `[\\s\\S]*?`;

    const regex = `${start}${any}${end}`;

    return stripAndReplace(content, new RegExp(regex, 'g'), generateReplacementString(replace, feature));
};

/**
 * Strips elements from within HTML files based on attribute values. This is experimental.
 *
 * An attribute is used in HTML, for example:
 *
 * Elements with attributes with the name "feature-name" will be stripped if the value is a disabled feature.
 * <div feature-name="some-feature-name"></div>
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {string} replace the replacement string (can include ${FEATURE}, which will be replaced with the feature name)
 * @returns a stripped string
 */
const stripHTMLAttributes = (content, feature, replace) => {
    // https://regex101.com/r/IMk3k9/1
    // <((\w|-|_)*?)(?:\s*)feature-name="?feature-two"?(?:\s*(?:(?:\w|-|_)*(?:=?"?\w*"?)?)*)*?>[\s\S]*?<\/\1>
    //
    // This regular expression looks for:
    //
    // { [start]
    //   The "<" string literal
    //   An element name (letters, numbers, hyphens and underscores) (saved as a back reference for the [end])
    //   The "feature-name="feature-name"" string literal
    //   Repeated 0 or more times: possible whitespace, attribute="value", possible whitespace
    //   The ">" string literal
    // }
    // { [any]
    //   ANYTHING
    // }
    // { [end]
    //   The "</element>" string literal (this uses a back reference to the element in the [start])
    // }
    //

    const start = `<((\\w|-|_)*?)(?:\\s*)feature-name="?${feature}"?(?:\\s*(?:(?:\\w|-|_)*(?:=?"?\\w*"?)?)*)*?>`;
    const end = `<\\/\\1>`;
    const any = `[\\s\\S]*?`;

    const regex = `${start}${any}${end}`;
    return stripAndReplace(content, new RegExp(regex, 'g'), generateReplacementString(replace, feature));
};

/**
 * Strips code between star comments from a file.
 *
 * A star comment is used in JavaScript and CSS, for example:
 * /&#42; This is a star comment &#42;/
 *
 * Code between two specially formatted strings will be stripped out:
 * /&#42; FEATURE.start(some-feature-name) &#42;/
 * console.log('some feature is enabled');
 * /&#42; FEATURE.end(some-feature-name) &#42;/
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {string} replace the replacement string (can include ${FEATURE}, which will be replaced with the feature name)
 * @returns a stripped string
 */
const stripStarComments = (content, feature, replace) => {
    // https://regex101.com/r/dTAgEV/1/
    // \/\*[\s\S]*?\*\/[\s\S]*?\/\*[\s\S]*?\*\/

    // This regular expression looks for:
    //
    // {
    //   The "/*" string literal
    //   ANYTHING
    //   The "*/" string literal
    // }
    // ANYTHING
    // {
    //   The "/*" string literal
    //   Anything
    //   The "*/" string literal
    // }
    const regex = /\/\*[\s\S]*?\*\/[\s\S]*?\/\*[\s\S]*?\*\//g;

    const START = `FEATURE\\.start\\(${feature}\\)`;
    const END = `FEATURE\\.end\\(${feature}\\)`;

    // The replacement string
    const replacementString = generateReplacementString(replace, feature);

    // Required for iterating through the matches
    let matches;
    // Keeps track of the indexes of the matches (where the matches are and how long they are)
    const matchIndexes = [];
    // The parts of the content to keep
    const contentParts = [];

    while ((matches = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (matches.index === regex.lastIndex) {
            // console.log('matches.index', matches.index);
            regex.lastIndex++;
        }

        matches.forEach((match) => { // jshint ignore:line
            if (match.match(START) && match.match(END)) {
                matchIndexes.push({index: matches.index, length: match.length});
            }
        });
    }

    // Used to keep track of the index into the content string while assembling the stripped content string
    //
    // As the match indexes is iterated, keep track of the substrings of the content string to keep
    let previousIndex = 0;
    matchIndexes.forEach(part => {
        // Keep this part
        contentParts.push(content.substring(previousIndex, part.index));
        // Now add a replacement string
        contentParts.push(replacementString);
        // Update the previous index to the end of this match
        previousIndex = part.index + part.length;
    });
    contentParts.push(content.substring(previousIndex));

    // Assemble and return the content parts into a string
    return contentParts.join('');
};

/**
 * Strips code between slash comments from a file.
 *
 * A slash comment is used in JavaScript, for example:
 * // This is a slash comment
 *
 * Code between two specially formatted strings will be stripped out:
 * // FEATURE.start(some-feature-name)
 * console.log('some feature is enabled');
 * // FEATURE.end(some-feature-name)
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {string} replace the replacement string (can include ${FEATURE}, which will be replaced with the feature name)
 * @returns a stripped string
 */
const stripSlashComments = (content, feature, replace) => {
    // https://regex101.com/r/0K5vei/1
    // (?:(?:\/\/[^\S\r\n]*FEATURE\.start\(feature-two\)[^\S\r\n]*).*$)(?:[\s\S.]*?)(?:(?:\/\/[^\S\r\n]*FEATURE\.end\(feature-two\)[^\S\r\n]*).*$)
    //
    // This regular expression looks for:
    //
    // { [start]
    //   The "//" string literal
    //   ANYTHING that is not a newline
    //   The "FEATURE.start(feature-name)" string literal
    //   ANYTHING
    //   End of line
    // }
    // { [any]
    //   ANYTHING
    // }
    // { [end]
    //   The "//" string literal
    //   ANYTHING that is not a newline
    //   The "FEATURE.end(feature-name)" string literal
    //   ANYTHING
    //   End of line
    // }
    //

    const start = `(?:(?:\\/\\/[^\\S\\r\\n]*FEATURE\\.start\\(${feature}\\)[^\\S\\r\\n]*).*$)`;
    const end = `(?:(?:\\/\\/[^\\S\\r\\n]*FEATURE\\.end\\(${feature}\\)[^\\S\\r\\n]*).*$)`;
    const any = `(?:[\\s\\S.]*?)`;
    const regexString = `${start}${any}${end}`;
    const strippedContent = content.replace(new RegExp(regexString, 'gm'), generateReplacementString(replace, feature));

    return strippedContent;
};

/**
 * Strips a string of features. Useful for pre-processing files for packaging.
 *
 * @param {string} content the content to strip
 * @param {Object} features the feature object; values are feature names and values should be boolean
 * @param {Object} [options] optional options to override (see defaultOptions)
 * @returns {string} the original string, stripped of disabled features
 */
export const strip = (content, features, options) => {

    // Merge in options
    options = mergeDeep({}, defaultOptions, options);

    // Get the features to disable
    const disabledFeatures = Object.keys(features).filter(feature => !features[feature]);

    // Strip based on options
    disabledFeatures.forEach(function (feature) {
        if (!!options.htmlComments.enabled) {
            content = stripHTMLComments(content, feature, options.htmlComments.replace);
        }

        if (!!options.htmlElements.enabled) {
            content = stripHTMLElements(content, feature, options.htmlElements.replace);
        }

        if (!!options.htmlAttributes.enabled) {
            content = stripHTMLAttributes(content, feature, options.htmlAttributes.replace);
        }

        if (!!options.starComments.enabled) {
            content = stripStarComments(content, feature, options.starComments.replace);
        }

        if (!!options.slashComments.enabled) {
            content = stripSlashComments(content, feature, options.slashComments.replace);
        }
    });

    return content;
};
