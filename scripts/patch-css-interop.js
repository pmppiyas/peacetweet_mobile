const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'render-component.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes('const seen = new WeakSet();') && content.includes('seen.delete(value);')) {
    const brokenPattern = /function printUpgradeWarning[\s\S]*?function getDebugReplacer\(\)/;
    const safeReplacement = `function printUpgradeWarning(warning, originalProps) {
    try {
        console.warn("[CssInterop Warning] " + warning);
    } catch {}
}
function stringify(object) {
    try {
        const seen = new Set();
        return JSON.stringify(object, function (key, value) {
            if (key === 'children' || key === '_owner' || key === '_store' || key === 'stateNode' || key === 'memoizedProps' || key === 'return' || key === 'sibling' || key === 'child') {
                return typeof value === 'object' && value !== null ? '[Component/Fiber]' : value;
            }
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }
            return value;
        }, 2);
    } catch {
        return '[Unstringifiable Object]';
    }
}
function getDebugReplacer()`;
    content = content.replace(brokenPattern, safeReplacement);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-css-interop] Successfully patched react-native-css-interop render-component.js');
  } else {
    console.log('[patch-css-interop] react-native-css-interop is already patched or up-to-date.');
  }
}

const appearanceFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'appearance-observables.js'
);

if (fs.existsSync(appearanceFile)) {
  let appContent = fs.readFileSync(appearanceFile, 'utf8');
  if (appContent.includes('if (process.env.NODE_ENV === "test")')) {
    appContent = appContent.replace(
      /set\(value\)\s*\{[\s\S]*?if\s*\(process\.env\.NODE_ENV\s*===\s*"test"\)\s*\{[\s\S]*?\}\s*\},/,
      `set(value) {
        if (value === "system") {
            colorSchemeObservable.set(undefined);
            if ((react_native_1.Platform.constants?.reactNativeVersion?.minor ?? 0) >= 82) {
                appearance.setColorScheme("unspecified");
            }
            else {
                appearance.setColorScheme(null);
            }
            exports.systemColorScheme.set(resolveColorScheme(appearance.getColorScheme()));
        }
        else {
            colorSchemeObservable.set(value);
            exports.systemColorScheme.set(value);
            appearance.setColorScheme(value);
        }
    },`
    );
    fs.writeFileSync(appearanceFile, appContent, 'utf8');
    console.log('[patch-css-interop] Successfully patched appearance-observables.js for synchronous colorScheme.set');
  }
}
