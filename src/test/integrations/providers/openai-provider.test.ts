import * as assert from 'assert';
import { OpenAIProvider } from '../../../integrations/providers/openai-provider';
import { AIProviderConfig, CommitInfo } from '../../../integrations/providers/types';

const createMockCommit = (overrides: Partial<CommitInfo> = {}): CommitInfo => ({
	hash: 'abc123',
	message: 'Add new feature',
	author: 'Test Author',
	date: '2024-08-02',
	diff: '+function newFeature() { return true; }',
	...overrides
});

suite('OpenAIProvider Test Suite', () => {
	let provider: OpenAIProvider;

	setup(() => {
		provider = new OpenAIProvider();
	});

	suite('Provider Metadata', () => {
		test('should have correct name', () => {
			assert.strictEqual(provider.name, 'OpenAI');
		});

		test('should have correct available models', () => {
			const expectedModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini'];
			assert.deepStrictEqual(provider.availableModels, expectedModels);
		});

		test('should have correct default model', () => {
			assert.strictEqual(provider.defaultModel, 'gpt-3.5-turbo');
		});
	});

	suite('Configuration', () => {
		test('should not be configured initially', () => {
			assert.strictEqual(provider.isConfigured(), false);
		});

		test('should be configured after initialization', async () => {
			const config: AIProviderConfig = {
				apiKey: 'test-key',
				model: 'gpt-4',
				maxTokens: 150,
				temperature: 0.5
			};

			await provider.initialize(config);

			assert.strictEqual(provider.isConfigured(), true);
		});

		test('should throw error when processing commits without configuration', async () => {
			const commits = [createMockCommit()];

			try {
				await provider.processCommits(commits, 'dev-friendly');
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok((error as Error).message.includes('not configured'));
			}
		});
	});

	suite('Usage Stats', () => {
		test('should return initial usage stats', async () => {
			const stats = await provider.getUsageStats();

			assert.strictEqual(stats.tokensUsed, 0);
			assert.strictEqual(stats.requestsCount, 0);
			assert.strictEqual(stats.lastRequest, undefined);
		});
	});

	suite('Fallback Behavior', () => {
		test('should use fallback for categorizeCommit when not configured', async () => {
			const commit = createMockCommit({ message: 'fix: resolve login issue' });
			const type = await provider.categorizeCommit(commit);

			assert.strictEqual(type, 'fix');
		});

		test('should use fallback for enhanceDescription when not configured', async () => {
			const commit = createMockCommit({ message: 'lowercase message' });
			const description = await provider.enhanceDescription(commit);

			assert.ok(description.charAt(0) === description.charAt(0).toUpperCase());
			assert.ok(description.endsWith('.'));
		});

		test('should use fallback for generateSummary when not configured', async () => {
			const entries = [
				{
					type: 'feat' as const,
					description: 'Add feature',
					commit: createMockCommit()
				}
			];

			const summary = await provider.generateSummary(entries);

			assert.ok(summary.includes('feature'));
		});
	});

	suite('Error Handling', () => {
		test('should handle empty commit list gracefully', async () => {
			const config: AIProviderConfig = { apiKey: 'test-key' };
			await provider.initialize(config);

			const entries = await provider.processCommits([], 'dev-friendly');

			assert.strictEqual(entries.length, 0);
		});

		test('should return fallback summary for empty entries', async () => {
			const config: AIProviderConfig = { apiKey: 'test-key' };
			await provider.initialize(config);

			const summary = await provider.generateSummary([]);

			assert.strictEqual(summary, 'This release includes various improvements and bug fixes.');
		});
	});

	suite('Model Configuration', () => {
		test('should use default model when none specified', async () => {
			const config: AIProviderConfig = { apiKey: 'test-key' };
			await provider.initialize(config);

			// We can't test the actual API call without mocking, but we can verify the provider is configured
			assert.strictEqual(provider.isConfigured(), true);
		});

		test('should accept custom model configuration', async () => {
			const config: AIProviderConfig = {
				apiKey: 'test-key',
				model: 'gpt-4',
				maxTokens: 300,
				temperature: 0.7
			};
			await provider.initialize(config);

			assert.strictEqual(provider.isConfigured(), true);
		});
	});
});
