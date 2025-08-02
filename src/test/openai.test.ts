import * as assert from 'assert';
import * as vscode from 'vscode';
import { OpenAIService, ChangelogEntry } from '../openai';
import { ConfigService } from '../config';
import { CommitInfo } from '../git';

suite('OpenAIService Tests', () => {
	let openaiService: OpenAIService;
	let mockConfigService: ConfigService;

	setup(() => {
		// Mock ConfigService for testing
		mockConfigService = {
			getOpenAIKey: async () => 'test-api-key',
			setOpenAIKey: async () => {},
			getChangelogStyle: () => 'dev-friendly',
			getDefaultCommitCount: () => 10,
			getIncludeCommitTypes: () => ['feat', 'fix', 'docs'],
			getSkipFormattingCommits: () => true,
			getGroupByAuthor: () => false,
			getOutputFileName: () => 'CHANGELOG.md',
			updateConfig: async () => {}
		} as any;
		
		openaiService = new OpenAIService(mockConfigService);
	});

	suite('processCommits', () => {
		test('should process commits and return changelog entries', async () => {
			// TODO: Implement - should convert commits to structured changelog entries
			const commits: CommitInfo[] = [
				{
					hash: 'abc123',
					message: 'feat: add user authentication',
					author: 'Test Author',
					date: '2024-01-01',
					diff: '+function authenticate() { return true; }'
				},
				{
					hash: 'def456',
					message: 'fix: resolve login bug',
					author: 'Test Author',
					date: '2024-01-02',
					diff: '-if (user.login) {\n+if (user.login && user.active) {'
				}
			];

			const entries = await openaiService.processCommits(commits);
			
			assert.ok(Array.isArray(entries));
			assert.strictEqual(entries.length, 2);
			
			// Verify structure of entries
			entries.forEach(entry => {
				assert.ok(typeof entry.type === 'string');
				assert.ok(typeof entry.description === 'string');
				assert.ok(typeof entry.commit.hash === 'string');
				assert.ok(typeof entry.commit.author === 'string');
			});
		});

		test('should handle empty commit list', async () => {
			// TODO: Implement - should handle empty input gracefully
			const entries = await openaiService.processCommits([]);
			
			assert.ok(Array.isArray(entries));
			assert.strictEqual(entries.length, 0);
		});

		test('should handle API errors gracefully', async () => {
			// TODO: Implement - should handle OpenAI API errors
			// Mock invalid API key
			const invalidConfigService = {
				...mockConfigService,
				getOpenAIKey: async () => 'invalid-key'
			} as ConfigService;
			
			const invalidOpenAIService = new OpenAIService(invalidConfigService);
			
			try {
				await invalidOpenAIService.processCommits([{
					hash: 'abc123',
					message: 'test commit',
					author: 'Test',
					date: '2024-01-01',
					diff: 'test diff'
				}]);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes('API') || error.message.includes('authentication'));
			}
		});
	});

	suite('generateSummary', () => {
		test('should generate a summary for changelog entries', async () => {
			// TODO: Implement - should create a summary of changes
			const entries: ChangelogEntry[] = [
				{
					type: 'feat',
					description: 'Add user authentication system',
					commit: {
						hash: 'abc123',
						message: 'feat: add user authentication system',
						author: 'Test Author',
						date: '2024-01-01',
						diff: ''
					}
				},
				{
					type: 'fix',
					description: 'Fix login validation bug',
					commit: {
						hash: 'def456',
						message: 'fix: fix login validation bug',
						author: 'Test Author',
						date: '2024-01-01',
						diff: ''
					}
				}
			];

			const summary = await openaiService.generateSummary(entries);
			
			assert.ok(typeof summary === 'string');
			assert.ok(summary.length > 0);
			assert.ok(summary.toLowerCase().includes('authentication') || summary.toLowerCase().includes('login'));
		});

		test('should handle different writing styles', async () => {
			// TODO: Implement - should adjust tone based on style setting
			const entries: ChangelogEntry[] = [
				{
					type: 'feat',
					description: 'Add new feature',
					commit: {
						hash: 'abc123',
						message: 'feat: add new feature',
						author: 'Test Author',
						date: '2024-01-01',
						diff: ''
					}
				}
			];

			// Test different styles
			const styles = ['formal', 'dev-friendly', 'pm-style'] as const;
			
			for (const style of styles) {
				const mockStyleConfigService = {
					...mockConfigService,
					getChangelogStyle: () => style
				} as ConfigService;
				
				const styledOpenAIService = new OpenAIService(mockStyleConfigService);
				const summary = await styledOpenAIService.generateSummary(entries);
				
				assert.ok(typeof summary === 'string');
				assert.ok(summary.length > 0);
				// TODO: Add style-specific assertions when implemented
			}
		});

		test('should handle empty entries list', async () => {
			// TODO: Implement - should handle empty input
			const summary = await openaiService.generateSummary([]);
			
			assert.ok(typeof summary === 'string');
			// Should return appropriate message for no changes
		});
	});

	suite('categorizeCommit', () => {
		test('should categorize commit based on AI analysis', async () => {
			// TODO: Implement - should use AI to categorize ambiguous commits
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'update user profile functionality',
				author: 'Test Author',
				date: '2024-01-01',
				diff: '+function updateProfile() { /* implementation */ }'
			};

			const category = await openaiService.categorizeCommit(commit);
			
			assert.ok(typeof category === 'string');
			assert.ok(['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'].includes(category));
		});

		test('should handle commits with minimal information', async () => {
			// TODO: Implement - should categorize even with limited data
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'update',
				author: 'Test Author',
				date: '2024-01-01',
				diff: ''
			};

			const category = await openaiService.categorizeCommit(commit);
			
			assert.ok(typeof category === 'string');
			assert.ok(['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'].includes(category));
		});
	});

	suite('enhanceDescription', () => {
		test('should enhance commit description with AI', async () => {
			// TODO: Implement - should improve commit descriptions
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'fix bug',
				author: 'Test Author',
				date: '2024-01-01',
				diff: '-if (user) {\n+if (user && user.active) {'
			};

			const enhanced = await openaiService.enhanceDescription(commit);
			
			assert.ok(typeof enhanced === 'string');
			assert.ok(enhanced.length > commit.message.length);
			assert.ok(enhanced !== commit.message);
		});

		test('should preserve good descriptions', async () => {
			// TODO: Implement - should not over-enhance already good descriptions
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'feat: implement comprehensive user authentication system with OAuth2 support',
				author: 'Test Author',
				date: '2024-01-01',
				diff: '+class AuthService { /* implementation */ }'
			};

			const enhanced = await openaiService.enhanceDescription(commit);
			
			assert.ok(typeof enhanced === 'string');
			// Should not drastically change already descriptive messages
		});
	});
});
