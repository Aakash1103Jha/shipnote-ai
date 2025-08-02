# 🔧 Troubleshooting

## Common Issues

### ❓ "No commits found"
**Problem**: Extension reports no commits found in the specified range.

**Solutions**:
- Ensure you're in a Git repository
- Check that you have commits in the specified range
- Verify your Git configuration is correct
- Try expanding the commit range or using different date filters

### ❓ "OpenAI API Error"
**Problem**: API calls to OpenAI are failing.

**Solutions**:
- Verify your API key is valid and has sufficient credits
- Check your internet connection
- Ensure the API key has the necessary permissions
- Try regenerating your API key from OpenAI's dashboard

### ❓ "Extension not loading"
**Problem**: ShipNote AI extension isn't working or showing up.

**Solutions**:
- Reload VS Code window (`Cmd/Ctrl + Shift + P` → `Developer: Reload Window`)
- Check VS Code version compatibility (requires 1.102.0+)
- Review the Output panel for error messages
- Disable other extensions temporarily to check for conflicts

### ❓ "Changelog generation is slow"
**Problem**: Generation is taking too long.

**Solutions**:
- Reduce the number of commits being processed
- Check your internet connection (affects OpenAI API calls)
- Consider breaking large ranges into smaller chunks
- Ensure your OpenAI account has sufficient rate limits

### ❓ "Generated changelog is inaccurate"
**Problem**: AI-generated descriptions don't match the actual changes.

**Solutions**:
- Try different writing styles (formal, dev-friendly, pm-style)
- Ensure commit messages provide sufficient context
- Use the interactive panel to preview before generating
- Consider updating your commit message practices

## Debugging Steps

1. **Check VS Code Output Panel**:
   - View → Output
   - Select "ShipNote AI" from the dropdown
   - Look for error messages or warnings

2. **Verify Extension Status**:
   - Extensions view (Ctrl/Cmd + Shift + X)
   - Search for "ShipNote AI"
   - Ensure it's enabled and up to date

3. **Test with Simple Case**:
   - Try generating a changelog with just 5 recent commits
   - Use default settings
   - Check if basic functionality works

4. **Reset Configuration**:
   - Remove ShipNote AI settings from VS Code settings
   - Re-enter your OpenAI API key
   - Try with default configuration

## Getting Help

- 📖 [Read our documentation](https://github.com/your-username/shipnote-ai/wiki)
- 🐛 [Report bugs](https://github.com/your-username/shipnote-ai/issues/new?template=bug_report.md)
- 💡 [Request features](https://github.com/your-username/shipnote-ai/issues/new?template=feature_request.md)
- 💬 [Ask questions](https://github.com/your-username/shipnote-ai/discussions)

## When Reporting Issues

Please include:
- VS Code version
- Extension version
- Operating system
- Error messages from Output panel
- Steps to reproduce the issue
- Sample repository (if possible)

## 📊 Performance

ShipNote AI is optimized for performance:

- **Caching**: Style recommendations cached per project
- **Batch Processing**: Efficient AI API usage
- **Background Processing**: Non-blocking operations
- **Memory Efficient**: Minimal VS Code extension footprint

### Typical Generation Times:
- **10 commits**: ~3-5 seconds
- **50 commits**: ~10-15 seconds
- **100+ commits**: ~20-30 seconds

*Times may vary based on internet connection and OpenAI API response times.*

[← Back to README](../README.md)
