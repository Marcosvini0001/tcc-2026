module.exports = {
  allowCypressEnv: false,
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:8081',
    specPattern: 'frontend/meuApp/cypress/e2e/**/*.cy.js',
    supportFile: 'frontend/meuApp/cypress/support/e2e.js',
    setupNodeEvents(on, config) {
    },
  },
};
