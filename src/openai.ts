import OpenAI from 'openai';
import { ConfigService } from '@/config';
import { CommitInfo } from '@/git';

export interface ChangelogEntry {
	type: 'feat' | 'fix' | 'docs' | 'refactor' | 'style' | 'test' | 'chore';
	description: string;
	commit: CommitInfo;
}

export class OpenAIService {
	private openai: OpenAI | null = null;

	constructor(private configService: ConfigService) {}

	/**
	 * Initialize OpenAI client with API key
	 */
	private async initializeClient(): Promise<void> {
		if (this.openai) {
			return;
		}

		const apiKey = await this.configService.getOpenAIKey();
		if (!apiKey) {
			throw new Error('OpenAI API key not configured');
		}

		this.openai = new OpenAI({
			apiKey: apiKey,
		});
	}

	/**
	 * Process commits into changelog entries using OpenAI
	 */
	async processCommits(commits: CommitInfo[]): Promise<ChangelogEntry[]> {
		await this.initializeClient();

		const entries: ChangelogEntry[] = [];
		const style = await this.configService.getChangelogStyle();

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
	 * Process a batch of commits
	 */
	private async processBatch(commits: CommitInfo[], style: string): Promise<ChangelogEntry[]> {
		if (!this.openai) {
			throw new Error('OpenAI client not initialized');
		}

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
	 * Process a single commit with OpenAI
	 */
	private async processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null> {
		if (!this.openai) {
			throw new Error('OpenAI client not initialized');
		}

		const prompt = this.buildPrompt(commit, style);

		try {
			const response = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: this.getSystemPrompt(style)
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 200,
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content?.trim();
			if (!content) {
				return this.fallbackProcessCommit(commit);
			}

			return this.parseAIResponse(content, commit);
		} catch (error) {
			console.error('OpenAI API error:', error);
			return this.fallbackProcessCommit(commit);
		}
	}

	/**
	 * Build prompt for OpenAI based on commit info
	 */
	private buildPrompt(commit: CommitInfo, style: string): string {
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
	 * Get system prompt based on style preference
	 */
	private getSystemPrompt(style: string): string {
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
	 * Parse AI response into ChangelogEntry
	 */
	private parseAIResponse(content: string, commit: CommitInfo): ChangelogEntry {
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
	private fallbackProcessCommit(commit: CommitInfo): ChangelogEntry {
		const message = commit.message.toLowerCase();
		
		let type: ChangelogEntry['type'] = 'chore';
		let description = commit.message;

		// Basic categorization
		if (message.includes('fix') || message.includes('bug')) {
			type = 'fix';
		} else if (message.includes('add') || message.includes('new') || message.includes('feat')) {
			type = 'feat';
		} else if (message.includes('doc')) {
			type = 'docs';
		} else if (message.includes('refactor')) {
			type = 'refactor';
		} else if (message.includes('test')) {
			type = 'test';
		} else if (message.includes('style') || message.includes('format')) {
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
	 * Generate a summary for the changelog
	 */
	async generateSummary(entries: ChangelogEntry[]): Promise<string> {
		await this.initializeClient();

		if (!this.openai || entries.length === 0) {
			return 'This release includes various improvements and bug fixes.';
		}

		const entriesByType = entries.reduce((acc, entry) => {
			if (!acc[entry.type]) {
				acc[entry.type] = [];
			}
			acc[entry.type].push(entry.description);
			return acc;
		}, {} as Record<string, string[]>);

		const summaryPrompt = `Create a brief, engaging summary for this changelog based on the following changes:

${Object.entries(entriesByType).map(([type, descriptions]) => 
			`${type.toUpperCase()}:\n${descriptions.map(d => `- ${d}`).join('\n')}`
		).join('\n\n')}

Write a 1-2 sentence summary that highlights the most important changes.`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: 'You are a technical writer creating engaging changelog summaries.'
					},
					{
						role: 'user',
						content: summaryPrompt
					}
				],
				max_tokens: 100,
				temperature: 0.5,
			});

			return response.choices[0]?.message?.content?.trim() || 'This release includes various improvements and bug fixes.';
		} catch (error) {
			console.error('Failed to generate summary:', error);
			return 'This release includes various improvements and bug fixes.';
		}
	}

	/**
	 * AI-powered commit categorization for ambiguous commits
	 */
	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		await this.initializeClient();

		if (!this.openai) {
			return this.fallbackCategorizeCommit(commit);
		}

		const prompt = `Analyze this Git commit and categorize it. Focus on the actual changes, not just the commit message.

Commit message: "${commit.message}"
Author: ${commit.author}
Date: ${commit.date}

Code changes:
${commit.diff.substring(0, 800)}${commit.diff.length > 800 ? '\n... (truncated)' : ''}

Respond with ONLY one of these categories:
- feat: new features or functionality
- fix: bug fixes
- docs: documentation changes
- refactor: code refactoring without changing functionality
- style: formatting, linting, whitespace changes
- test: adding or modifying tests
- chore: maintenance tasks, dependencies, build changes

Category:`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: 'You are a Git commit analyzer. Categorize commits based on their actual impact, not just the message.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 10,
				temperature: 0.1,
			});

