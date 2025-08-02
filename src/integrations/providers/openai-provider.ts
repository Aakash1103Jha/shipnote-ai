import OpenAI from 'openai';
import { BaseAIProvider } from './base-provider';
import { AIProviderConfig, ChangelogEntry, CommitInfo, UsageStats } from './types';

export class OpenAIProvider extends BaseAIProvider {
	readonly name = 'OpenAI';
	readonly availableModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini'];
	readonly defaultModel = 'gpt-3.5-turbo';

	private openai?: OpenAI;
	private usageStats: UsageStats = {
		tokensUsed: 0,
		requestsCount: 0
	};

	async initialize(config: AIProviderConfig): Promise<void> {
		this.config = config;
		this.openai = new OpenAI({
			apiKey: config.apiKey,
		});
	}

	isConfigured(): boolean {
		return !!this.config && !!this.openai;
	}

	protected async processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null> {
		if (!this.openai) {
			return null;
		}

		const prompt = this.buildCommitPrompt(commit, style);

		try {
			const response = await this.openai.chat.completions.create({
				model: this.config?.model || this.defaultModel,
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
				max_tokens: this.config?.maxTokens || 200,
				temperature: this.config?.temperature || 0.3,
			});

			// Update usage stats
			this.usageStats.tokensUsed += response.usage?.total_tokens || 0;
			this.usageStats.requestsCount++;
			this.usageStats.lastRequest = new Date();

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

	async generateSummary(entries: ChangelogEntry[]): Promise<string> {
		if (!this.isConfigured() || entries.length === 0) {
			return super.generateSummary(entries);
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
			const response = await this.openai!.chat.completions.create({
				model: this.config?.model || this.defaultModel,
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

			// Update usage stats
			this.usageStats.tokensUsed += response.usage?.total_tokens || 0;
			this.usageStats.requestsCount++;
			this.usageStats.lastRequest = new Date();

			return response.choices[0]?.message?.content?.trim() || super.generateSummary(entries);
		} catch (error) {
			console.error('Failed to generate summary:', error);
			return super.generateSummary(entries);
		}
	}

	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		if (!this.isConfigured()) {
			return super.categorizeCommit(commit);
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
			const response = await this.openai!.chat.completions.create({
				model: this.config?.model || this.defaultModel,
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

			// Update usage stats
			this.usageStats.tokensUsed += response.usage?.total_tokens || 0;
			this.usageStats.requestsCount++;
			this.usageStats.lastRequest = new Date();

			const category = response.choices[0]?.message?.content?.trim()?.toLowerCase();
			const validTypes = ['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'];
			
			return validTypes.includes(category as any) ? category as ChangelogEntry['type'] : super.categorizeCommit(commit);
		} catch (error) {
			console.error('Failed to categorize commit:', error);
			return super.categorizeCommit(commit);
		}
	}

	async enhanceDescription(commit: CommitInfo): Promise<string> {
		if (!this.isConfigured()) {
			return super.enhanceDescription(commit);
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
			const response = await this.openai!.chat.completions.create({
				model: this.config?.model || this.defaultModel,
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

			// Update usage stats
			this.usageStats.tokensUsed += response.usage?.total_tokens || 0;
			this.usageStats.requestsCount++;
			this.usageStats.lastRequest = new Date();

			const enhanced = response.choices[0]?.message?.content?.trim();
			return enhanced && enhanced.length > 0 ? enhanced : super.enhanceDescription(commit);
		} catch (error) {
			console.error('Failed to enhance description:', error);
			return super.enhanceDescription(commit);
		}
	}

	async getUsageStats(): Promise<UsageStats> {
		return { ...this.usageStats };
	}
}
