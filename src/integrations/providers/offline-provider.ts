import { BaseAIProvider } from './base-provider';
import { AIProviderConfig, ChangelogEntry, CommitInfo } from './types';

export class OfflineProvider extends BaseAIProvider {
	readonly name = 'Offline';
	readonly availableModels = ['basic-processing'];
	readonly defaultModel = 'basic-processing';

	async initialize(config: AIProviderConfig): Promise<void> {
		this.config = config;
		// No external API initialization needed for offline provider
	}

	isConfigured(): boolean {
		return true; // Offline provider is always "configured" since it doesn't need external APIs
	}

	protected async processCommit(commit: CommitInfo, style: string): Promise<ChangelogEntry | null> {
		// Always use fallback processing for offline mode
		return this.fallbackProcessCommit(commit);
	}

	async generateSummary(entries: ChangelogEntry[]): Promise<string> {
		// Use the fallback summary generation from base class
		return super.generateSummary(entries);
	}

	async categorizeCommit(commit: CommitInfo): Promise<ChangelogEntry['type']> {
		// Use enhanced pattern matching for offline categorization
		const message = commit.message.toLowerCase();
		const diff = commit.diff.toLowerCase();

		// Check conventional commit patterns first
		const conventionalMatch = commit.message.match(/^(feat|fix|docs|refactor|style|test|chore)(\(.+\))?:/i);
		if (conventionalMatch) {
			return conventionalMatch[1].toLowerCase() as ChangelogEntry['type'];
		}

		// Enhanced pattern matching based on message and diff content
		if (this.isFeatCommit(message, diff)) {
			return 'feat';
		}
		if (this.isFixCommit(message, diff)) {
			return 'fix';
		}
		if (this.isDocsCommit(message, diff)) {
			return 'docs';
		}
		if (this.isTestCommit(message, diff)) {
			return 'test';
		}
		if (this.isStyleCommit(message, diff)) {
			return 'style';
		}
		if (this.isRefactorCommit(message, diff)) {
			return 'refactor';
		}

		return 'chore';
	}

	async enhanceDescription(commit: CommitInfo): Promise<string> {
		// Use the base class enhancement, but with some additional offline-specific improvements
		const baseDescription = await super.enhanceDescription(commit);

		// Additional offline enhancements
		const description = this.improveDescriptionOffline(baseDescription, commit);

		return description;
	}

	private isFeatCommit(message: string, diff: string): boolean {
		const featKeywords = [
			'add', 'new', 'feature', 'implement', 'introduce', 'create',
			'support', 'enable', 'allow', 'provide'
		];
		
		// Check message
		if (featKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check diff for new functions, classes, or significant additions
		if (diff.includes('+function') || diff.includes('+class') || diff.includes('+export')) {
			const additions = diff.split('\n').filter(line => line.startsWith('+')).length;
			const deletions = diff.split('\n').filter(line => line.startsWith('-')).length;
			
			// More additions than deletions suggests a new feature
			return additions > deletions * 2;
		}

		return false;
	}

	private isFixCommit(message: string, diff: string): boolean {
		const fixKeywords = [
			'fix', 'bug', 'issue', 'problem', 'error', 'crash',
			'resolve', 'correct', 'repair', 'patch', 'hotfix'
		];

		// Check message
		if (fixKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check diff for typical fix patterns
		if (diff.includes('if (') && diff.includes('null') || 
			diff.includes('undefined') || 
			diff.includes('try') && diff.includes('catch')) {
			return true;
		}

		return false;
	}

	private isDocsCommit(message: string, diff: string): boolean {
		const docsKeywords = ['doc', 'readme', 'comment', 'documentation'];
		
		// Check message
		if (docsKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check if diff only contains documentation files
		const diffLines = diff.split('\n');
		const fileChanges = diffLines.filter(line => line.startsWith('+++') || line.startsWith('---'));
		
		return fileChanges.every(line => 
			line.includes('.md') || 
			line.includes('.txt') || 
			line.includes('README') ||
			line.includes('CHANGELOG')
		);
	}

	private isTestCommit(message: string, diff: string): boolean {
		const testKeywords = ['test', 'spec', 'mock', 'fixture'];
		
		// Check message
		if (testKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check if diff contains test files
		return diff.includes('.test.') || diff.includes('.spec.') || diff.includes('__tests__');
	}

	private isStyleCommit(message: string, diff: string): boolean {
		const styleKeywords = ['format', 'style', 'lint', 'prettier', 'eslint', 'whitespace'];
		
		// Check message
		if (styleKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check if diff contains only formatting changes (lots of whitespace changes)
		const diffLines = diff.split('\n');
		const meaningfulChanges = diffLines.filter(line => 
			(line.startsWith('+') || line.startsWith('-')) && 
			line.trim().length > 1 &&
			!/^\s*[\+\-]\s*$/.test(line)
		);

		const totalChanges = diffLines.filter(line => line.startsWith('+') || line.startsWith('-')).length;
		
		// If most changes are just whitespace, it's likely a style commit
		return meaningfulChanges.length < totalChanges * 0.3;
	}

	private isRefactorCommit(message: string, diff: string): boolean {
		const refactorKeywords = ['refactor', 'restructure', 'reorganize', 'cleanup', 'improve'];
		
		// Check message
		if (refactorKeywords.some(keyword => message.includes(keyword))) {
			return true;
		}

		// Check if diff has roughly equal additions and deletions (code movement)
		const additions = diff.split('\n').filter(line => line.startsWith('+')).length;
		const deletions = diff.split('\n').filter(line => line.startsWith('-')).length;
		
		// Refactoring often has similar amounts of additions and deletions
		return additions > 5 && deletions > 5 && Math.abs(additions - deletions) < Math.max(additions, deletions) * 0.3;
	}

	private improveDescriptionOffline(description: string, commit: CommitInfo): string {
		// Remove redundant prefixes
		description = description.replace(/^(feat|fix|docs|refactor|style|test|chore):\s*/i, '');
		
		// Improve common patterns
		const improvements: Array<[RegExp, string]> = [
			[/^update\s+(.+)/i, 'Update $1'],
			[/^add\s+(.+)/i, 'Add $1'],
			[/^fix\s+(.+)/i, 'Fix $1'],
			[/^remove\s+(.+)/i, 'Remove $1'],
			[/^bump\s+(.+)/i, 'Update $1'],
			[/^wip\s*/i, 'Work in progress: '],
			[/^initial\s+(.+)/i, 'Initial $1'],
		];

		for (const [pattern, replacement] of improvements) {
			if (pattern.test(description)) {
				description = description.replace(pattern, replacement);
				break;
			}
		}

		// Ensure proper capitalization and punctuation
		description = description.charAt(0).toUpperCase() + description.slice(1);
		if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
			description += '.';
		}

		return description;
	}
}
