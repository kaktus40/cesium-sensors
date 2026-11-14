export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        // Browser
        window: "readonly",
        document: "readonly",
        console: "readonly",
        location: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Node
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        // Cesium
        Cesium: "readonly",
        Cartesian3: "readonly",
        Matrix4: "readonly",
        Matrix3: "readonly",
        Ellipsoid: "readonly",
        JulianDate: "readonly",
        Color: "readonly",
        HeadingPitchRange: "readonly",
        Transforms: "readonly",
        Viewer: "readonly",
        CzmlDataSource: "readonly",
        Entity: "readonly",
        // Legacy Jasmine / defineSuite globals
        defineSuite: "readonly",
        jasmine: "readonly",
        describe: "readonly",
        xdescribe: "readonly",
        it: "readonly",
        xit: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        spyOn: "readonly",
        runs: "readonly",
        waits: "readonly",
        waitsFor: "readonly",
        // Test framework globals (run-tests.mjs / Jasmine)
        define: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-empty": "off",
      "no-undef": "error",
    },
  },
  {
    // Legacy Jasmine Specs use /*global */ comments and defineSuite pattern;
    // disable no-unused-vars for declared-but-implicitly-used Jasmine globals.
    files: ["Specs/**/*.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    // E2E tests use ESM imports; keep module source type.
    files: ["tests/e2e/**/*.js"],
    languageOptions: {
      sourceType: "module",
    },
  },
];
