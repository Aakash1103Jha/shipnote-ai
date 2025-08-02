# 🛠️ Development Guide

## Prerequisites
- **Node.js** 18 or higher
- **VS Code** 1.102.0 or higher
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

## Setup
```bash
# Clone the repository
git clone https://github.com/your-username/shipnote-ai.git
cd shipnote-ai

# Install dependencies
npm install

# Build the extension
npm run compile
```

## Development Commands
```bash
npm run compile          # Build TypeScript to JavaScript
npm run watch           # Watch for changes and rebuild
npm test                # Run comprehensive test suite
npm run lint            # Lint and format code
npm start               # Launch VS Code Extension Development Host
```

## Running Tests
```bash
# Run all tests
npm test

# Run only StyleRecommendationService tests (our TDD implementation)
npm test -- --grep "StyleRecommendationService"

# Run tests with coverage
npm run test:coverage
```

## Testing the Extension
1. Press `F5` in VS Code to launch Extension Development Host
2. Open a Git repository in the new window
3. Use `Cmd/Ctrl + Shift + P` to access ShipNote AI commands
4. Test with your own commits or use the provided test repository

## 🏗️ Architecture

ShipNote AI is built with a clean, modular architecture:

```
src/
├── extension.ts              # Main extension entry point
├── config/
│   └── config.ts            # Configuration management
├── core/
│   ├── changelog.ts         # Core changelog generation logic
│   └── styleRecommendation.ts # Smart style recommendation (TDD)
├── integrations/
│   ├── git.ts               # Git CLI integration
│   └── openai.ts            # OpenAI API integration
├── webview/
│   └── ChangelogWebviewProvider.ts # Interactive panel UI
└── test/
    ├── config/              # Configuration tests
    ├── core/                # Core feature tests
    ├── integrations/        # Integration tests
    └── *.test.ts           # Extension and integration tests
```

### Design Principles

- **Separation of Concerns**: Each module has a single responsibility
- **Domain-Driven Design**: Organized by business domain (core, integrations, config)
- **Dependency Injection**: Services are injected for better testability
- **Clean Architecture**: Dependencies flow inward (integrations → core ← config)

## 🧪 Test-Driven Development

ShipNote AI is built with **Test-Driven Development (TDD)** practices:

- **100+ comprehensive tests** covering all features
- **StyleRecommendationService** fully developed using TDD methodology
- **Mirrored test structure** matching the source code organization
- **Mock-free testing** where possible for better reliability

### Test Structure
```
src/test/
├── config/
│   └── config.test.ts       # Configuration service tests
├── core/
│   ├── changelog.test.ts    # Changelog generation tests
│   └── styleRecommendation.test.ts # Style recommendation tests (TDD)
├── integrations/
│   ├── git.test.ts          # Git integration tests
│   └── openai.test.ts       # OpenAI integration tests
├── extension.test.ts        # Main extension tests
└── extension.integration.test.ts # End-to-end integration tests
```

Our commitment to TDD ensures robust, maintainable code that handles edge cases gracefully.

## Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for consistent formatting
- **Path aliases** (@/) for clean imports
- **Comprehensive error handling**

## Debugging

1. Set breakpoints in your code
2. Press `F5` to launch Extension Development Host
3. Attach VS Code debugger to the extension process
4. Debug with full TypeScript support

[← Back to README](../README.md)
