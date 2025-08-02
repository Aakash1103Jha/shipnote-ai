# 🧠 ShipNote AI - AI-Powered Changelog Generator

> **"Even if your commits suck, your changelog won't."**

An intelligent VS Code extension that generates clean, categorized changelogs from your Git commits using AI. It analyzes both commit messages and actual code diffs to create meaningful, well-structured release notes.

## ✨ Features

### 🔧 Smart Git Integration
- Extracts commits and diffs from your local Git repository
- Supports monorepos and subfolder projects
- Works with any Git workflow

### 🎯 Flexible Commit Range Selection
- **Last X commits** (quick generation)
- **Date ranges** (from/to specific dates)
- **Tag ranges** (between Git tags for releases)
- **SHA ranges** (between specific commits)

### 🧠 AI-Powered Analysis
- Uses OpenAI to analyze commit messages AND code diffs
- Automatically categorizes changes: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`
- Generates human-readable descriptions from cryptic commit messages
- Supports multiple writing styles: formal, dev-friendly, or PM-style

### 🖥️ Seamless VS Code Integration
- **Command Palette**: Quick access to all features
- **Webview Panel**: Advanced configuration and live preview
- **Explorer View**: Dedicated sidebar panel
- **Multiple Output Options**: Insert into CHANGELOG.md, copy to clipboard, or open in editor

### ⚙️ Highly Configurable
- Customizable changelog styles and formats
- Filter commit types to include/exclude
- Skip formatting-only commits automatically
- Group entries by author or type
- Secure API key storage

## 🚀 Getting Started

### 1. Install the Extension
- Install from VS Code Marketplace (coming soon)
- Or install manually from `.vsix` file

### 2. Set Your OpenAI API Key
```bash
Cmd/Ctrl + Shift + P → "ShipNote AI: Set OpenAI API Key"
```

### 3. Generate Your First Changelog
```bash
Cmd/Ctrl + Shift + P → "ShipNote AI: Generate Changelog"
```

## 📖 Usage

### Quick Generation
1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run "ShipNote AI: Generate Changelog"
3. Choose your output option:
   - Insert into CHANGELOG.md
   - Copy to clipboard
   - Show in new editor

### Advanced Configuration
1. Open the ShipNote AI panel in the Explorer sidebar
2. Configure commit range, style preferences, and filters
3. Use "Preview" to see results before generating
4. Click "Generate" to create the final changelog

### Available Commands

| Command | Description |
|---------|-------------|
| `ShipNote AI: Generate Changelog` | Generate changelog with default settings |
| `ShipNote AI: Set OpenAI API Key` | Configure your OpenAI API key |
| `ShipNote AI: Configure Commit Range` | Set up custom commit ranges |
| `ShipNote AI: Open Changelog Panel` | Open the advanced configuration panel |

## ⚙️ Configuration

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

### Extension Settings

```json
{
  "shipnote-ai.defaultCommitCount": 10,
  "shipnote-ai.changelogStyle": "dev-friendly",
  "shipnote-ai.outputFileName": "CHANGELOG.md",
  "shipnote-ai.includeCommitTypes": ["feat", "fix", "docs", "refactor"],
  "shipnote-ai.skipFormattingCommits": true,
  "shipnote-ai.groupByAuthor": false
}
```

### Changelog Styles

- **dev-friendly**: Clear, technical descriptions for developers
- **formal**: Professional language suitable for enterprise
- **pm-style**: User-focused explanations without technical jargon

## 🔒 Privacy & Security

- **Local-only processing**: Your code never leaves your machine except for OpenAI API calls
- **Secure key storage**: API keys stored in VS Code's secure storage
- **No external servers**: Everything runs locally in VS Code
- **Minimal data sharing**: Only commit messages and diffs sent to OpenAI

## 📝 Example Output

```markdown
## [Unreleased] - 2024-08-02

This release introduces user authentication, improves database performance, and fixes several critical bugs.

### ✨ Features
- Add JWT-based authentication system with refresh tokens (abc1234)
- Implement user profile management with avatar uploads (def5678)

### 🐛 Bug Fixes
- Fix memory leak in database connection pool (ghi9012)
- Resolve race condition in user session handling (jkl3456)

### ♻️ Refactoring
- Restructure API routes for better maintainability (mno7890)
- Optimize database queries for 40% performance improvement (pqr1234)

### 📚 Documentation
- Add comprehensive API documentation with examples (stu5678)
- Update deployment guide with Docker instructions (vwx9012)
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- VS Code 1.102.0+
- OpenAI API key

### Setup
```bash
git clone <repo-url>
cd shipnote-ai
npm install
```

### Development Commands
```bash
npm run compile          # Build the extension
npm run watch           # Watch for changes
npm run test            # Run tests
npm run lint            # Lint code
```

### Testing
Press `F5` in VS Code to launch a new Extension Development Host window with the extension loaded.

## 📋 Git Commands Reference

The extension uses these Git commands internally:

```bash
# Commits between dates
git log --since="2024-07-01" --until="2024-07-31" --pretty=format:"%H"

# Commits between tags
git log v2.2.0..v2.3.0 --pretty=format:"%H"

# Get commit details
git show <commit-hash> --unified=1
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- VS Code team for the excellent extension API
- The open-source community for inspiration and tools

---

**Happy changelog generation!** 🚀

*Made with ❤️ by the ShipNote team*

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
