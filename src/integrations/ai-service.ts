import * as vscode from 'vscode';
import { 
	AIProvider, 
	AIProviderType, 
	AIProviderConfig, 
	ChangelogEntry, 
	CommitInfo,
	createAIProvider 
} from './providers';

export interface MultiAIConfig {
	primaryProvider: AIProviderType;
	fallbackProvider?: AIProviderType;
	providerConfigs: Record<AIProviderType, Partial<AIProviderConfig>>;
}

export class AIService {
	private providers: Map<AIProviderType, AIProvider> = new Map();
	private config: MultiAIConfig;

	constructor(
		private context: vscode.ExtensionContext,
		config?: Partial<MultiAIConfig>
	) {
		this.config = {
			primaryProvider: 'openai',
			fallbackProvider: 'offline',
			providerConfigs: {} as Record<AIProviderType, Partial<AIProviderConfig>>,
			...config
		};
	}

	/**
	 * Initialize AI service with current configuration
	 */
	async initialize(): Promise<void> {
		// Get all supported provider types
		const supportedProviders: AIProviderType[] = ['openai', 'anthropic', 'google', 'offline'];

		for (const providerType of supportedProviders) {
			try {
				const provider = createAIProvider(providerType);
				
				// Get provider configuration
				const config = await this.getProviderConfig(providerType);
				
				if (config.apiKey || providerType === 'offline') {
					await provider.initialize(config);
					this.providers.set(providerType, provider);
				}
			} catch (error) {
				console.error(`Failed to initialize ${providerType} provider:`, error);
			}
		}
	}

	/**
	 * Get the primary provider (with fallback)
	 */
	private getProvider(): AIProvider {
		// Try primary provider first
		const primary = this.providers.get(this.config.primaryProvider);
		if (primary?.isConfigured()) {
			return primary;
		}

		// Try fallback provider
		if (this.config.fallbackProvider) {
			const fallback = this.providers.get(this.config.fallbackProvider);
			if (fallback?.isConfigured()) {
				return fallback;
			}
		}

		// Last resort: offline provider
		const offline = this.providers.get('offline');
		if (offline) {
			return offline;
		}

		throw new Error('No AI provider is available');
	}

	/**
	 * Process commits using the best available provider
	 */
	async processCommits(commits: CommitInfo[], style: string): Promise<ChangelogEntry[]> {
		const provider = this.getProvider();
		return await provider.processCommits(commits, style);
	}

	/**
	 * Generate changelog summary
	 */
	async generateSummary(entries: ChangelogEntry[]): Promise<string> {
		const provider = this.getProvider();
		return await provider.generateSummary(entries);
	}

	/**
	 * Categorize a single commit
	 */
	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		const provider = this.getProvider();
		return await provider.categorizeCommit(commit);
	}

	/**
	 * Enhance commit description
	 */
	async enhanceDescription(commit: CommitInfo): Promise<string> {
		const provider = this.getProvider();
		return await provider.enhanceDescription(commit);
	}

	/**
	 * Get available providers and their status
	 */
	getProviderStatus(): Array<{
		type: AIProviderType;
		name: string;
		configured: boolean;
		models: string[];
		defaultModel: string;
	}> {
		const status: Array<{
			type: AIProviderType;
			name: string;
			configured: boolean;
			models: string[];
			defaultModel: string;
		}> = [];

		for (const [type, provider] of this.providers) {
			status.push({
				type,
				name: provider.name,
				configured: provider.isConfigured(),
				models: provider.availableModels,
				defaultModel: provider.defaultModel
			});
		}

		return status;
	}

	/**
	 * Set API key for a specific provider
	 */
	async setProviderApiKey(providerType: AIProviderType, apiKey: string): Promise<void> {
		const storageKey = `${providerType}ApiKey`;
		await this.context.secrets.store(storageKey, apiKey);

		// Reinitialize the provider with new API key
		const provider = this.providers.get(providerType);
		if (provider) {
			const config = await this.getProviderConfig(providerType);
			await provider.initialize(config);
		} else {
			// Create and initialize new provider
			const newProvider = createAIProvider(providerType);
			const config = await this.getProviderConfig(providerType);
			await newProvider.initialize(config);
			this.providers.set(providerType, newProvider);
		}
	}

	/**
	 * Get API key for a specific provider
	 */
	async getProviderApiKey(providerType: AIProviderType): Promise<string | undefined> {
		const storageKey = `${providerType}ApiKey`;
		return await this.context.secrets.get(storageKey);
	}

	/**
	 * Set primary provider
	 */
	async setPrimaryProvider(providerType: AIProviderType): Promise<void> {
		this.config.primaryProvider = providerType;
		
		// Update VS Code configuration
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		await config.update('primaryAIProvider', providerType, vscode.ConfigurationTarget.Global);
	}

	/**
	 * Get primary provider type
	 */
	getPrimaryProvider(): AIProviderType {
		return this.config.primaryProvider;
	}

	/**
	 * Set model for a specific provider
	 */
	async setProviderModel(providerType: AIProviderType, model: string): Promise<void> {
		if (!this.config.providerConfigs[providerType]) {
			this.config.providerConfigs[providerType] = {};
		}
		this.config.providerConfigs[providerType].model = model;

		// Update VS Code configuration
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		const providerModels = config.get('providerModels', {}) as Record<string, string>;
		providerModels[providerType] = model;
		await config.update('providerModels', providerModels, vscode.ConfigurationTarget.Global);

		// Reinitialize provider with new model
		const provider = this.providers.get(providerType);
		if (provider) {
			const providerConfig = await this.getProviderConfig(providerType);
			await provider.initialize(providerConfig);
		}
	}

	/**
	 * Get usage statistics for all providers
	 */
	async getUsageStatistics(): Promise<Record<AIProviderType, any>> {
		const stats: Record<string, any> = {};

		for (const [type, provider] of this.providers) {
			if (provider.getUsageStats) {
				stats[type] = await provider.getUsageStats();
			}
		}

		return stats;
	}

	/**
	 * Get provider configuration from storage and settings
	 */
	private async getProviderConfig(providerType: AIProviderType): Promise<AIProviderConfig> {
		const apiKey = await this.getProviderApiKey(providerType);
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		
		// Get provider-specific model from config
		const providerModels = config.get('providerModels', {}) as Record<string, string>;
		const model = providerModels[providerType];

		// Get common settings
		const maxTokens = config.get('aiMaxTokens', 200) as number;
		const temperature = config.get('aiTemperature', 0.3) as number;

		return {
			apiKey: apiKey || '',
			model,
			maxTokens,
			temperature,
			...this.config.providerConfigs[providerType]
		};
	}

	/**
	 * Test a provider connection
	 */
	async testProvider(providerType: AIProviderType): Promise<{ success: boolean; error?: string }> {
		try {
			const provider = this.providers.get(providerType);
			if (!provider) {
				return { success: false, error: 'Provider not found' };
			}

			if (!provider.isConfigured()) {
				return { success: false, error: 'Provider not configured' };
			}

			// Test with a simple commit
			const testCommit: CommitInfo = {
				hash: 'test123',
				message: 'test: connection test',
				author: 'Test User',
				date: new Date().toISOString(),
				diff: '+// test change'
			};

			await provider.categorizeCommit(testCommit);
			return { success: true };
		} catch (error) {
			return { 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error' 
			};
		}
	}
}
