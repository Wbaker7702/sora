import '@testing-library/jest-dom';

if (typeof global.suite === 'undefined') {
  // Align VS Code's Mocha-style test helper with Jest
  global.suite = describe;
}
