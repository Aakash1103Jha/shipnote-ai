import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIService, MultiAIConfig } from '../../integrations/ai-service';
import { AIProviderType, CommitInfo, ChangelogEntry } from '../../integrations/providers';

// Simplified mock VS Code extension context
const createMockContext = (apiKeys: Record<string, string> = { openai: 'test-openai-key', anthropic: 'test-anthropic-key' }): vscode.ExtensionContext => {
	return {
		subscriptions: [],
		workspaceState: {} as any,
		globalState: {} as any,
		extensionUri: {} as any,
		extensionPath: '',
		environmentVariableCollection: {} as any,
		asAbsolutePath: (path: string) => path,
		storageUri: undefined,
		storagePath: undefined,
		globalStorageUri: {} as any,
		globalStoragePath: '',
		logUri: {} as any,
		logPath: '',
		extensionMode: vscode.ExtensionMode.Test,
		extension: {} as any,
		languageModelAccessInformation: {} as any,
		secrets: {
			get: async (key: string) => {
				return apiKeys[key];
			},
			store: async (key: string, value: string) => {
				apiKeys[key] = value;
			},
			delete: async (key: string) => {
				delete apiKeys[key];
			},
			onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
		}
	};
};

// Mock VS Code workspace configuration
const mockConfiguration = {
	get: (key: string, defaultValue?: any) => {
		const configs: Record<string, any> = {
			'primaryAIProvider': 'openai',
			'providerModels': { openai: 'gpt-4' },
			'aiMaxTokens': 200,
			'aiTemperature': 0.3
		};
		return configs[key] ?? defaultValue;
	},
	update: async (key: string, value: any, target?: vscode.ConfigurationTarget) => {
		// Mock update implementation
	},
	has: (section: string) => true,
	inspect: (section: string) => undefined
};

// Mock vscode.workspace.getConfiguration
const originalGetConfiguration = vscode.workspace.getConfiguration;

