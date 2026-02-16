
// Mocking the logic found in client-page.tsx loadApplication
function deriveSelectedModule(app: any) {
    if (app.module) {
        return app.module;
    } else if (app.modules && app.modules.length > 0) {
        return app.modules[0].module;
    }
    return null;
}

// Mocking the summary sidebar logic
function getSummaryText(selectedModule: string | null, modules: any[]) {
    return selectedModule ? modules.find(m => m.id === selectedModule)?.label : 'Not selected';
}

const MOCK_MODULES = [
    { id: 'PERSONAL', label: 'Personal / Tourism' },
    { id: 'BUSINESS', label: 'Business / Work' }
];

// Tests
console.log('Running Fallback Logic Tests...');

// Test 1: New Schema (module field)
const appNew = { module: 'PERSONAL', modules: [] };
const result1 = deriveSelectedModule(appNew);
if (result1 === 'PERSONAL') console.log('PASS: New schema mapped correctly');
else console.error('FAIL: New schema mapping', result1);

// Test 2: Legacy Schema (modules array)
const appLegacy = { module: null, modules: [{ module: 'BUSINESS' }] };
const result2 = deriveSelectedModule(appLegacy);
if (result2 === 'BUSINESS') console.log('PASS: Legacy schema mapped correctly');
else console.error('FAIL: Legacy schema mapping', result2);

// Test 3: Undefined/Null
const appNull = { module: null, modules: [] };
const result3 = deriveSelectedModule(appNull);
if (result3 === null) console.log('PASS: Null case handled');
else console.error('FAIL: Null case', result3);

// Test 4: Summary Text
const text1 = getSummaryText('PERSONAL', MOCK_MODULES);
if (text1 === 'Personal / Tourism') console.log('PASS: Summary text found');
else console.error('FAIL: Summary text', text1);

const text2 = getSummaryText(null, MOCK_MODULES);
if (text2 === 'Not selected') console.log('PASS: Summary empty text correct');
else console.error('FAIL: Summary empty text', text2);

console.log('Tests Completed.');
