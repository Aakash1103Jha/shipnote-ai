import { BaseAIProvider } from './base-provider';
import { AIProviderConfig, ChangelogEntry, CommitInfo, UsageStats } from './types';
import { sanitizeErrorMessage } from './error-sanitizer';

// Google Gemini API types (simplified)
interface GeminiContent {
	role: 'user' | 'model';
	parts: Array<{ text: string }>;
}

interface GeminiResponse {
	candidates: Array<{
		content: {
			parts: Array<{ text: string }>;
		};
	}>;
	usageMetadata?: {
		totalTokenCount: number;
		promptTokenCount: number;
		candidatesTokenCount: number;
	};
}

export class GoogleProvider extends BaseAIProvider {
	readonly name = 'Google Gemini';
	readonly availableModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
	readonly defaultModel = 'gemini-1.5-flash';

	private apiKey?: string;
	private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
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
			const response = await this.makeGeminiRequest([
				{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
			]);

			const content = response.candidates[0]?.content?.parts[0]?.text?.trim();
			if (!content) {
				return this.fallbackProcessCommit(commit);
			}

			return this.parseAIResponse(content, commit);
		} catch (error) {
			console.error('Google Gemini API error:', error);
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

		const summaryPrompt = `You are a technical writer creating engaging changelog summaries.

Create a brief, engaging summary for this changelog based on the following changes:

${Object.entries(entriesByType).map(([type, descriptions]) => 
			`${type.toUpperCase()}:\n${descriptions.map(d => `- ${d}`).join('\n')}`
		).join('\n\n')}

Write a 1-2 sentence summary that highlights the most important changes.`;

		try {
			const response = await this.makeGeminiRequest([
				{ role: 'user', parts: [{ text: summaryPrompt }] }
			]);

			return response.candidates[0]?.content?.parts[0]?.text?.trim() || super.generateSummary(entries);
		} catch (error) {
			console.error('Failed to generate summary:', error);
			return super.generateSummary(entries);
		}
	}

	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		if (!this.isConfigured()) {
			return super.categorizeCommit(commit);
		}

		const prompt = `You are a Git commit analyzer. Categorize commits based on their actual impact, not just the message.

Analyze this Git commit and categorize it. Focus on the actual changes, not just the commit message.

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
			const response = await this.makeGeminiRequest([
				{ role: 'user', parts: [{ text: prompt }] }
			]);

			const category = response.candidates[0]?.content?.parts[0]?.text?.trim()?.toLowerCase();
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

		const prompt = `You are a technical writer who transforms messy commit messages into clear, professional changelog entries.

Transform this commit into a clear, professional changelog entry. Focus on what actually changed based on the code diff.

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
			const response = await this.makeGeminiRequest([
				{ role: 'user', parts: [{ text: prompt }] }
			]);

			const enhanced = response.candidates[0]?.content?.parts[0]?.text?.trim();
			return enhanced && enhanced.length > 0 ? enhanced : super.enhanceDescription(commit);
		} catch (error) {
			console.error('Failed to enhance description:', error);
			return super.enhanceDescription(commit);
		}
	}

	async getUsageStats(): Promise<UsageStats> {
		return { ...this.usageStats };
	}

	private async makeGeminiRequest(contents: GeminiContent[]): Promise<GeminiResponse> {
		if (!this.apiKey) {
			throw new Error('Google API key not configured');
		}

		const model = this.config?.model || this.defaultModel;
		const url = `${this.baseURL}/${model}:generateContent?key=${this.apiKey}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents,
				generationConfig: {
					temperature: this.config?.temperature || 0.3,
					maxOutputTokens: this.config?.maxTokens || 200,
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			const sanitizedError = sanitizeErrorMessage(errorText);
			throw new Error(`Google Gemini API error: ${response.status} ${sanitizedError}`);
		}

		const result = await response.json() as GeminiResponse;

		// Update usage stats
		if (result.usageMetadata) {
			this.usageStats.tokensUsed += result.usageMetadata.totalTokenCount;
		}
		this.usageStats.requestsCount++;
		this.usageStats.lastRequest = new Date();

		return result;
	}
}
