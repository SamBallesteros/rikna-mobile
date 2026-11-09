const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', 'dist-native/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', '.taste-skill/**', 'shots/**'] },
]);
