import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService, BranchComparisonOptions } from '../../integrations/git';
import { AIService } from '../../integrations/ai-service';

// Simplified mock VS Code extension context
const createMockContext = (): vscode.ExtensionContext => {
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
			get: async (key: string) => undefined, // No API keys for integration test
			store: async (key: string, value: string) => {},
			delete: async (key: string) => {},
			onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
		}
	};
};

// Mock VS Code workspace configuration
const mockConfiguration = {
	get: (key: string, defaultValue?: any) => {
		const configs: Record<string, any> = {
			'primaryAIProvider': 'offline', // Use offline provider for testing
			'providerModels': {},
			'aiMaxTokens': 200,
			'aiTemperature': 0.3
		};
		return configs[key] ?? defaultValue;
	},
	update: async (key: string, value: any, target?: vscode.ConfigurationTarget) => {},
	has: (section: string) => true,
	inspect: (section: string) => undefined
};

suite('Branch Comparison Integration Tests', () => {
	let gitService: GitService;
	let aiService: AIService;
	let mockContext: vscode.ExtensionContext;
	const workspacePath = '/Users/aakashjha/shipnote-ai'; // Use current repo

	setup(async () => {
		gitService = new GitService();
		mockContext = createMockContext();
		aiService = new AIService(mockContext);
		
		// Mock VS Code configuration
		(vscode.workspace as any).getConfiguration = () => mockConfiguration;
		
		await aiService.initialize();
	});

	test('should generate changelog from branch comparison', async () => {
		const currentBranch = await gitService.getCurrentBranch(workspacePath);
		
		if (currentBranch !== 'master') {
			// Get commits between master and current branch
			const commits = await gitService.getCommitsBetweenBranches(
				workspacePath,
				'master',
				currentBranch
			);
			
			if (commits.length > 0) {
				// Generate changelog using AI service (will use offline provider)
				const changelog = await aiService.processCommits(commits, 'conventional');
				
				assert.ok(Array.isArray(changelog));
				assert.strictEqual(changelog.length, commits.length);
				
				// Verify changelog entries have expected structure
				changelog.forEach(entry => {
					assert.strictEqual(typeof entry.type, 'string');
					assert.strictEqual(typeof entry.description, 'string');
					assert.ok(entry.commit);
					assert.strictEqual(typeof entry.commit.hash, 'string');
				});
				
				console.log(`Generated changelog for ${commits.length} commits between master and ${currentBranch}`);
			} else {
				console.log('No commits found between branches - skipping changelog generation test');
				assert.ok(true);
			}
		} else {
			console.log('On master branch - skipping branch comparison changelog test');
			assert.ok(true);
		}
	});

	test('should handle different comparison strategies', async () => {
		const currentBranch = await gitService.getCurrentBranch(workspacePath);
		
		if (currentBranch !== 'master') {
			const strategies: Array<BranchComparisonOptions['strategy']> = ['one-way', 'symmetric', 'merge-base'];
			
			for (const strategy of strategies) {
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					'master',
					currentBranch,
					{ fromBranch: 'master', toBranch: currentBranch, strategy }
				);
				
				assert.ok(Array.isArray(commits));
				console.log(`Strategy '${strategy}' returned ${commits.length} commits`);
				
				if (commits.length > 0) {
					// Verify we can generate changelog for each strategy
					const changelog = await aiService.processCommits(commits.slice(0, 2), 'conventional'); // Limit to 2 for speed
					assert.ok(Array.isArray(changelog));
				}
			}
		} else {
			console.log('On master branch - skipping strategy comparison test');
			assert.ok(true);
		}
	});

	test('should categorize branch commits correctly', async () => {
		const currentBranch = await gitService.getCurrentBranch(workspacePath);
		
		if (currentBranch !== 'master') {
			const commits = await gitService.getCommitsBetweenBranches(
				workspacePath,
				'master',
				currentBranch
			);
			
			if (commits.length > 0) {
				// Test categorization of individual commits
				const firstCommit = commits[0];
				const category = await aiService.categorizeCommit(firstCommit);
				
				assert.strictEqual(typeof category, 'string');
				assert.ok(['feat', 'fix', 'docs', 'refactor', 'style', 'test', 'chore'].includes(category));
				
				console.log(`Categorized commit "${firstCommit.message}" as "${category}"`);
			} else {
				console.log('No commits found - skipping categorization test');
				assert.ok(true);
			}
		} else {
			console.log('On master branch - skipping categorization test');
			assert.ok(true);
		}
	});

	test('should generate summary for branch changes', async () => {
		const currentBranch = await gitService.getCurrentBranch(workspacePath);
		
		if (currentBranch !== 'master') {
			const commits = await gitService.getCommitsBetweenBranches(
				workspacePath,
				'master',
				currentBranch
			);
			
			if (commits.length > 0) {
				// Generate changelog entries first
				const entries = await aiService.processCommits(commits, 'conventional');
				
				// Generate summary
				const summary = await aiService.generateSummary(entries);
				
				assert.strictEqual(typeof summary, 'string');
				assert.ok(summary.length > 0);
				
				console.log(`Generated summary for branch ${currentBranch}: "${summary.substring(0, 100)}..."`);
			} else {
				console.log('No commits found - skipping summary test');
				assert.ok(true);
			}
		} else {
			console.log('On master branch - skipping summary test');
			assert.ok(true);
		}
	});

	test('should handle branches with merge commits', async () => {
		const branches = await gitService.getBranches(workspacePath);
		const localBranches = branches.filter(b => !b.isRemote);
		
		if (localBranches.length >= 2) {
			const branch1 = localBranches[0].name;
			const branch2 = localBranches[1].name;
			
			// Test with merge commits included
			const commitsWithMerges = await gitService.getCommitsBetweenBranches(
				workspacePath,
				branch1,
				branch2,
				{ fromBranch: branch1, toBranch: branch2, includeMergeCommits: true }
			);
			
			// Test with merge commits excluded
			const commitsWithoutMerges = await gitService.getCommitsBetweenBranches(
				workspacePath,
				branch1,
				branch2,
				{ fromBranch: branch1, toBranch: branch2, includeMergeCommits: false }
			);
			
			assert.ok(Array.isArray(commitsWithMerges));
			assert.ok(Array.isArray(commitsWithoutMerges));
			
			// Verify merge commits are filtered out when requested
			const mergeCommitsInFiltered = commitsWithoutMerges.filter(c => c.message.startsWith('Merge'));
			assert.strictEqual(mergeCommitsInFiltered.length, 0);
			
			console.log(`Branch comparison: ${commitsWithMerges.length} with merges, ${commitsWithoutMerges.length} without merges`);
		} else {
			console.log('Not enough branches for merge commit test');
			assert.ok(true);
		}
	});
});
