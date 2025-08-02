# 🤝 Contributing

We welcome contributions! ShipNote AI is built with love by the community, for the community.

## Getting Started

1. **Fork the repository**  
   Click the "Fork" button on GitHub to create your own copy

2. **Clone your fork**  
   ```bash
   git clone https://github.com/your-username/shipnote-ai.git
   cd shipnote-ai
   ```

3. **Install dependencies**  
   ```bash
   npm install
   ```

4. **Create a feature branch**  
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Development Workflow

We follow **Test-Driven Development (TDD)** practices:

1. **Write tests first** - Define the expected behavior
2. **Watch tests fail** - Ensure your test actually tests something
3. **Implement the minimum code** - Make the tests pass
4. **Refactor** - Improve the code while keeping tests green
5. **Repeat** - For each new piece of functionality

### Example TDD Workflow
```bash
# 1. Write a failing test
npm test -- --grep "your feature"

# 2. Implement the feature
# Edit the source files

# 3. Verify tests pass
npm test

# 4. Run all tests to ensure no regressions
npm test
```

## Contribution Guidelines

### Code Quality
- **Follow TDD practices** - write tests first!
- **Maintain 100% test coverage** for new features
- **Use TypeScript** - leverage type safety
- **Follow ESLint rules** - run `npm run lint`
- **Update documentation** for user-facing changes

### Commit Messages
Use **conventional commits** for clear history:

```bash
feat: add style recommendation caching
fix: resolve OpenAI API timeout issues
docs: update installation guide
test: add edge cases for changelog generation
refactor: improve error handling in git service
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. **Ensure all tests pass**  
   ```bash
   npm test
   ```

2. **Update documentation**  
   - README.md if adding user-facing features
   - JSDoc comments for new public APIs
   - Update relevant docs/ files

3. **Create a clear PR description**  
   - What does this change do?
   - Why is this change needed?
   - How has it been tested?

4. **Link related issues**  
   Use "Fixes #123" or "Relates to #456"

## Areas for Contribution

### 🚀 High Priority
- **New integrations** (GitLab, Bitbucket APIs)
- **Additional AI providers** (Anthropic, Azure OpenAI)
- **Performance improvements** (caching, batching)
- **UI/UX enhancements** (better webview panels)

### 🛠️ Good First Issues
- **Bug fixes** from the issue tracker
- **Documentation improvements**
- **Test coverage improvements**
- **Code refactoring** and cleanup

### 💡 Feature Ideas
- **Custom templates** for changelog formatting
- **Team collaboration** features
- **Integration with project management tools**
- **Multi-language support** for commit analysis

## Supported Project Types

ShipNote AI works best with **JavaScript/TypeScript/Node.js** projects but provides intelligent fallbacks:

### ✅ Full Support
*With `package.json` analysis and smart style recommendations*

- Node.js applications and libraries
- React, Vue, Angular applications  
- Next.js, Nuxt.js projects
- Express, Fastify, NestJS servers
- CLI tools and developer utilities
- VS Code extensions
- Electron applications

### ✅ Basic Support  
*With Git analysis and general AI enhancement*

- Python, Java, Go, Rust, C# projects
- Static sites and documentation repos
- Configuration and infrastructure repos
- Any Git repository with commit history

## Community

- 💬 [GitHub Discussions](https://github.com/your-username/shipnote-ai/discussions) - Ask questions, share ideas
- 🐛 [GitHub Issues](https://github.com/your-username/shipnote-ai/issues) - Report bugs, request features  
- 📧 [Email](mailto:maintainer@shipnote-ai.com) - Direct contact with maintainers

## Recognition

Contributors are recognized in:
- The project README
- Release notes for their contributions
- GitHub's contributor insights
- Special badges for significant contributions

Thank you for making ShipNote AI better! 🙏

[← Back to README](../README.md)
