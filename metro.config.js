const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const {assetExts, sourceExts} = defaultConfig.resolver; // Get default values

  return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true, // Improve startup performance
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'), // Exclude 'svg' from assets
      sourceExts: [...sourceExts, 'svg'], // Add 'svg' to supported extensions
      extraNodeModules: {
        '~': path.resolve(__dirname, 'source'),
      },
    },
    watchFolders: [
      path.resolve(__dirname, 'source'),
      path.resolve(__dirname, 'node_modules'),
    ],
  });
};

module.exports = config();
