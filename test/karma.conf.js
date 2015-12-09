module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'mocha',
      'chai-sinon'
    ],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/dom-scheduler/dom-scheduler.js',
      'node_modules/fxos-component/fxos-component.js',
      'fxos-fastlist.js',
      'node_modules/test-utils/src/utils.js',
      'node_modules/fxos-theme/fxos-theme.css',
      { pattern: 'test/lib/*.jpg', included: false },
      'test/test.css',
      'test/test.js'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [
      'progress',
      'coverage'
    ],

    preprocessors: {
      'fxos-fastlist.js': ['coverage']
    },

    coverageReporter: {
      type : 'lcovonly',
      dir : 'test/',
      subdir: '.'
    },

    client: {
      captureConsole: true,
      mocha: { 'ui': 'tdd' }
    },

    // enable / disable watching file and
    // executing tests whenever any file changes
    autoWatch: true,

    customLaunchers: {
      firefox_latest: {
        base: 'FirefoxNightly',
        prefs: {
          'dom.webcomponents.enabled': true,
          'dom.w3c_touch_events.enabled': 1
        }
      }
    },

    // start these browsers
    // available browser launchers:
    // https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['firefox_latest'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
