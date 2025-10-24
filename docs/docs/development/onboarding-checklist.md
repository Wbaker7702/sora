---
title: Developer Onboarding Checklist
sidebar_label: Onboarding Checklist
---

# Developer Onboarding Checklist

Welcome to the Sora project! This checklist will guide you through setting up your development environment and getting started with contributing to Sora.

## Pre-Development Setup

### ✅ System Requirements
- [ ] **Operating System**: macOS, Linux, or Windows (WSL2)
- [ ] **Node.js**: Version 20 or higher
- [ ] **Package Manager**: npm or yarn
- [ ] **Git**: Latest version
- [ ] **Code Editor**: VS Code (recommended) or your preferred editor

### ✅ Account Setup
- [ ] **GitHub Account**: Create or use existing account
- [ ] **Discord Account**: Join the [Stellar Developer Discord](https://discord.gg/stellardev)
- [ ] **Soroban CLI**: Install for testing (optional but recommended)

## Development Environment Setup

### ✅ Repository Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/sora.git
cd sora

# 3. Add upstream remote
git remote add upstream https://github.com/tolgayayci/sora.git

# 4. Verify remotes
git remote -v
```

### ✅ Environment Setup
```bash
# 1. Run automated setup
npm run setup

# 2. Verify installation
npm run test
npm run lint
npm run type-check

# 3. Start development server
npm run dev
```

### ✅ VS Code Setup (Recommended)
- [ ] **Install VS Code Extensions**:
  - [ ] ES7+ React/Redux/React-Native snippets
  - [ ] TypeScript Importer
  - [ ] Prettier - Code formatter
  - [ ] ESLint
  - [ ] Tailwind CSS IntelliSense
  - [ ] GitLens
  - [ ] Thunder Client (for API testing)

- [ ] **Configure VS Code Settings**:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "typescript.preferences.importModuleSpecifier": "relative"
  }
  ```

## Understanding the Codebase

### ✅ Project Structure
- [ ] **Main Process** (`main/`): Electron main process code
- [ ] **Renderer** (`renderer/`): React/Next.js frontend code
- [ ] **Types** (`types/`): TypeScript type definitions
- [ ] **Scripts** (`scripts/`): Build and deployment scripts
- [ ] **Docs** (`docs/`): Documentation and guides

### ✅ Key Technologies
- [ ] **Electron**: Desktop application framework
- [ ] **Next.js**: React framework for the renderer
- [ ] **TypeScript**: Type-safe JavaScript
- [ ] **Tailwind CSS**: Utility-first CSS framework
- [ ] **Radix UI**: Accessible component library
- [ ] **React Hook Form**: Form handling
- [ ] **Zod**: Schema validation

### ✅ Architecture Understanding
- [ ] **IPC Communication**: How main and renderer processes communicate
- [ ] **State Management**: How application state is managed
- [ ] **Routing**: How navigation works in the app
- [ ] **Styling**: How Tailwind CSS is configured
- [ ] **Build Process**: How the app is built for different platforms

## Development Workflow

### ✅ Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add your feature"

# 3. Push to your fork
git push origin feature/your-feature-name

# 4. Create pull request on GitHub
```

### ✅ Code Quality
- [ ] **Linting**: Run `npm run lint` before committing
- [ ] **Type Checking**: Run `npm run type-check` before committing
- [ ] **Testing**: Run `npm run test` before committing
- [ ] **Formatting**: Use Prettier for consistent code formatting

### ✅ Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- --testPathPattern=Button.test.tsx
```

## First Contribution

### ✅ Choose Your First Issue
- [ ] **Good First Issues**: Look for issues labeled "good first issue"
- [ ] **Bug Reports**: Fix a bug or improve error handling
- [ ] **Documentation**: Improve or add documentation
- [ ] **Testing**: Add tests for existing functionality

### ✅ Development Process
1. [ ] **Read the Issue**: Understand what needs to be done
2. [ ] **Ask Questions**: Comment on the issue if you need clarification
3. [ ] **Create Branch**: Create a feature branch for your work
4. [ ] **Make Changes**: Implement your changes
5. [ ] **Test Changes**: Ensure your changes work correctly
6. [ ] **Submit PR**: Create a pull request with a clear description

### ✅ Pull Request Guidelines
- [ ] **Clear Title**: Use a descriptive title
- [ ] **Description**: Explain what changes you made and why
- [ ] **Testing**: Describe how you tested your changes
- [ ] **Screenshots**: Include screenshots for UI changes
- [ ] **Breaking Changes**: Note any breaking changes

## Advanced Setup

### ✅ Soroban CLI Integration
```bash
# Install Rust (required for Soroban CLI)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Soroban CLI
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

### ✅ Development Tools
- [ ] **React Developer Tools**: Browser extension for debugging
- [ ] **Redux DevTools**: For state management debugging
- [ ] **Electron DevTools**: Built-in developer tools
- [ ] **Network Tab**: For API debugging

### ✅ Build and Deploy
```bash
# Build for current platform
npm run build

# Build for all platforms
npm run build:all

# Deploy locally
npm run deploy:local
```

## Community and Support

### ✅ Join the Community
- [ ] **Discord**: Join the [Stellar Developer Discord](https://discord.gg/stellardev)
- [ ] **GitHub Discussions**: Participate in project discussions
- [ ] **Code Reviews**: Review other contributors' pull requests
- [ ] **Issue Triage**: Help with issue management

### ✅ Documentation
- [ ] **Read the Docs**: Familiarize yourself with the documentation
- [ ] **Update Docs**: Keep documentation up to date with your changes
- [ ] **Write Guides**: Share your knowledge with the community

### ✅ Best Practices
- [ ] **Code Style**: Follow the project's coding standards
- [ ] **Commit Messages**: Use conventional commit messages
- [ ] **Pull Requests**: Keep PRs focused and well-documented
- [ ] **Communication**: Be respectful and helpful in discussions

## Troubleshooting

### ✅ Common Issues
- [ ] **Node.js Version**: Ensure you're using Node.js 20+
- [ ] **Dependencies**: Run `npm ci` to install dependencies
- [ ] **Build Issues**: Check the [troubleshooting guide](../troubleshooting/common-issues.md)
- [ ] **Test Failures**: Run tests individually to identify issues

### ✅ Getting Help
- [ ] **GitHub Issues**: Search existing issues or create new ones
- [ ] **Discord**: Ask questions in the community Discord
- [ ] **Documentation**: Check the comprehensive documentation
- [ ] **Code Examples**: Look at existing code for patterns

## Next Steps

### ✅ After Onboarding
- [ ] **Contribute Regularly**: Make regular contributions to the project
- [ ] **Mentor Others**: Help new contributors get started
- [ ] **Propose Features**: Suggest new features and improvements
- [ ] **Maintain Areas**: Take ownership of specific areas of the codebase

### ✅ Long-term Goals
- [ ] **Core Contributor**: Become a core contributor
- [ ] **Maintainer**: Help maintain the project
- [ ] **Community Leader**: Lead community initiatives
- [ ] **Expert**: Become an expert in Soroban development

## Resources

### ✅ Documentation
- [Sora Documentation](https://github.com/tolgayayci/sora/docs)
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### ✅ Tools and Resources
- [VS Code](https://code.visualstudio.com/)
- [GitHub](https://github.com/)
- [Discord](https://discord.gg/stellardev)
- [Stellar Developer Resources](https://developers.stellar.org/)

### ✅ Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Electron Tutorial](https://www.electronjs.org/docs/tutorial/quick-start)

---

## Checklist Summary

- [ ] **System Setup**: All required tools installed
- [ ] **Repository Setup**: Forked and cloned repository
- [ ] **Environment Setup**: Development environment configured
- [ ] **Code Understanding**: Familiar with codebase structure
- [ ] **First Contribution**: Made your first contribution
- [ ] **Community Engagement**: Active in community discussions
- [ ] **Documentation**: Up-to-date with project documentation

**Congratulations!** You're now ready to contribute to the Sora project. Welcome to the team! 🎉

---

*This checklist is a living document. If you find something missing or have suggestions for improvement, please create an issue or submit a pull request.*