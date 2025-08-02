# Writing Style Guide for AI Changelog Generator

## 🎯 **How to Choose the Right Writing Style**

The writing style determines how your changelog communicates with your audience. Here's when to use each style:

### 📊 **Style Comparison Examples**

**Example Commit:** `fix: resolve memory leak in user session management`

| Style | Output | Best For |
|-------|--------|----------|
| **Formal** | "Resolved memory allocation issue in user session management system to improve application stability." | Enterprise docs, official releases, compliance reports |
| **Dev-Friendly** | "Fix memory leak in user session cleanup that was causing gradual performance degradation." | Open source projects, technical teams, developer-focused products |
| **PM-Style** | "Improved app performance by fixing an issue that could slow down the application over time." | Product announcements, user-facing releases, stakeholder updates |

---

## 🏢 **Formal Style**
**Perfect for:** Enterprise software, regulated industries, official documentation

**Characteristics:**
- Professional, polished language
- Focuses on business impact and stability
- Avoids casual language or slang
- Emphasizes reliability and compliance

**Example Transformations:**
```
Commit: "add oauth login stuff"
→ "Implemented OAuth 2.0 authentication system to enhance security and user access management."

Commit: "fix broken api endpoint"  
→ "Resolved API endpoint compatibility issue to ensure consistent service availability."
```

---

## 👨‍💻 **Dev-Friendly Style** 
**Perfect for:** Open source projects, technical teams, developer tools

**Characteristics:**
- Clear, concise technical language
- Includes specific technical details when relevant
- Uses developer terminology appropriately
- Focuses on implementation and technical impact

**Example Transformations:**
```
Commit: "refactor user auth"
→ "Refactor user authentication flow to improve code maintainability and reduce complexity."

Commit: "bump deps"
→ "Update dependencies to latest stable versions for security patches and performance improvements."
```

---

## 📱 **PM-Style**
**Perfect for:** Product announcements, user-facing releases, executive summaries

**Characteristics:**
- User-focused language explaining benefits
- Avoids technical jargon
- Emphasizes value and impact to end users
- Business-friendly terminology

**Example Transformations:**
```
Commit: "optimize db queries"
→ "Improved app speed and responsiveness for a better user experience."

Commit: "add dark mode toggle"
→ "Added dark mode option to reduce eye strain and provide personalized viewing preferences."
```

---

## 🤖 **Smart Style Recommendations**

Our extension analyzes your project context to recommend the best writing style:

### 🔍 **Analysis Factors**
- **Package.json keywords**: Detects "enterprise", "business", "consumer", "developer"
- **Repository patterns**: Checks for compliance docs, user-facing apps, dev tools
- **Commit patterns**: Analyzes typical commit message formality
- **Team size**: Considers contributor count and collaboration patterns

### 📋 **Recommendation Logic**

```typescript
// Formal Style Indicators
- package.json contains: "enterprise", "compliance", "banking", "healthcare"
- Has files: COMPLIANCE.md, SECURITY.md, AUDIT.md
- Long commit messages with formal language
- Large team with strict PR processes

// Dev-Friendly Style Indicators  
- package.json contains: "cli", "framework", "library", "developer-tools"
- Has files: CONTRIBUTING.md, API.md, technical documentation
- Conventional commits with technical details
- Active open-source community

// PM-Style Indicators
- package.json contains: "app", "mobile", "web", "user", "consumer"
- Has files: ROADMAP.md, user-facing documentation
- Simple, user-focused commit messages
- Product-oriented repository structure
```

### 🎯 **Quick Decision Guide**

**Choose Formal if:**
- Your software handles sensitive data (finance, healthcare, legal)
- You need regulatory compliance documentation
- Your audience includes executives or compliance officers
- You work in enterprise B2B environments

**Choose Dev-Friendly if:**
- You're building developer tools, APIs, or frameworks
- Your primary audience is other developers
- You maintain open-source projects
- Technical accuracy is more important than accessibility

**Choose PM-Style if:**
- You're building consumer applications
- Your changelog will be shown to end users
- You need to communicate value to non-technical stakeholders
- You're focusing on user benefits over implementation details

---

## 🚀 **Implementation in Extension**

The extension will automatically recommend a style when you first use it, but you can always override the recommendation in settings or during configuration.

[← Back to README](../README.md)
