import { AIProvider, AIProviderConfig, ChangelogEntry, CommitInfo } from './types';

export abstract class BaseAIProvider implements AIProvider {
	abstract readonly name: string;
	abstract readonly availableModels: string[];
	abstract readonly defaultModel: string;

	protected config?: AIProviderConfig;
	protected client?: any;

	abstract initialize(config: AIProviderConfig): Promise<void>;

	isConfigured(): boolean {
		return !!this.config;
	}

	/**
	 * Build system prompt based on style preference
	 */
	protected getSystemPrompt(style: string): string {
		const basePrompt = `You are a changelog generator that analyzes Git commits and creates clear, structured changelog entries. Focus on what changed from a user's perspective, not implementation details.`;

		switch (style) {
			case 'formal':
				return `${basePrompt} Use formal, professional language suitable for enterprise documentation.`;
			case 'dev-friendly':
				return `${basePrompt} Use clear, concise language that developers will appreciate. Be specific about technical changes.`;
			case 'pm-style':
				return `${basePrompt} Use user-focused language that explains the impact and value of changes. Avoid technical jargon.`;
			default:
				return basePrompt;
		}
	}

	/**
	 * Build prompt for AI based on commit info
	 */
	protected buildCommitPrompt(commit: CommitInfo, style: string): string {
		// Truncate diff if it's too long
		const maxDiffLength = 1000;
		let diff = commit.diff;
		if (diff.length > maxDiffLength) {
			diff = diff.substring(0, maxDiffLength) + '\n... (truncated)';
		}

		return `Analyze this Git commit and create a changelog entry.

Commit message: "${commit.message}"
Author: ${commit.author}
Date: ${commit.date}

Code changes:
${diff}

Please respond with a JSON object containing:
- "type": one of "feat", "fix", "docs", "refactor", "style", "test", "chore"
- "description": a clear, ${style} description of what changed

Example response:
{"type": "feat", "description": "Add user authentication system with JWT tokens"}`;
	}

	/**
	 * Parse AI response into ChangelogEntry
	 */
	protected parseAIResponse(content: string, commit: CommitInfo): ChangelogEntry {
		try {
			const parsed = JSON.parse(content);
			
			// Validate the response
			const validTypes = ['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'];
			const type = validTypes.includes(parsed.type) ? parsed.type : 'chore';
			
			return {
				type,
				description: parsed.description || commit.message,
				commit
			};
		} catch (error) {
			// If parsing fails, fall back to basic processing
			console.error('Failed to parse AI response:', error);
			return this.fallbackProcessCommit(commit);
		}
	}

	/**
	 * Fallback processing when AI fails
	 */
	protected fallbackProcessCommit(commit: CommitInfo): ChangelogEntry {
		const message = commit.message.toLowerCase();
		
		let type: ChangelogEntry['type'] = 'chore';
		let description = commit.message;

		// Basic categorization
		if (message.includes('fix') || message.includes('bug') || message.includes('resolve')) {
			type = 'fix';
		} else if (message.includes('add') || message.includes('new') || message.includes('feat') || message.includes('implement')) {
			type = 'feat';
		} else if (message.includes('doc') || message.includes('readme')) {
			type = 'docs';
		} else if (message.includes('refactor') || message.includes('restructure')) {
			type = 'refactor';
		} else if (message.includes('test') || message.includes('spec')) {
			type = 'test';
		} else if (message.includes('style') || message.includes('format') || message.includes('lint')) {
			type = 'style';
		}

		// Clean up description
		description = description.charAt(0).toUpperCase() + description.slice(1);
		if (!description.endsWith('.')) {
			description += '.';
		}

		return {
			type,
			description,
			commit
		};
	}

	/**
	 * Process a batch of commits with error handling
	 */
	protected async processBatch(commits: CommitInfo[], style: string): Promise<ChangelogEntry[]> {
		const entries: ChangelogEntry[] = [];

		for (const commit of commits) {
			try {
				const entry = await this.processCommit(commit, style);
				if (entry) {
					entries.push(entry);
				}
			} catch (error) {
				console.error(`Failed to process commit ${commit.hash}:`, error);
				// Fall back to basic processing
				entries.push(this.fallbackProcessCommit(commit));
			}
		}

		return entries;
	}

	/**
	 * Process a single commit - to be implemented by providers
	 */
	protected abstract processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null>;

	/**
	 * Default implementation for processCommits
	 */
	async processCommits(commits: CommitInfo[], style: string): Promise<ChangelogEntry[]> {
		if (!this.isConfigured()) {
			throw new Error(`${this.name} provider is not configured`);
		}

		const entries: ChangelogEntry[] = [];
		
		// Process commits in batches to avoid rate limits
		const batchSize = 5;
		for (let i = 0; i < commits.length; i += batchSize) {
			const batch = commits.slice(i, i + batchSize);
			const batchEntries = await this.processBatch(batch, style);
			entries.push(...batchEntries);
		}

		return entries;
	}

	/**
	 * Default implementation for categorizeCommit
	 */
	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		if (!this.isConfigured()) {
			return this.fallbackProcessCommit(commit).type;
		}

		// To be overridden by providers that support this feature
		return this.fallbackProcessCommit(commit).type;
	}

	/**
	 * Default implementation for enhanceDescription
	 */
	async enhanceDescription(commit: CommitInfo): Promise<string> {
		if (!this.isConfigured()) {
			return this.fallbackEnhanceDescription(commit);
		}

		// To be overridden by providers that support this feature
		return this.fallbackEnhanceDescription(commit);
	}

	/**
	 * Default implementation for generateSummary
	 */
	async generateSummary(entries: ChangelogEntry[]): Promise<string> {
		if (!this.isConfigured() || entries.length === 0) {
			return this.fallbackGenerateSummary(entries);
		}

		// To be overridden by providers that support this feature
		return this.fallbackGenerateSummary(entries);
	}

	/**
	 * Fallback description enhancement when AI fails
	 */
	private fallbackEnhanceDescription(commit: CommitInfo): string {
		let description = commit.message.trim();
		
		// Capitalize first letter
		description = description.charAt(0).toUpperCase() + description.slice(1);
		
		// Remove redundant words
		description = description
			.replace(/^(feat|fix|docs|refactor|style|test|chore):\s*/i, '')
			.replace(/\s+/g, ' ')
			.trim();
		
		// Ensure it ends with a period
		if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
			description += '.';
		}
		
		return description;
	}

	/**
	 * Fallback summary generation when AI fails
	 */
	private fallbackGenerateSummary(entries: ChangelogEntry[]): string {
		if (entries.length === 0) {
			return 'This release includes various improvements and bug fixes.';
		}

		const featCount = entries.filter(e => e.type === 'feat').length;
		const fixCount = entries.filter(e => e.type === 'fix').length;
		const otherCount = entries.length - featCount - fixCount;

		let summary = 'This release includes ';
		const parts: string[] = [];

		if (featCount > 0) {
			parts.push(`${featCount} new feature${featCount > 1 ? 's' : ''}`);
		}
		if (fixCount > 0) {
			parts.push(`${fixCount} bug fix${fixCount > 1 ? 'es' : ''}`);
		}
		if (otherCount > 0) {
			parts.push(`${otherCount} other improvement${otherCount > 1 ? 's' : ''}`);
		}

		if (parts.length === 0) {
			return 'This release includes various improvements and bug fixes.';
		}

		if (parts.length > 1) {
			const lastPart = parts.pop();
			summary += parts.join(', ') + ' and ' + lastPart;
		} else {
			summary += parts[0];
		}

		return summary + '.';
	}
}
