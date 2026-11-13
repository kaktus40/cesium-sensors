module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    // 1. Import map (script classique, bloquant) -> résout "cesium" et "@cesium/*"
    // 2. Bundles de tests ES (incluses, chargées par le navigateur)
    //    Les dépendances non-Cesium sont inlinées par esbuild.
    // 3. Cesium + @cesium : servies mais non incluses (résolues par l'import map)
    files: [
      { pattern: 'Specs/importmap-setup.js', included: true, served: true, watched: true },
      { pattern: 'Build/tests/*-bundle.js', type: 'module', included: true, served: true, watched: true },
      { pattern: 'node_modules/cesium/**/*', included: false, served: true, watched: true },
      { pattern: 'node_modules/@cesium/**/*', included: false, served: true, watched: true },
    ],

    proxies: {
      '/node_modules/': '/base/node_modules/',
    },

    preprocessors: {},

    reporters: ['spec', 'progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,

    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
        ],
      },
    },

    restartOnFileChange: false,
  });
};