import * as assert from 'assert';
import { BaseAIProvider } from '../../../integrations/providers/base-provider';
import { AIProviderConfig, ChangelogEntry, CommitInfo } from '../../../integrations/providers/types';

// Test implementation of BaseAIProvider
class TestProvider extends BaseAIProvider {
	readonly name = 'test';
	readonly availableModels = ['test-model-1', 'test-model-2'];
	readonly defaultModel = 'test-model-1';

	private initializeCalled = false;
	private processCommitCalls: Array<{ commit: CommitInfo; style: string }> = [];

	async initialize(config: AIProviderConfig): Promise<void> {
		this.config = config;
		this.initializeCalled = true;
	}

	protected async processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null> {
		this.processCommitCalls.push({ commit, style });
		
		// Mock AI response
		return {
			type: 'feat',
			description: `Enhanced: ${commit.message}`,
			commit
		};
	}

	// Expose protected methods for testing
	public testGetSystemPrompt(style: string): string {
		return (this as any).getSystemPrompt(style);
	}

	public testBuildCommitPrompt(commit: CommitInfo, style: string): string {
		return (this as any).buildCommitPrompt(commit, style);
	}

	public testParseAIResponse(content: string, commit: CommitInfo): ChangelogEntry {
		return (this as any).parseAIResponse(content, commit);
	}

	public testFallbackProcessCommit(commit: CommitInfo): ChangelogEntry {
		return (this as any).fallbackProcessCommit(commit);
	}

	public getProcessCommitCalls(): Array<{ commit: CommitInfo; style: string }> {
		return this.processCommitCalls;
	}

	public wasInitializeCalled(): boolean {
		return this.initializeCalled;
	}
}

const createMockCommit = (overrides: Partial<CommitInfo> = {}): CommitInfo => ({
	hash: 'abc123',
	message: 'Add new feature',
	author: 'Test Author',
	date: '2024-08-02',
	diff: '+function newFeature() { return true; }',
	...overrides
});

suite('BaseAIProvider Test Suite', () => {
	let provider: TestProvider;

	setup(() => {
		provider = new TestProvider();
	});

	suite('Configuration', () => {
		test('should not be configured initially', () => {
			assert.strictEqual(provider.isConfigured(), false);
		});

		test('should be configured after initialization', async () => {
			const config: AIProviderConfig = {
				apiKey: 'test-key',
				model: 'test-model',
				maxTokens: 100,
				temperature: 0.5
			};

			await provider.initialize(config);

			assert.strictEqual(provider.isConfigured(), true);
			assert.strictEqual(provider.wasInitializeCalled(), true);
		});

		test('should have correct provider metadata', () => {
			assert.strictEqual(provider.name, 'test');
			assert.deepStrictEqual(provider.availableModels, ['test-model-1', 'test-model-2']);
			assert.strictEqual(provider.defaultModel, 'test-model-1');
		});
	});

	suite('System Prompts', () => {
		test('should generate appropriate system prompt for formal style', () => {
			const prompt = provider.testGetSystemPrompt('formal');
			assert.ok(prompt.includes('formal, professional language'));
			assert.ok(prompt.includes('enterprise documentation'));
		});

		test('should generate base prompt for unknown style', () => {
			const prompt = provider.testGetSystemPrompt('unknown');
			assert.ok(prompt.includes('changelog generator'));
			assert.ok(!prompt.includes('formal'));
		});
	});

	suite('Fallback Processing', () => {
		test('should categorize feat commits correctly', () => {
			const commit = createMockCommit({ message: 'feat: add new login system' });
			const entry = provider.testFallbackProcessCommit(commit);

			assert.strictEqual(entry.type, 'feat');
			assert.ok(entry.description.includes('add new login system'));
		});

		test('should categorize fix commits correctly', () => {
			const commit = createMockCommit({ message: 'fix: resolve authentication bug' });
			const entry = provider.testFallbackProcessCommit(commit);

			assert.strictEqual(entry.type, 'fix');
		});

		test('should default to chore for unrecognized commits', () => {
			const commit = createMockCommit({ message: 'random commit message' });
			const entry = provider.testFallbackProcessCommit(commit);

			assert.strictEqual(entry.type, 'chore');
		});
	});

	suite('Batch Processing', () => {
		test('should throw error if not configured', async () => {
			const commits = [createMockCommit()];

			try {
				await provider.processCommits(commits, 'dev-friendly');
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok((error as Error).message.includes('not configured'));
			}
		});

		test('should handle empty commit list', async () => {
			const config: AIProviderConfig = { apiKey: 'test-key' };
			await provider.initialize(config);

			const entries = await provider.processCommits([], 'dev-friendly');

			assert.strictEqual(entries.length, 0);
		});
	});
});
