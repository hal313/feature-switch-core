import * as Context from '../src/context';

describe('Context', () => {

    // The list of function names
    const apiFunctions = ['execute', 'isTrue', 'isEnabled', 'canSet', 'canAddFeatures', 'canRemoveFeatures', 'onListenerError'];

    const generateAPIObject = () => {
        const apiObject = {};
        apiFunctions.forEach(functionName => {
            apiObject[functionName] = () => {};
        });
        return apiObject;
    };
    const generateAPIMatcher = () => {
        const apiObject = {};
        apiFunctions.forEach(functionName => {
            apiObject[functionName] = expect.any(Function);
        });
        return apiObject;
    };

    test('should return an object that has the required API functions', () => {
        // Match the tested object aginast a generated API matcher
        expect(Context.createContext()).toEqual(generateAPIMatcher());
    });

    // Test that each function passes through
    apiFunctions.forEach(apiFunctionName => {
        // Create a context object which conforms to the API
        const context = generateAPIObject();
        const createdContext = Context.createContext(null, context);

        Object.keys(context).forEach(key => {
            test(`should use the passed in function "${apiFunctionName}" when available`, () => {
                expect(createdContext[key]).toBe(context[key]);
            });
        });

    });

});
