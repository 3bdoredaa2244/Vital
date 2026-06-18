module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // No explicit 'react-native-reanimated/plugin' here: babel-preset-expo
    // auto-adds it (Reanimated is installed) and nativewind/babel adds it via
    // react-native-css-interop. Listing it again risks a triple-registered
    // worklets transform. The Reanimated 3 plugin must also be last, which the
    // Expo preset guarantees.
  };
};
