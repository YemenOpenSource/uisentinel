# 🤝 Contributing to UISentinel

Thank you for your interest in contributing to UISentinel! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

There are many ways to contribute to UISentinel:

- 🐛 **Report bugs** - Found an issue? Let us know!
- ✨ **Suggest features** - Have an idea? Share it!
- 📖 **Improve documentation** - Help others understand UISentinel
- 🔧 **Fix bugs** - Submit a pull request
- ⚡ **Add features** - Implement new capabilities
- 🧪 **Write tests** - Improve code coverage
- 🎨 **Add examples** - Show how to use UISentinel

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Setup Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/uisentinel.git
   cd uisentinel
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Link for local testing:**
   ```bash
   npm link
   ```

6. **Run tests:**
   ```bash
   npm test
   ```

Now you can use `uisentinel` commands locally with your changes!

## 📝 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Build the project
npm run build

# Run tests
npm test

# Test CLI commands manually
uisentinel fullpage -u https://example.com
uisentinel check-accessibility -u https://example.com
```

### 4. Commit Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add color blindness simulation"
# or
git commit -m "fix: resolve layout overflow detection"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Link to related issues
- Screenshots/examples if applicable

## 🎨 Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Document public APIs with JSDoc

Example:
```typescript
/**
 * Capture full page screenshot
 * @param url - The URL to capture
 * @param options - Capture options
 * @returns Screenshot path and metadata
 */
async captureFullPage(
  url: string,
  options: CaptureOptions = {}
): Promise<CaptureResult> {
  // Implementation
}
```

### Code Organization

```
src/
├── index.ts              # Main UISentinel class
├── cli.ts                # CLI commands
├── browser-engine.ts     # Browser automation
├── extensions/           # Browser extensions
│   ├── element-inspector.ts
│   └── responsive-design-inspector.ts
└── types.ts              # TypeScript types
```

### Formatting

We use consistent formatting:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons at end of statements
- Trailing commas in objects/arrays

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/browser-engine.test.ts

# Run with coverage
npm run test:coverage
```

### Writing Tests

Add tests for:
- New features
- Bug fixes
- Edge cases

Example test:
```typescript
import { describe, it, expect } from 'vitest';
import { UISentinel } from './index';

describe('UISentinel', () => {
  it('should capture full page screenshot', async () => {
    const sentinel = new UISentinel();
    await sentinel.start();

    const result = await sentinel.captureFullPage('https://example.com');

    expect(result.screenshot).toBeDefined();
    expect(result.metadata).toBeDefined();

    await sentinel.close();
  });
});
```

## 📚 Documentation

### Update Documentation For:

- New commands → Update `docs/COMMANDS.md`
- Configuration changes → Update `README.md` and `docs/CONFIGURATION.md`
- New features → Update relevant docs
- Breaking changes → Add migration guide

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots when helpful
- Link to related docs

## 🐛 Bug Reports

### Before Submitting

1. Search existing issues
2. Check if it's already fixed in `main` branch
3. Try to reproduce with minimal example

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- OS: [e.g. macOS 13.0]
- Node version: [e.g. 18.17.0]
- UISentinel version: [e.g. 0.2.1]

**Additional context**
Any other relevant information.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
**Is your feature related to a problem?**
Describe the problem or use case.

**Describe the solution**
What you want to happen.

**Describe alternatives**
Alternative solutions you've considered.

**Additional context**
Any other relevant information, mockups, examples, etc.
```

## 🔍 Pull Request Process

### PR Checklist

Before submitting:

- [ ] Code builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No console errors/warnings
- [ ] Code follows style guide
- [ ] Commits are clear and descriptive

### PR Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be included in next release! 🎉

## 🎯 Good First Issues

Looking for where to start? Check out issues labeled:

- `good first issue` - Perfect for newcomers
- `help wanted` - We'd love your help
- `documentation` - Improve docs
- `examples` - Add usage examples

## 💡 Ideas for Contributions

### High Priority

- 🔥 **Color blindness simulation** - Add accessibility feature
- 🔥 **Real device testing** - BrowserStack/Sauce Labs integration
- 🔥 **GitHub Actions** - Official CI/CD action
- **VS Code Extension** - Native IDE integration
- **Learning mode** - Educational explanations

### Framework Support

- Add support for Remix
- Add support for Nuxt.js
- Improve Next.js app router support

### Documentation

- Add video tutorials
- Create framework-specific guides
- Improve API documentation
- Add more examples

### Testing

- Increase test coverage
- Add integration tests
- Add E2E tests

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## ❓ Questions?

- 💬 **Discussions**: [GitHub Discussions](https://github.com/mhjabreel/uisentinel/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/mhjabreel/uisentinel/issues)
- 📧 **Email**: Contact maintainers for private questions

---

**Thank you for contributing to UISentinel!** 🎉

Every contribution, no matter how small, makes a difference. We're excited to see what you build!