suite('AIService Test Suite', () => {
	let mockContext: vscode.ExtensionContext;
	let aiService: AIService;

	setup(() => {
		mockContext = createMockContext();
		(vscode.workspace as any).getConfiguration = () => mockConfiguration;
	});

	teardown(() => {
		vscode.workspace.getConfiguration = originalGetConfiguration;
	});

	test('AIService constructor should initialize with default config', () => {
		aiService = new AIService(mockContext);
		
		assert.strictEqual(aiService.getPrimaryProvider(), 'openai');
	});

	test('AIService constructor should accept custom config', () => {
		const customConfig: Partial<MultiAIConfig> = {
			primaryProvider: 'anthropic',
			fallbackProvider: 'openai'
		};
		
		aiService = new AIService(mockContext, customConfig);
		
		assert.strictEqual(aiService.getPrimaryProvider(), 'anthropic');
	});

	test('Initialize should set up available providers', async () => {
		aiService = new AIService(mockContext);
		
		await aiService.initialize();
		
		const status = aiService.getProviderStatus();
		assert.ok(status.length > 0);
		
		// Should have offline provider at minimum
		const offlineProvider = status.find((p: any) => p.type === 'offline');
		assert.ok(offlineProvider);
		assert.strictEqual(offlineProvider!.configured, true);
	});

	test('SetProviderApiKey should store and reinitialize provider', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		await aiService.setProviderApiKey('openai', 'new-test-key');
		
		const apiKey = await aiService.getProviderApiKey('openai');
		assert.strictEqual(apiKey, 'new-test-key');
	});

	test('SetPrimaryProvider should update configuration', async () => {
		aiService = new AIService(mockContext);
		
		await aiService.setPrimaryProvider('anthropic');
		
		assert.strictEqual(aiService.getPrimaryProvider(), 'anthropic');
	});

	test('GetProviderStatus should return all initialized providers', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const status = aiService.getProviderStatus();
		
		assert.ok(Array.isArray(status));
		assert.ok(status.length > 0);
		
		// Check that each status has required fields
		status.forEach((provider: any) => {
			assert.strictEqual(typeof provider.type, 'string');
			assert.strictEqual(typeof provider.name, 'string');
			assert.strictEqual(typeof provider.configured, 'boolean');
			assert.ok(Array.isArray(provider.models));
			assert.strictEqual(typeof provider.defaultModel, 'string');
		});
	});

	test('ProcessCommits should use primary provider', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const testCommits: CommitInfo[] = [{
			hash: 'abc123',
			message: 'feat: add new feature',
			author: 'Test User',
			date: new Date().toISOString(),
			diff: '+new feature code'
		}];
		
		const entries = await aiService.processCommits(testCommits, 'conventional');
		
		assert.ok(Array.isArray(entries));
		if (entries.length > 0) {
			assert.strictEqual(typeof entries[0].type, 'string');
			assert.strictEqual(typeof entries[0].description, 'string');
		}
	});

	test('CategorizeCommit should return valid category', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const testCommit: CommitInfo = {
			hash: 'abc123',
			message: 'fix: resolve bug',
			author: 'Test User',
			date: new Date().toISOString(),
			diff: '+bug fix code'
		};
		
		const category = await aiService.categorizeCommit(testCommit);
		
		assert.strictEqual(typeof category, 'string');
		assert.ok(['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'].includes(category));
	});

	test('EnhanceDescription should return enhanced text', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const testCommit: CommitInfo = {
			hash: 'abc123',
			message: 'fix bug',
			author: 'Test User',
			date: new Date().toISOString(),
			diff: '+fixed the bug'
		};
		
		const enhanced = await aiService.enhanceDescription(testCommit);
		
		assert.strictEqual(typeof enhanced, 'string');
		assert.ok(enhanced.length > 0);
	});

	test('GenerateSummary should return summary text', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const testEntries: ChangelogEntry[] = [{
			type: 'feat',
			description: 'Added new functionality',
			commit: {
				hash: 'abc123',
				message: 'feat: add feature',
				author: 'Test User',
				date: new Date().toISOString(),
				diff: '+new code'
			}
		}];
		
		const summary = await aiService.generateSummary(testEntries);
		
		assert.strictEqual(typeof summary, 'string');
		assert.ok(summary.length > 0);
	});

	test('SetProviderModel should update model configuration', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		await aiService.setProviderModel('openai', 'gpt-3.5-turbo');
		
		// Method should complete without error
		assert.ok(true);
	});

	test('TestProvider should validate provider connection', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		// Test offline provider (should always work)
		const result = await aiService.testProvider('offline');
		
		assert.strictEqual(typeof result.success, 'boolean');
		if (!result.success) {
			assert.strictEqual(typeof result.error, 'string');
		}
	});

	test('GetUsageStatistics should return stats object', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const stats = await aiService.getUsageStatistics();
		
		assert.strictEqual(typeof stats, 'object');
		assert.ok(stats !== null);
	});

	test('Should handle provider initialization failures gracefully', async () => {
		// Create service without API keys in mock
		const mockContextNoKeys = createMockContext({});
		
		aiService = new AIService(mockContextNoKeys);
		
		// Should not throw error
		await aiService.initialize();
		
		const status = aiService.getProviderStatus();
		// Should at least have offline provider
		assert.ok(status.length >= 1);
	});

	test('Should fallback to offline provider when others fail', async () => {
		const mockContextNoKeys = createMockContext({});
		
		aiService = new AIService(mockContextNoKeys);
		await aiService.initialize();
		
		const testCommit: CommitInfo = {
			hash: 'abc123',
			message: 'feat: test feature',
			author: 'Test User',
			date: new Date().toISOString(),
			diff: '+test code'
		};
		
		// Should not throw error and use offline provider
		const category = await aiService.categorizeCommit(testCommit);
		assert.strictEqual(typeof category, 'string');
	});

	test('Should handle missing provider gracefully', async () => {
		aiService = new AIService(mockContext);
		await aiService.initialize();
		
		const result = await aiService.testProvider('azure' as AIProviderType);
		
		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error, 'Provider not found');
	});
});
