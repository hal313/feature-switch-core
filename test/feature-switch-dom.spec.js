import { FeatureSwitchDOM } from '../src/feature-switch-dom';

describe('FeatureSwitchDOM', () => {

    test('"feature-x" elements hide/show correctly', () => {

        document.body.innerHTML = `<feature-feature-one id="uut">feature 1</feature-feature-one>`;

        const fsDom = new FeatureSwitchDOM();
        const uut = document.getElementById('uut');

        // Disable the feature
        fsDom.disable('feature-one');
        // Check expectation
        expect(uut.style.display).toEqual('none');

        // Enable the feature
        fsDom.enable('feature-one');
        // Check expectation
        expect(uut.style.display).not.toEqual('none');
    });

    test('"feature name=" elements hide/show correctly', () => {

        document.body.innerHTML = `<feature name="feature-one" id="uut">feature 1</feature>`;

        const fsDom = new FeatureSwitchDOM();
        const uut = document.getElementById('uut');

        // Disable the feature
        fsDom.disable('feature-one');
        // Check expectation
        expect(uut.style.display).toEqual('none');

        // Enable the feature
        fsDom.enable('feature-one');
        // Check expectation
        expect(uut.style.display).not.toEqual('none');
    });

    test('"feature-name=" elements hide/show correctly', () => {

        document.body.innerHTML = `<div feature-name="feature-one" id="uut">feature 1</div>`;

        const fsDom = new FeatureSwitchDOM();
        const uut = document.getElementById('uut');

        // Disable the feature
        fsDom.disable('feature-one');
        // Check expectation
        expect(uut.style.display).toEqual('none');

        // Enable the feature
        fsDom.enable('feature-one');
        // Check expectation
        expect(uut.style.display).not.toEqual('none');
    });

    test('"comment=" elements hide/show correctly', () => {

        document.body.innerHTML = `
            <!-- FEATURE.start(feature-one) -->
                [<div>feature 1</div>]
            <!-- FEATURE.end(feature-one) -->
        `;

        const fsDom = new FeatureSwitchDOM();

        // Disable the feature
        fsDom.disable('feature-one');
        // Check expectation
        expect(document.body.innerHTML.trim()).toEqual('<!-- FEATURE.start(feature-one) --><div style="display: none;">feature 1</div><!-- FEATURE.end(feature-one) -->');

        // Enable the feature
        fsDom.enable('feature-one');
        // Check expectation (trim/replace whitespace to avoid string literal whitespace within code)
        expect(document.body.innerHTML.trim().replace(/\s/g, '')).toEqual(`<!-- FEATURE.start(feature-one) -->[<div style="">feature 1</div>]<!-- FEATURE.end(feature-one) -->`.trim().replace(/\s/g, ''));
    });

});
