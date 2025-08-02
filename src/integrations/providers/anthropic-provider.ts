import { BaseAIProvider } from './base-provider';
import { AIProviderConfig, ChangelogEntry, CommitInfo, UsageStats } from './types';

// Anthropic Claude API types (simplified)
interface AnthropicMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface AnthropicResponse {
	content: Array<{ text: string }>;
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

export class AnthropicProvider extends BaseAIProvider {
	readonly name = 'Anthropic Claude';
	readonly availableModels = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'];
	readonly defaultModel = 'claude-3-5-sonnet-20241022';

	private apiKey?: string;
	private baseURL = 'https://api.anthropic.com/v1/messages';
	private usageStats: UsageStats = {
		tokensUsed: 0,
		requestsCount: 0
	};

	async initialize(config: AIProviderConfig): Promise<void> {
		this.config = config;
		this.apiKey = config.apiKey;
	}

	isConfigured(): boolean {
		return !!this.config && !!this.apiKey;
	}

	protected async processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null> {
		if (!this.isConfigured()) {
			return null;
		}

		const prompt = this.buildCommitPrompt(commit, style);
		const systemPrompt = this.getSystemPrompt(style);

		try {
			const response = await this.makeAnthropicRequest([
				{ role: 'user', content: `${systemPrompt}\n\n${prompt}` }
			]);

			const content = response.content[0]?.text?.trim();
			if (!content) {
				return this.fallbackProcessCommit(commit);
			}

			return this.parseAIResponse(content, commit);
		} catch (error) {
			console.error('Anthropic API error:', error);
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
			const response = await this.makeAnthropicRequest([
				{ role: 'user', content: `You are a technical writer creating engaging changelog summaries.\n\n${summaryPrompt}` }
			], 100);

			return response.content[0]?.text?.trim() || super.generateSummary(entries);
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
			const response = await this.makeAnthropicRequest([
				{ role: 'user', content: `You are a Git commit analyzer. Categorize commits based on their actual impact, not just the message.\n\n${prompt}` }
			], 10);

			const category = response.content[0]?.text?.trim()?.toLowerCase();
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
			const response = await this.makeAnthropicRequest([
				{ role: 'user', content: `You are a technical writer who transforms messy commit messages into clear, professional changelog entries.\n\n${prompt}` }
			], 50);

			const enhanced = response.content[0]?.text?.trim();
			return enhanced && enhanced.length > 0 ? enhanced : super.enhanceDescription(commit);
		} catch (error) {
			console.error('Failed to enhance description:', error);
			return super.enhanceDescription(commit);
		}
	}

	async getUsageStats(): Promise<UsageStats> {
		return { ...this.usageStats };
	}

	private async makeAnthropicRequest(messages: AnthropicMessage[], maxTokens: number = 200): Promise<AnthropicResponse> {
		if (!this.apiKey) {
			throw new Error('Anthropic API key not configured');
		}

		const response = await fetch(this.baseURL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: this.config?.model || this.defaultModel,
				max_tokens: maxTokens,
				temperature: this.config?.temperature || 0.3,
				messages
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
		}

		const result = await response.json() as AnthropicResponse;

		// Update usage stats
		if (result.usage) {
			this.usageStats.tokensUsed += result.usage.input_tokens + result.usage.output_tokens;
		}
		this.usageStats.requestsCount++;
		this.usageStats.lastRequest = new Date();

		return result;
	}
}
