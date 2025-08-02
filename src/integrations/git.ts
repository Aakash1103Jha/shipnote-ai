import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommitInfo {
	hash: string;
	message: string;
	author: string;
	date: string;
	diff: string;
}

export interface CommitRangeOptions {
	commitCount?: number;
	fromDate?: string;
	toDate?: string;
	fromTag?: string;
	toTag?: string;
	fromSHA?: string;
	toSHA?: string;
}

export class GitService {
	/**
	 * Get commits within the specified range
	 */
	async getCommits(workspacePath: string, options: CommitRangeOptions): Promise<CommitInfo[]> {
		const gitCommand = this.buildGitLogCommand(options);
		
		try {
			const { stdout } = await execAsync(gitCommand, { cwd: workspacePath });
			const commitHashes = stdout.trim().split('\n').filter(Boolean);
			
			const commits: CommitInfo[] = [];
			
			for (const hash of commitHashes) {
				const commitInfo = await this.getCommitInfo(workspacePath, hash);
				if (commitInfo) {
					commits.push(commitInfo);
				}
			}
			
			return commits;
		} catch (error) {
			throw new Error(`Failed to get commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get detailed information about a specific commit
	 */
	async getCommitInfo(workspacePath: string, hash: string): Promise<CommitInfo | null> {
		try {
			// Get commit message, author, and date
			const { stdout: commitData } = await execAsync(
				`git show --format="%s%n%an%n%ad" --no-patch --date=iso "${hash}"`,
				{ cwd: workspacePath }
			);
			
			const [message, author, date] = commitData.trim().split('\n');
			
			// Get commit diff with minimal context
			const { stdout: diff } = await execAsync(
				`git show "${hash}" --unified=1`,
				{ cwd: workspacePath }
			);
			
			return {
				hash,
				message: message || 'No commit message',
				author: author || 'Unknown',
				date: date || 'Unknown',
				diff: diff || ''
			};
		} catch (error) {
			console.error(`Failed to get commit info for ${hash}:`, error);
			return null;
		}
	}

	/**
	 * Get available Git tags
	 */
	async getTags(workspacePath: string): Promise<string[]> {
		try {
			const { stdout } = await execAsync('git tag --sort=-version:refname', { cwd: workspacePath });
			return stdout.trim().split('\n').filter(Boolean);
		} catch (error) {
			console.error('Failed to get Git tags:', error);
			return [];
		}
	}

	/**
	 * Check if directory is a Git repository
	 */
	async isGitRepository(workspacePath: string): Promise<boolean> {
		try {
			await execAsync('git rev-parse --git-dir', { cwd: workspacePath });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get current branch name
	 */
	async getCurrentBranch(workspacePath: string): Promise<string> {
		try {
			const { stdout } = await execAsync('git branch --show-current', { cwd: workspacePath });
			return stdout.trim();
		} catch (error) {
			throw new Error(`Failed to get current branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Build Git log command based on options
	 */
	private buildGitLogCommand(options: CommitRangeOptions): string {
		let command = 'git log --pretty=format:"%H"';

		if (options.commitCount) {
			command += ` -n ${options.commitCount}`;
		} else if (options.fromDate && options.toDate) {
			command += ` --since="${options.fromDate}" --until="${options.toDate}"`;
		} else if (options.fromDate) {
			command += ` --since="${options.fromDate}"`;
		} else if (options.fromTag && options.toTag) {
			command += ` ${options.fromTag}..${options.toTag}`;
		} else if (options.fromSHA && options.toSHA) {
			command += ` ${options.fromSHA}..${options.toSHA}`;
		} else {
			// Default to last 10 commits
			command += ' -n 10';
		}

		return command;
	}

	/**
	 * Filter commits that are likely formatting-only changes
	 */
	isFormattingOnlyCommit(commit: CommitInfo): boolean {
		const formattingKeywords = [
			'format',
			'prettier',
			'eslint',
			'lint',
			'style',
			'whitespace',
			'indentation',
			'semicolon',
			'trailing'
		];

		const message = commit.message.toLowerCase();
		const hasFormattingKeyword = formattingKeywords.some(keyword => 
			message.includes(keyword)
		);

		// Check if diff contains only whitespace/formatting changes
		const diffLines = commit.diff.split('\n');
		const meaningfulChanges = diffLines.filter(line => {
			if (!line.startsWith('+') && !line.startsWith('-')) {
				return false;
			}
			if (line.startsWith('+++') || line.startsWith('---')) {
				return false;
			}
			
			const content = line.substring(1).trim();
			
			// Skip empty lines
			if (!content) {
				return false;
			}
			
			// Check if it's just whitespace/formatting changes
			return content.length > 0;
		});

		// If very few meaningful changes and has formatting keywords, likely formatting-only
		return hasFormattingKeyword && meaningfulChanges.length < 5;
	}

	/**
	 * Categorize commit based on message and diff
	 */
	categorizeCommit(commit: CommitInfo): string {
		const message = commit.message.toLowerCase();

		// Check conventional commit patterns first
		if (message.match(/^feat(\(.+\))?:/)) {
			return 'feat';
		}
		if (message.match(/^fix(\(.+\))?:/)) {
			return 'fix';
		}
		if (message.match(/^docs(\(.+\))?:/)) {
			return 'docs';
		}
		if (message.match(/^style(\(.+\))?:/)) {
			return 'style';
		}
		if (message.match(/^refactor(\(.+\))?:/)) {
			return 'refactor';
		}
		if (message.match(/^test(\(.+\))?:/)) {
			return 'test';
		}
		if (message.match(/^chore(\(.+\))?:/)) {
			return 'chore';
		}

		// Fall back to keyword analysis
		if (message.includes('add') || message.includes('new') || message.includes('implement')) {
			return 'feat';
		}
		if (message.includes('fix') || message.includes('bug') || message.includes('issue')) {
			return 'fix';
		}
		if (message.includes('doc') || message.includes('readme')) {
			return 'docs';
		}
		if (message.includes('refactor') || message.includes('restructure')) {
			return 'refactor';
		}
		if (message.includes('test') || message.includes('spec')) {
			return 'test';
		}
		if (message.includes('style') || message.includes('format')) {
			return 'style';
		}

		// Default category
		return 'chore';
	}
}
