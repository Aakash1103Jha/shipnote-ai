import { GitService, CommitInfo, CommitRangeOptions } from '../integrations/git';
import { OpenAIService, ChangelogEntry } from '../integrations/openai';
import { ConfigService } from '../config/config';

export interface GenerateOptions {
	commitCount?: number;
	fromDate?: string;
	toDate?: string;
	fromTag?: string;
	toTag?: string;
	fromSHA?: string;
	toSHA?: string;
	includeTypes?: string[];
	skipFormatting?: boolean;
	groupByAuthor?: boolean;
}

export class ChangelogGenerator {
	constructor(
		private gitService: GitService,
		private openaiService: OpenAIService,
		private configService: ConfigService
	) {}

	/**
	 * Generate a complete changelog
	 */
	async generateChangelog(workspacePath: string, options: GenerateOptions = {}): Promise<string> {
		// Check if it's a Git repository
		const isGitRepo = await this.gitService.isGitRepository(workspacePath);
		if (!isGitRepo) {
			throw new Error('Current workspace is not a Git repository');
		}

		// Merge options with config defaults
		const mergedOptions = this.mergeWithDefaults(options);

		// Get commits
		const commits = await this.getFilteredCommits(workspacePath, mergedOptions);
		if (commits.length === 0) {
			throw new Error('No commits found in the specified range');
		}

		// Process commits with AI
		const entries = await this.openaiService.processCommits(commits);

		// Filter by included types
		const filteredEntries = this.filterEntriesByType(entries, mergedOptions.includeTypes || []);

		// Generate the changelog markdown
		const changelog = await this.formatChangelog(filteredEntries, mergedOptions);

		return changelog;
	}

	/**
	 * Get commits filtered by options
	 */
	private async getFilteredCommits(workspacePath: string, options: GenerateOptions): Promise<CommitInfo[]> {
		const commitRangeOptions: CommitRangeOptions = {
			commitCount: options.commitCount,
			fromDate: options.fromDate,
			toDate: options.toDate,
			fromTag: options.fromTag,
			toTag: options.toTag,
			fromSHA: options.fromSHA,
			toSHA: options.toSHA,
		};

		const commits = await this.gitService.getCommits(workspacePath, commitRangeOptions);

		// Filter out formatting-only commits if requested
		if (options.skipFormatting) {
			return commits.filter(commit => !this.gitService.isFormattingOnlyCommit(commit));
		}

		return commits;
	}

	/**
	 * Filter entries by commit type
	 */
	private filterEntriesByType(entries: ChangelogEntry[], includeTypes: string[]): ChangelogEntry[] {
		if (includeTypes.length === 0) {
			return entries;
		}
		return entries.filter(entry => includeTypes.includes(entry.type));
	}

	/**
	 * Format changelog entries into markdown
	 */
	private async formatChangelog(entries: ChangelogEntry[], options: GenerateOptions): Promise<string> {
		if (entries.length === 0) {
			return 'No significant changes found.';
		}

		const today = new Date().toISOString().split('T')[0];
		let changelog = `## [Unreleased] - ${today}\n\n`;

		// Generate summary
		const summary = await this.openaiService.generateSummary(entries);
		changelog += `${summary}\n\n`;

		if (options.groupByAuthor) {
			changelog += this.formatByAuthor(entries);
		} else {
			changelog += this.formatByType(entries);
		}

		return changelog;
	}

	/**
	 * Format entries grouped by type (public for testing)
	 */
	public formatByType(entries: ChangelogEntry[]): string {
		const typeOrder = ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore'];
		const typeLabels = {
			feat: '### ✨ Features',
			fix: '### 🐛 Bug Fixes',
			refactor: '### ♻️ Refactoring',
			docs: '### 📚 Documentation',
			style: '### 💄 Styling',
			test: '### 🧪 Testing',
			chore: '### 🔧 Maintenance'
		};

		const entriesByType = entries.reduce((acc, entry) => {
			if (!acc[entry.type]) {
				acc[entry.type] = [];
			}
			acc[entry.type].push(entry);
			return acc;
		}, {} as Record<string, ChangelogEntry[]>);

		let result = '';

		for (const type of typeOrder) {
			const typeEntries = entriesByType[type];
			if (!typeEntries || typeEntries.length === 0) {
				continue;
			}

			result += `${typeLabels[type as keyof typeof typeLabels]}\n\n`;
			
			for (const entry of typeEntries) {
				const shortHash = entry.commit.hash.substring(0, 7);
				result += `- ${entry.description} (${shortHash})\n`;
			}
			
			result += '\n';
		}

		return result;
	}

	/**
	 * Format entries grouped by author (public for testing)
	 */
	public formatByAuthor(entries: ChangelogEntry[]): string {
		const entriesByAuthor = entries.reduce((acc, entry) => {
			const author = entry.commit.author;
			if (!acc[author]) {
				acc[author] = [];
			}
			acc[author].push(entry);
			return acc;
		}, {} as Record<string, ChangelogEntry[]>);

		let result = '';

		for (const [author, authorEntries] of Object.entries(entriesByAuthor)) {
			result += `### 👤 ${author}\n\n`;
			
			// Group by type within author
			const typeOrder = ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore'];
			const entriesByType = authorEntries.reduce((acc, entry) => {
				if (!acc[entry.type]) {
					acc[entry.type] = [];
				}
				acc[entry.type].push(entry);
				return acc;
			}, {} as Record<string, ChangelogEntry[]>);

			for (const type of typeOrder) {
				const typeEntries = entriesByType[type];
				if (!typeEntries || typeEntries.length === 0) {
					continue;
				}

				const typeEmoji = {
					feat: '✨',
					fix: '🐛',
					refactor: '♻️',
					docs: '📚',
					style: '💄',
					test: '🧪',
					chore: '🔧'
				}[type] || '•';

				for (const entry of typeEntries) {
					const shortHash = entry.commit.hash.substring(0, 7);
					result += `- ${typeEmoji} ${entry.description} (${shortHash})\n`;
				}
			}
			
			result += '\n';
		}

		return result;
	}

	/**
	 * Merge options with configuration defaults
	 */
	private mergeWithDefaults(options: GenerateOptions): GenerateOptions {
		return {
			commitCount: options.commitCount || this.configService.getDefaultCommitCount(),
			fromDate: options.fromDate,
			toDate: options.toDate,
			fromTag: options.fromTag,
			toTag: options.toTag,
			fromSHA: options.fromSHA,
			toSHA: options.toSHA,
			includeTypes: options.includeTypes || this.configService.getIncludeCommitTypes(),
			skipFormatting: options.skipFormatting ?? this.configService.getSkipFormattingCommits(),
			groupByAuthor: options.groupByAuthor ?? this.configService.getGroupByAuthor(),
		};
	}

	/**
	 * Preview changelog without saving
	 */
	async previewChangelog(workspacePath: string, options: GenerateOptions = {}): Promise<string> {
		return this.generateChangelog(workspacePath, options);
	}

	/**
	 * Generate changelog for a specific tag range
	 */
	async generateReleaseChangelog(workspacePath: string, fromTag: string, toTag?: string): Promise<string> {
		const options: GenerateOptions = {
			fromTag,
			toTag: toTag || 'HEAD',
		};

		return this.generateChangelog(workspacePath, options);
	}

	/**
	 * Generate changelog for date range
	 */
	async generateDateRangeChangelog(
		workspacePath: string, 
		fromDate: string, 
		toDate?: string
	): Promise<string> {
		const options: GenerateOptions = {
			fromDate,
			toDate,
		};

		return this.generateChangelog(workspacePath, options);
	}
}
