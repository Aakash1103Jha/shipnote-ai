# 📖 Usage Guide

## Command Palette

| Command | Description |
|---------|-------------|
| `ShipNote AI: Generate Changelog` | Generate changelog with current settings |
| `ShipNote AI: Set OpenAI API Key` | Configure your OpenAI API key securely |
| `ShipNote AI: Configure Commit Range` | Set up custom date/tag/SHA ranges |
| `ShipNote AI: Get Writing Style Recommendation` | Get AI recommendation for your project style |
| `ShipNote AI: Open Changelog Panel` | Open the interactive configuration panel |

## Interactive Panel

1. **Open the panel**: `Cmd/Ctrl + Shift + P` → `ShipNote AI: Open Changelog Panel`
2. **Configure settings**: Choose commit range, writing style, and output options
3. **Preview results**: See exactly what your changelog will look like
4. **Generate**: Create your final changelog with one click

## Writing Style Guide

**🏢 Formal Style** - Perfect for enterprise, compliance, or professional projects:
```markdown
### Features
- Implement comprehensive OAuth 2.0 authentication system with enterprise-grade security measures and audit logging compliance
```

**🔧 Dev-Friendly Style** - Ideal for developer tools, APIs, and technical projects:
```markdown
### Features
- Add OAuth 2.0 auth with JWT tokens, refresh handling, and RBAC permissions
```

**📊 PM-Style** - Great for user-facing apps and consumer products:
```markdown
### New Features
- Users can now sign in securely and manage their account settings
```

> 📚 **For detailed style guidance**: See our complete **[Writing Style Guide](../features/writing-style-guide.md)** with examples, best practices, and style selection criteria.

## Quick Generation Options

### Generate from Last N Commits
```
ShipNote AI: Generate Changelog
→ Choose "Last X commits"
→ Enter number (e.g., 10)
```

### Generate from Date Range
```
ShipNote AI: Configure Commit Range
→ Choose "Date range"
→ Enter from/to dates (YYYY-MM-DD)
```

### Generate from Tag Range
```
ShipNote AI: Configure Commit Range
→ Choose "Tag range"
→ Enter from/to tags (e.g., v1.0.0 to v1.1.0)
```

## Output Options

- **CHANGELOG.md file** - Automatically created/updated in your project root
- **Copy to clipboard** - Paste anywhere you need it
- **New editor tab** - Review before saving

[← Back to README](../README.md)
