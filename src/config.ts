import * as vscode from 'vscode';

export class ConfigService {
	private static readonly OPENAI_KEY = 'shipnote-ai.openaiKey';

	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Get OpenAI API key from secure storage
	 */
	async getOpenAIKey(): Promise<string | undefined> {
		return await this.context.secrets.get(ConfigService.OPENAI_KEY);
	}

	/**
	 * Set OpenAI API key in secure storage
	 */
	async setOpenAIKey(apiKey: string): Promise<void> {
		await this.context.secrets.store(ConfigService.OPENAI_KEY, apiKey);
	}

	/**
	 * Get changelog style preference
	 */
	getChangelogStyle(): string {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('changelogStyle', 'dev-friendly');
	}

	/**
	 * Get default commit count
	 */
	getDefaultCommitCount(): number {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('defaultCommitCount', 10);
	}

	/**
	 * Get output file name
	 */
	getOutputFileName(): string {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('outputFileName', 'CHANGELOG.md');
	}

	/**
	 * Get included commit types
	 */
	getIncludeCommitTypes(): string[] {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('includeCommitTypes', ['feat', 'fix', 'docs', 'refactor']);
	}

	/**
	 * Check if formatting commits should be skipped
	 */
	getSkipFormattingCommits(): boolean {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('skipFormattingCommits', true);
	}

	/**
	 * Check if entries should be grouped by author
	 */
	getGroupByAuthor(): boolean {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		return config.get('groupByAuthor', false);
	}

	/**
	 * Update configuration value
	 */
	async updateConfig(key: string, value: any): Promise<void> {
		const config = vscode.workspace.getConfiguration('shipnote-ai');
		await config.update(key, value, vscode.ConfigurationTarget.Global);
	}
}
