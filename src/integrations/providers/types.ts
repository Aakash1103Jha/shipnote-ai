export interface ChangelogEntry {
	type: 'feat' | 'fix' | 'docs' | 'refactor' | 'style' | 'test' | 'chore';
	description: string;
	commit: CommitInfo;
}

export interface CommitInfo {
	hash: string;
	message: string;
	author: string;
	date: string;
	diff: string;
}

export interface AIProviderConfig {
	apiKey: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
}

export interface UsageStats {
	tokensUsed: number;
	requestsCount: number;
	lastRequest?: Date;
}

export interface AIProvider {
	/**
	 * Name of the AI provider
	 */
	readonly name: string;

	/**
	 * Available models for this provider
	 */
	readonly availableModels: string[];

	/**
	 * Default model for this provider
	 */
	readonly defaultModel: string;

	/**
	 * Initialize the provider with configuration
	 */
	initialize(config: AIProviderConfig): Promise<void>;

	/**
	 * Check if the provider is properly configured
	 */
	isConfigured(): boolean;

	/**
	 * Process commits into changelog entries
	 */
	processCommits(commits: CommitInfo[], style: string): Promise<ChangelogEntry[]>;

	/**
	 * Generate a summary for the changelog
	 */
	generateSummary(entries: ChangelogEntry[]): Promise<string>;

	/**
	 * Categorize a single commit
	 */
	categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']>;

	/**
	 * Enhance a commit description
	 */
	enhanceDescription(commit: CommitInfo): Promise<string>;

	/**
	 * Get usage statistics (tokens, requests, etc.)
	 */
	getUsageStats?(): Promise<UsageStats>;
}

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'offline';

export interface AIProviderFactory {
	createProvider(type: AIProviderType): AIProvider;
	getSupportedProviders(): AIProviderType[];
}
