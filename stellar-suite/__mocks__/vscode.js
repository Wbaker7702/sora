const noop = () => {};

class Disposable {
  dispose() {}
}

module.exports = {
  window: {
    showInformationMessage: noop,
    showWarningMessage: noop,
    showErrorMessage: noop,
  },
  commands: {
    registerCommand: noop,
    executeCommand: async () => undefined,
  },
  workspace: {
    getConfiguration: () => ({ get: () => undefined }),
  },
  Disposable,
};
