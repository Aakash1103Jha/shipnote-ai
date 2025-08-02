# 🧠 ShipNote AI - AI-Powered Changelog Generator

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/thedevcirclespace.shipnote-ai)](https://marketplace.visualstudio.com/items?itemName=thedevcirclespace.shipnote-ai)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/thedevcirclespace.shipnote-ai)](https://marketplace.visualstudio.com/items?itemName=thedevcirclespace.shipnote-ai)

> **"Even if your commits suck, your changelog won't."**

An intelligent VS Code extension that transforms your Git commits into beautiful, professional changelogs using AI. Perfect for developers who want to ship better release notes without the manual effort.

## 🚀 Quick Start

### 📦 Installation

**Option 1: VS Code Marketplace (Recommended)**
1. Open VS Code
2. Go to Extensions (`Cmd/Ctrl + Shift + X`)
3. Search for "ShipNote AI"
4. Click Install

**Option 2: Direct Link**
- Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=thedevcirclespace.shipnote-ai)

**Option 3: Command Line**
```bash
code --install-extension thedevcirclespace.shipnote-ai
```

### ⚡ Quick Setup
1. **Set your OpenAI API key**: `Cmd/Ctrl + Shift + P` → `ShipNote AI: Set OpenAI API Key`
2. **Generate your first changelog**: `Cmd/Ctrl + Shift + P` → `ShipNote AI: Generate Changelog`

That's it! Your professional changelog is ready in seconds.

## ✨ What Makes It Special

🎨 **Smart Style Recommendations** - AI analyzes your project and suggests the perfect writing style  
🧠 **AI-Powered Enhancement** - Transforms "fix stuff" into professional descriptions  
🎯 **Flexible Ranges** - Generate from commits, dates, tags, or SHA ranges  
🖥️ **Seamless Integration** - Native VS Code experience with interactive panels  
⚙️ **Highly Configurable** - Customize everything to match your workflow  
🔒 **Privacy-First** - Your code stays local, only commit messages processed

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[📖 Installation & Setup](docs/installation.md)** | Get up and running in minutes |
| **[✨ Features Overview](docs/features.md)** | Explore all the powerful features |
| **[📖 Usage Guide](docs/usage.md)** | Learn how to use every feature |
| **[✍️ Writing Style Guide](docs/writing-style-guide.md)** | Choose the perfect changelog style |
| **[⚙️ Configuration](docs/configuration.md)** | Customize to your needs |
| **[🛠️ Development](docs/development.md)** | Contribute to the project |
| **[🔧 Troubleshooting](docs/troubleshooting.md)** | Solve common issues |
| **[🤝 Contributing](docs/contributing.md)** | Join our community |

## 🎯 Example Output

### Input (Your Commits)
```
fix: typo in readme
feat: oauth2 implementation  
chore: bump deps
```

### Output (Professional Changelog)
```markdown
## [Unreleased] - 2024-08-02

Implemented OAuth 2.0 authentication system with comprehensive security measures and resolved documentation inconsistencies. Updated project dependencies to ensure optimal performance and security.

### ✨ Features
- Implement OAuth 2.0 authentication system with JWT token support (a1b2c3d)

### 🐛 Bug Fixes  
- Fix documentation typo in project README file (e4f5g6h)

### 🔧 Maintenance
- Update project dependencies to latest stable versions (i7j8k9l)
```

## 🏗️ Architecture

Built with clean, maintainable architecture:

```
src/
├── config/          # Configuration management
├── core/            # Business logic (changelog, style recommendation)
├── integrations/    # Third-party services (Git, OpenAI)
└── webview/         # User interface components
```

- **Test-Driven Development** - 100+ comprehensive tests
- **Domain-Driven Design** - Clear separation of concerns  
- **TypeScript** - Full type safety
- **Modular** - Easy to extend and maintain

## 🌟 Supported Projects

**✅ Full Support** (with smart style recommendations):
- Node.js, React, Vue, Angular projects
- CLI tools and developer utilities
- VS Code extensions

**✅ Basic Support** (with AI enhancement):
- Any Git repository
- Python, Java, Go, Rust, C# projects
- Documentation and infrastructure repos

## 🙏 Acknowledgments

- **OpenAI** for providing the AI capabilities that power intelligent commit analysis
- **VS Code Team** for the excellent extension API and development experience

**Made with ❤️ for developers who ship great software**

[Get Started →](docs/installation.md) | [View Features →](docs/features.md)
