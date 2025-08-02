import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService, CommitInfo, CommitRangeOptions, BranchInfo, BranchComparisonOptions } from '../../integrations/git';

suite('GitService Tests', () => {
	let gitService: GitService;

	setup(() => {
		gitService = new GitService();
	});

	suite('getCommits', () => {
		test('should get commits by count', async () => {
			// TODO: Implement - should return array of commits limited by count
			const options: CommitRangeOptions = { commitCount: 5 };
			const commits = await gitService.getCommits('/fake/repo/path', options);
			
			assert.ok(Array.isArray(commits));
			assert.ok(commits.length <= 5);
		});

		test('should get commits by date range', async () => {
			// TODO: Implement - should return commits within date range
			const options: CommitRangeOptions = { 
				fromDate: '2024-01-01',
				toDate: '2024-12-31'
			};
			const commits = await gitService.getCommits('/fake/repo/path', options);
			
			assert.ok(Array.isArray(commits));
			// Verify commits are within date range
		});

		test('should get commits between two SHAs', async () => {
			// TODO: Implement - should return commits between two commit SHAs
			const options: CommitRangeOptions = { 
				fromSHA: 'abc123',
				toSHA: 'def456'
			};
			const commits = await gitService.getCommits('/fake/repo/path', options);
			
			assert.ok(Array.isArray(commits));
		});

		test('should get commits between two tags', async () => {
			// TODO: Implement - should return commits between two git tags
			const options: CommitRangeOptions = { 
				fromTag: 'v1.0.0',
				toTag: 'v2.0.0'
			};
			const commits = await gitService.getCommits('/fake/repo/path', options);
			
			assert.ok(Array.isArray(commits));
		});

		test('should handle invalid repository path', async () => {
			// TODO: Implement - should throw error for invalid repo path
			const options: CommitRangeOptions = { commitCount: 5 };
			
			try {
				await gitService.getCommits('/invalid/path', options);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes('repository'));
			}
		});
	});

	suite('getCommitInfo', () => {
		test('should get detailed commit information', async () => {
			// TODO: Implement - should return detailed commit info including diff
			const commitInfo = await gitService.getCommitInfo('/fake/repo/path', 'abc123');
			
			assert.ok(commitInfo);
			assert.ok(typeof commitInfo.hash === 'string');
			assert.ok(typeof commitInfo.message === 'string');
			assert.ok(typeof commitInfo.author === 'string');
			assert.ok(typeof commitInfo.date === 'string');
			assert.ok(typeof commitInfo.diff === 'string');
		});

		test('should handle invalid commit SHA', async () => {
			// TODO: Implement - should throw error for invalid SHA
			try {
				await gitService.getCommitInfo('/fake/repo/path', 'invalid-sha');
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.ok(error instanceof Error);
			}
		});
	});

	suite('categorizeCommit', () => {
		test('should categorize feat commits', () => {
			// TODO: Implement - should identify feature commits
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'feat: add new user authentication',
				author: 'Test Author',
				date: '2024-01-01',
				diff: ''
			};
			
			const category = gitService.categorizeCommit(commit);
			assert.strictEqual(category, 'feat');
		});

		test('should categorize fix commits', () => {
			// TODO: Implement - should identify bug fix commits
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'fix: resolve login issue',
				author: 'Test Author',
				date: '2024-01-01',
				diff: ''
			};
			
			const category = gitService.categorizeCommit(commit);
			assert.strictEqual(category, 'fix');
		});

		test('should categorize docs commits', () => {
			// TODO: Implement - should identify documentation commits
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'docs: update README',
				author: 'Test Author',
				date: '2024-01-01',
				diff: ''
			};
			
			const category = gitService.categorizeCommit(commit);
			assert.strictEqual(category, 'docs');
		});

		test('should categorize unknown commits as chore', () => {
			// TODO: Implement - should default unknown commits to chore
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'random commit message',
				author: 'Test Author',
				date: '2024-01-01',
				diff: ''
			};
			
			const category = gitService.categorizeCommit(commit);
			assert.strictEqual(category, 'chore');
		});
	});

	suite('isFormattingOnlyCommit', () => {
		test('should identify formatting-only commits', () => {
			// TODO: Implement - should detect commits with only formatting changes
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'style: fix indentation',
				author: 'Test Author',
				date: '2024-01-01',
				diff: '-  const x = 1;\n+    const x = 1;'
			};
			
			const isFormatting = gitService.isFormattingOnlyCommit(commit);
			assert.strictEqual(isFormatting, true);
		});

		test('should not flag substantial changes as formatting', () => {
			// TODO: Implement - should not flag real code changes as formatting
			const commit: CommitInfo = {
				hash: 'abc123',
				message: 'feat: add new function',
				author: 'Test Author',
				date: '2024-01-01',
				diff: '+function newFeature() {\n+  return "hello";\n+}'
			};
			
			const isFormatting = gitService.isFormattingOnlyCommit(commit);
			assert.strictEqual(isFormatting, false);
		});
	});

	suite('Branch Comparison', () => {
		const workspacePath = '/Users/aakashjha/shipnote-ai'; // Use current repo for testing
		
		test('getBranches should return list of available branches', async () => {
			const branches = await gitService.getBranches(workspacePath);
			
			assert.ok(Array.isArray(branches));
			branches.forEach(branch => {
				assert.strictEqual(typeof branch.name, 'string');
				assert.strictEqual(typeof branch.isRemote, 'boolean');
				if (branch.lastCommit) {
					assert.strictEqual(typeof branch.lastCommit.hash, 'string');
					assert.strictEqual(typeof branch.lastCommit.message, 'string');
				}
			});
		});

		test('branchExists should validate branch existence', async () => {
			const existsMaster = await gitService.branchExists(workspacePath, 'master');
			const existsFake = await gitService.branchExists(workspacePath, 'nonexistent-branch-12345');
			
			assert.strictEqual(typeof existsMaster, 'boolean');
			assert.strictEqual(typeof existsFake, 'boolean');
			assert.strictEqual(existsFake, false); // This should definitely not exist
		});

		test('getMergeBase should find common ancestor', async () => {
			// Skip if we don't have multiple branches
			const branches = await gitService.getBranches(workspacePath);
			const localBranches = branches.filter(b => !b.isRemote);
			
			if (localBranches.length >= 2) {
				const branch1 = localBranches[0].name;
				const branch2 = localBranches[1].name;
				const mergeBase = await gitService.getMergeBase(workspacePath, branch1, branch2);
				
				assert.strictEqual(typeof mergeBase, 'string');
				assert.ok(mergeBase.length > 0);
			} else {
				// Skip test if we don't have enough branches
				console.log('Skipping getMergeBase test - not enough branches');
				assert.ok(true);
			}
		});

		test('getCommitsBetweenBranches should return commits between branches', async () => {
			// Use current branch vs master for testing
			const currentBranch = await gitService.getCurrentBranch(workspacePath);
			
			if (currentBranch !== 'master') {
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					'master',
					currentBranch
				);
				
				assert.ok(Array.isArray(commits));
				commits.forEach(commit => {
					assert.strictEqual(typeof commit.hash, 'string');
					assert.strictEqual(typeof commit.message, 'string');
					assert.strictEqual(typeof commit.author, 'string');
					assert.strictEqual(typeof commit.date, 'string');
					assert.strictEqual(typeof commit.diff, 'string');
				});
			} else {
				// If we're on master, just verify the function works with same branch
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					'master',
					'master'
				);
				assert.ok(Array.isArray(commits));
				assert.strictEqual(commits.length, 0); // Should be empty for same branch
			}
		});

		test('getCommitsBetweenBranches should handle one-way comparison', async () => {
			const currentBranch = await gitService.getCurrentBranch(workspacePath);
			
			if (currentBranch !== 'master') {
				const options: BranchComparisonOptions = {
					fromBranch: 'master',
					toBranch: currentBranch,
					strategy: 'one-way'
				};
				
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					options.fromBranch,
					options.toBranch,
					options
				);
				
				assert.ok(Array.isArray(commits));
			} else {
				console.log('Skipping one-way comparison test - on master branch');
				assert.ok(true);
			}
		});

		test('getCommitsBetweenBranches should handle symmetric comparison', async () => {
			const currentBranch = await gitService.getCurrentBranch(workspacePath);
			
			if (currentBranch !== 'master') {
				const options: BranchComparisonOptions = {
					fromBranch: 'master',
					toBranch: currentBranch,
					strategy: 'symmetric'
				};
				
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					options.fromBranch,
					options.toBranch,
					options
				);
				
				assert.ok(Array.isArray(commits));
			} else {
				console.log('Skipping symmetric comparison test - on master branch');
				assert.ok(true);
			}
		});

		test('getCommitsBetweenBranches should handle merge-base strategy', async () => {
			const currentBranch = await gitService.getCurrentBranch(workspacePath);
			
			if (currentBranch !== 'master') {
				const options: BranchComparisonOptions = {
					fromBranch: 'master',
					toBranch: currentBranch,
					strategy: 'merge-base'
				};
				
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					options.fromBranch,
					options.toBranch,
					options
				);
				
				assert.ok(Array.isArray(commits));
			} else {
				console.log('Skipping merge-base strategy test - on master branch');
				assert.ok(true);
			}
		});

		test('getCommitsBetweenBranches should exclude merge commits when specified', async () => {
			const currentBranch = await gitService.getCurrentBranch(workspacePath);
			
			if (currentBranch !== 'master') {
				const options: BranchComparisonOptions = {
					fromBranch: 'master',
					toBranch: currentBranch,
					includeMergeCommits: false
				};
				
				const commits = await gitService.getCommitsBetweenBranches(
					workspacePath,
					options.fromBranch,
					options.toBranch,
					options
				);
				
				assert.ok(Array.isArray(commits));
				// Should not contain merge commits (messages starting with "Merge")
				const mergeCommits = commits.filter(c => c.message.startsWith('Merge'));
				assert.strictEqual(mergeCommits.length, 0);
			} else {
				console.log('Skipping merge commit exclusion test - on master branch');
				assert.ok(true);
			}
		});

		test('getCommitsBetweenBranches should handle non-existent branches gracefully', async () => {
			try {
				await gitService.getCommitsBetweenBranches(
					workspacePath,
					'nonexistent-branch-12345',
					'another-nonexistent-branch-67890'
				);
				assert.fail('Should have thrown an error for non-existent branches');
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes('does not exist'));
			}
		});

		test('getBranches should distinguish between local and remote branches', async () => {
			const branches = await gitService.getBranches(workspacePath);
			
			const localBranches = branches.filter((b: BranchInfo) => !b.isRemote);
			const remoteBranches = branches.filter((b: BranchInfo) => b.isRemote);
			
			// Should have at least some branches
			assert.ok(branches.length > 0);
			
			// Remote branches should have origin/ prefix or similar
			remoteBranches.forEach(branch => {
				assert.ok(
					branch.name.includes('/'),
					`Remote branch ${branch.name} should have remote indicator`
				);
			});
		});

		test('getBranches should include branch metadata', async () => {
			const branches = await gitService.getBranches(workspacePath);
			
			if (branches.length > 0) {
				const branch = branches[0];
				assert.strictEqual(typeof branch.name, 'string');
				assert.strictEqual(typeof branch.isRemote, 'boolean');
				
				if (branch.lastCommit) {
					assert.strictEqual(typeof branch.lastCommit.hash, 'string');
					assert.strictEqual(typeof branch.lastCommit.message, 'string');
					assert.strictEqual(typeof branch.lastCommit.author, 'string');
					assert.strictEqual(typeof branch.lastCommit.date, 'string');
				}
			}
		});
	});
});
