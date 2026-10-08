// Lint for mistakes, not style: undefined names (a missing import breaks a screen only when that
// path runs), unused code, unreachable code and the like. ESLint's core rules only, so it runs
// with a plain `eslint` install and no presets:  npm run lint
const browser = `Blob CSS CustomEvent File FileReader FormData TextDecoder atob btoa HTMLInputElement HTMLTextAreaElement HashChangeEvent IDBKeyRange
  MediaRecorder Notification Request Response TextEncoder URL URLSearchParams addEventListener caches
  cancelAnimationFrame clearInterval clearTimeout console createImageBitmap crypto devicePixelRatio document
  fetch getComputedStyle history indexedDB innerHeight innerWidth localStorage location matchMedia navigator
  performance queueMicrotask removeEventListener requestAnimationFrame requestIdleCallback scrollX scrollY self
  sessionStorage setInterval setTimeout structuredClone window`.split(/\s+/);

const rules = Object.fromEntries([
  'no-undef', 'no-unused-vars', 'no-unreachable', 'no-dupe-keys', 'no-dupe-args', 'no-dupe-else-if',
  'no-duplicate-case', 'no-redeclare', 'no-self-assign', 'no-self-compare', 'no-const-assign',
  'no-import-assign', 'no-func-assign', 'no-unsafe-finally', 'no-unsafe-negation', 'no-unsafe-optional-chaining',
  'no-cond-assign', 'no-constant-condition', 'no-constant-binary-expression', 'no-compare-neg-zero',
  'no-sparse-arrays', 'no-loss-of-precision', 'no-empty-pattern', 'no-fallthrough', 'no-invalid-regexp',
  'no-misleading-character-class', 'no-useless-backreference', 'no-unused-private-class-members',
  'no-setter-return', 'no-async-promise-executor', 'no-shadow-restricted-names', 'no-global-assign',
  'no-delete-var', 'no-useless-catch', 'no-with', 'valid-typeof', 'use-isnan', 'getter-return',
  'for-direction', 'no-class-assign', 'no-obj-calls', 'no-new-native-nonconstructor', 'no-irregular-whitespace',
  'no-unmodified-loop-condition', 'no-unused-labels', 'no-useless-escape', 'no-extra-boolean-cast',
].map((r) => [r, 'error']));

// The tests and tools run in Node and hand functions to the page, so they see both.
const node = ['process', 'Buffer'];
const inPage = ['ClipboardEvent', 'DOMException', 'DataTransfer', 'Event', 'OffscreenCanvas', 'IDBObjectStore', 'PerformanceObserver', 'Touch', 'TouchEvent'];
const readonly = (names) => Object.fromEntries(names.map((g) => [g, 'readonly']));

export default [
  { ignores: ['node_modules/**', 'test-shots/**'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: readonly(browser) },
    rules: { ...rules, 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }] },
  },
  { files: ['tests/**', 'tools/**', '*.mjs'], languageOptions: { globals: readonly([...browser, ...node, ...inPage]) } },
];
