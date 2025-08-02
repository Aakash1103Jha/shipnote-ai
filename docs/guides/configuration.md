# ⚙️ Configuration

## VS Code Settings

Customize ShipNote AI through VS Code settings:

```json
{
  "shipnote-ai.defaultCommitCount": 10,
  "shipnote-ai.changelogStyle": "dev-friendly",
  "shipnote-ai.outputFileName": "CHANGELOG.md",
  "shipnote-ai.includeCommitTypes": ["feat", "fix", "docs", "refactor"],
  "shipnote-ai.skipFormattingCommits": true,
  "shipnote-ai.groupByAuthor": false,
  "shipnote-ai.defaultComparisonStrategy": "one-way",
  "shipnote-ai.includeMergeCommits": false,
  "shipnote-ai.defaultBaseBranch": "master"
}
```

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `defaultCommitCount` | `10` | Number of recent commits to analyze |
| `changelogStyle` | `"dev-friendly"` | Writing style: `formal`, `dev-friendly`, or `pm-style` |
| `outputFileName` | `"CHANGELOG.md"` | Name of the changelog file to create/update |
| `includeCommitTypes` | `["feat", "fix", "docs", "refactor"]` | Commit types to include in changelog |
| `skipFormattingCommits` | `true` | Skip commits that only change formatting/whitespace |
| `groupByAuthor` | `false` | Group changelog entries by commit author |
| `defaultComparisonStrategy` | `"one-way"` | Default strategy for branch comparison: `one-way`, `symmetric`, or `merge-base` |
| `includeMergeCommits` | `false` | Include merge commits in branch comparisons |
| `defaultBaseBranch` | `"master"` | Default base branch for comparisons (master, main, develop, etc.) |

## Accessing Settings

### Via VS Code UI
1. Open VS Code settings (`Cmd/Ctrl + ,`)
2. Search for "shipnote-ai"
3. Modify settings as needed

### Via settings.json
1. Open command palette (`Cmd/Ctrl + Shift + P`)
2. Type "Preferences: Open Settings (JSON)"
3. Add the ShipNote AI settings to your configuration

## Writing Style Configuration

### Automatic Style Detection
The extension can automatically recommend the best writing style for your project:

```
Command: ShipNote AI: Get Writing Style Recommendation
```

This analyzes your:
- Package.json keywords and description
- File patterns and project structure
- Commit history patterns

> 📚 **For detailed style examples**: See our complete **[Writing Style Guide](../features/writing-style-guide.md)** with examples and best practices.

### Manual Style Selection
You can also manually set your preferred style:

```json
{
  "shipnote-ai.changelogStyle": "formal" // or "dev-friendly" or "pm-style"
}
```

## Advanced Configuration

### Commit Type Filtering
Customize which types of commits to include:

```json
{
  "shipnote-ai.includeCommitTypes": [
    "feat",     // New features
    "fix",      // Bug fixes
    "docs",     // Documentation changes
    "refactor", // Code refactoring
    "perf",     // Performance improvements
    "test",     // Test additions/changes
    "chore"     // Maintenance tasks
  ]
}
```

### Output Customization
Configure where and how changelogs are generated:

```json
{
  "shipnote-ai.outputFileName": "RELEASE_NOTES.md",
  "shipnote-ai.groupByAuthor": true
}
```

### Branch Comparison Settings
Customize branch comparison behavior:

```json
{
  "shipnote-ai.defaultComparisonStrategy": "one-way",
  "shipnote-ai.includeMergeCommits": false,
  "shipnote-ai.defaultBaseBranch": "main"
}
```

**Comparison Strategies:**
- **`one-way`** - Show commits in target branch that are not in base branch
- **`symmetric`** - Show commits unique to both branches since they diverged  
- **`merge-base`** - Show all commits since the common ancestor

> 🌿 **Learn more**: See the **[Branch Comparison Guide](../features/branch-comparison.md)** for detailed usage examples.

## 🔒 Privacy & Security

- **Local Processing** - Your code stays on your machine
- **Secure Key Storage** - Uses VS Code's built-in secure storage
- **Minimal Data Sharing** - Only commit messages sent to OpenAI, no source code
- **No Telemetry** - Your privacy is respected

[← Back to README](../README.md)
