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

	/**
	 * Recommend writing style based on project context
	 */
	recommendWritingStyle(): { style: string; reason: string; confidence: number } {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return { style: 'dev-friendly', reason: 'Default recommendation', confidence: 0.5 };
		}

		let score = {
			formal: 0,
			'dev-friendly': 0,
			'pm-style': 0
		};

		const workspaceName = workspaceFolder.name.toLowerCase();
		const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');

		// Check for enterprise indicators
		if (workspaceName.includes('enterprise') || 
			workspaceName.includes('corp') || 
			workspaceName.includes('business')) {
			score.formal += 0.3;
		}

		// Check for developer tool indicators
		if (workspaceName.includes('cli') || 
			workspaceName.includes('sdk') || 
			workspaceName.includes('api') ||
			workspaceName.includes('lib')) {
			score['dev-friendly'] += 0.3;
		}

		// Check for product indicators
		if (workspaceName.includes('app') || 
			workspaceName.includes('mobile') || 
			workspaceName.includes('web') ||
			workspaceName.includes('product')) {
			score['pm-style'] += 0.2;
		}

		// Try to read package.json for more context
		try {
			// This would be async in real implementation, but keeping simple for now
			// Could check for dependencies, keywords, description
		} catch (error) {
			// Continue with current scoring
		}

		// Base preferences
		score['dev-friendly'] += 0.4; // Default lean towards dev-friendly

		// Find highest scoring style
		const topStyle = Object.entries(score).reduce((a, b) => 
			score[a[0] as keyof typeof score] > score[b[0] as keyof typeof score] ? a : b
		);

		const styleReasons = {
			'formal': 'Detected enterprise/business context in project',
			'dev-friendly': 'Best for technical teams and open source projects',  
			'pm-style': 'Detected user-facing product context'
		};

		return {
			style: topStyle[0],
			reason: styleReasons[topStyle[0] as keyof typeof styleReasons],
			confidence: topStyle[1]
		};
	}

	/**
	 * Get writing style examples for user guidance
	 */
	getStyleExamples(): Record<string, { description: string; example: string }> {
		return {
			'formal': {
				description: 'Professional language for enterprise documentation',
				example: 'Implemented OAuth 2.0 authentication system to enhance security and user access management.'
			},
			'dev-friendly': {
				description: 'Clear technical language for developers',
				example: 'Fix memory leak in user session cleanup that was causing performance degradation.'
			},
			'pm-style': {
				description: 'User-focused language explaining benefits',
				example: 'Improved app performance by fixing an issue that could slow down the application.'
			}
		};
	}
}
