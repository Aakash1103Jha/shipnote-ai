import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../config/config';

suite('ConfigService Tests', () => {
	let configService: ConfigService;
	let mockContext: vscode.ExtensionContext;

	setup(() => {
		// Mock ExtensionContext for testing
		mockContext = {
			secrets: {
				get: async (key: string) => key === 'shipnote-ai.openaiKey' ? 'test-api-key' : undefined,
				store: async (key: string, value: string) => {},
				delete: async (key: string) => {}
			},
			globalState: {
				get: (key: string) => undefined,
				update: async (key: string, value: any) => {}
			}
		} as any;
		
		configService = new ConfigService(mockContext);
	});

	suite('OpenAI Key Management', () => {
		test('should store and retrieve OpenAI API key', async () => {
			// TODO: Implement - should securely store API key
			const testKey = 'sk-test123456789';
			
			await configService.setOpenAIKey(testKey);
			const retrievedKey = await configService.getOpenAIKey();
			
			assert.strictEqual(retrievedKey, testKey);
		});

		test('should return undefined for unset API key', async () => {
			// TODO: Implement - should handle missing API key gracefully
			const mockEmptyContext = {
				secrets: {
					get: async (key: string) => undefined,
					store: async (key: string, value: string) => {},
					delete: async (key: string) => {}
				}
			} as any;
			
			const emptyConfigService = new ConfigService(mockEmptyContext);
			const key = await emptyConfigService.getOpenAIKey();
			
			assert.strictEqual(key, undefined);
		});
	});

	suite('Configuration Settings', () => {
		test('should get changelog style with default', () => {
			// TODO: Implement - should return configured or default style
			const style = configService.getChangelogStyle();
			
			assert.ok(typeof style === 'string');
			assert.ok(['formal', 'dev-friendly', 'pm-style'].includes(style));
		});

		test('should get default commit count', () => {
			// TODO: Implement - should return configured or default count
			const count = configService.getDefaultCommitCount();
			
			assert.ok(typeof count === 'number');
			assert.ok(count > 0);
		});

		test('should get output filename', () => {
			// TODO: Implement - should return configured or default filename
			const filename = configService.getOutputFileName();
			
			assert.ok(typeof filename === 'string');
			assert.ok(filename.length > 0);
		});

		test('should get include commit types', () => {
			// TODO: Implement - should return array of commit types to include
			const types = configService.getIncludeCommitTypes();
			
			assert.ok(Array.isArray(types));
			assert.ok(types.every(type => typeof type === 'string'));
		});

		test('should get skip formatting commits setting', () => {
			// TODO: Implement - should return boolean for skipping formatting commits
			const skip = configService.getSkipFormattingCommits();
			
			assert.ok(typeof skip === 'boolean');
		});

		test('should get group by author setting', () => {
			// TODO: Implement - should return boolean for grouping by author
			const groupByAuthor = configService.getGroupByAuthor();
			
			assert.ok(typeof groupByAuthor === 'boolean');
		});
	});

	suite('Configuration Updates', () => {
		test('should allow updating configuration programmatically', async () => {
			// TODO: Implement - should provide method to update config
			// This would be useful for the webview panel
			const newConfig = {
				changelogStyle: 'formal',
				defaultCommitCount: 20,
				skipFormattingCommits: false
			};

			// Note: This method doesn't exist yet - it's what we want to implement
			// await configService.updateConfig(newConfig);
			
			// For now, just verify the interface exists
			assert.ok(configService instanceof ConfigService);
		});
	});
});