			const category = response.choices[0]?.message?.content?.trim()?.toLowerCase();
			const validTypes = ['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'];
			
			return validTypes.includes(category as any) ? category as ChangelogEntry['type'] : this.fallbackCategorizeCommit(commit);
		} catch (error) {
			console.error('Failed to categorize commit:', error);
			return this.fallbackCategorizeCommit(commit);
		}
	}

	/**
	 * Enhance garbage commit messages with AI
	 */
	async enhanceDescription(commit: CommitInfo): Promise<string> {
		await this.initializeClient();

		if (!this.openai) {
			return this.fallbackEnhanceDescription(commit);
		}

		// If the commit message is already good, don't over-enhance it
		if (commit.message.length > 30 && /^(feat|fix|docs|refactor|style|test|chore):/i.test(commit.message)) {
			return commit.message;
		}

		const prompt = `Transform this commit into a clear, professional changelog entry. Focus on what actually changed based on the code diff.

Original commit message: "${commit.message}"
Author: ${commit.author}

Code changes:
${commit.diff.substring(0, 1000)}${commit.diff.length > 1000 ? '\n... (truncated)' : ''}

Requirements:
- Write a clear, concise description of what changed
- Focus on the user/developer impact, not implementation details
- Use active voice and present tense
- Don't include commit hash or technical jargon unless necessary
- Maximum 100 characters

Enhanced description:`;

		try {
			const response = await this.openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: 'You are a technical writer who transforms messy commit messages into clear, professional changelog entries.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 50,
				temperature: 0.3,
			});

			const enhanced = response.choices[0]?.message?.content?.trim();
			return enhanced && enhanced.length > 0 ? enhanced : this.fallbackEnhanceDescription(commit);
		} catch (error) {
			console.error('Failed to enhance description:', error);
			return this.fallbackEnhanceDescription(commit);
		}
	}

	/**
	 * Fallback categorization when AI fails
	 */
	private fallbackCategorizeCommit(commit: CommitInfo): ChangelogEntry['type'] {
		const message = commit.message.toLowerCase();
		
		if (message.includes('fix') || message.includes('bug') || message.includes('resolve')) {
			return 'fix';
		} else if (message.includes('add') || message.includes('new') || message.includes('feat') || message.includes('implement')) {
			return 'feat';
		} else if (message.includes('doc') || message.includes('readme')) {
			return 'docs';
		} else if (message.includes('refactor') || message.includes('restructure')) {
			return 'refactor';
		} else if (message.includes('test') || message.includes('spec')) {
			return 'test';
		} else if (message.includes('style') || message.includes('format') || message.includes('lint')) {
			return 'style';
		} else {
			return 'chore';
		}
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
}
