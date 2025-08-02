import * as vscode from 'vscode';
import { GitService } from '@/integrations/git';
import { OpenAIService } from '@/integrations/openai';
import { ChangelogGenerator } from '@/core/changelog';
import { ConfigService } from '@/config/config';
import { ChangelogWebviewProvider } from '@/webview/ChangelogWebviewProvider';
import { StyleRecommendationService } from '@/core/styleRecommendation';

export function activate(context: vscode.ExtensionContext) {
	console.log('ShipNote AI Changelog Generator is now active!');

	// Initialize services
	const gitService = new GitService();
	const configService = new ConfigService(context);
	const openaiService = new OpenAIService(configService);
	const changelogGenerator = new ChangelogGenerator(gitService, openaiService, configService);
	const styleRecommendationService = new StyleRecommendationService(configService);

	// Register webview provider
	const changelogWebviewProvider = new ChangelogWebviewProvider(
		context.extensionUri,
		changelogGenerator,
		configService
	);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'shipnote-ai.changelogView',
			changelogWebviewProvider
		)
	);

	// Register commands
	const generateChangelogCommand = vscode.commands.registerCommand(
		'shipnote-ai.generateChangelog',
		async () => {
			try {
				// Check if OpenAI key is set
				const apiKey = await configService.getOpenAIKey();
				if (!apiKey) {
					const result = await vscode.window.showWarningMessage(
						'OpenAI API key is not set. Would you like to set it now?',
						'Set API Key',
						'Cancel'
					);
					if (result === 'Set API Key') {
						await vscode.commands.executeCommand('shipnote-ai.setOpenAIKey');
						return;
					}
					return;
				}

				// Show progress
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: 'Generating changelog...',
						cancellable: false,
					},
					async (progress) => {
						progress.report({ increment: 20, message: 'Fetching commits...' });
						
						const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
						if (!workspaceFolder) {
							throw new Error('No workspace folder found');
						}

						progress.report({ increment: 40, message: 'Analyzing commits with AI...' });
						
						const changelog = await changelogGenerator.generateChangelog(
							workspaceFolder.uri.fsPath,
							{ commitCount: 10 } // Default options, can be made configurable
						);

						progress.report({ increment: 80, message: 'Formatting changelog...' });

						// Show options for what to do with the changelog
						const action = await vscode.window.showInformationMessage(
							'Changelog generated successfully!',
							'Insert into CHANGELOG.md',
							'Copy to Clipboard',
							'Show in Editor'
						);

						switch (action) {
							case 'Insert into CHANGELOG.md':
								await insertIntoChangelog(changelog);
								break;
							case 'Copy to Clipboard':
								await vscode.env.clipboard.writeText(changelog);
								vscode.window.showInformationMessage('Changelog copied to clipboard!');
								break;
							case 'Show in Editor':
								const doc = await vscode.workspace.openTextDocument({
									content: changelog,
									language: 'markdown'
								});
								await vscode.window.showTextDocument(doc);
								break;
						}

						progress.report({ increment: 100, message: 'Complete!' });
					}
				);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				vscode.window.showErrorMessage(`Failed to generate changelog: ${errorMessage}`);
			}
		}
	);

	const setOpenAIKeyCommand = vscode.commands.registerCommand(
		'shipnote-ai.setOpenAIKey',
		async () => {
			const apiKey = await vscode.window.showInputBox({
				prompt: 'Enter your OpenAI API Key',
				password: true,
				placeHolder: 'sk-...',
				validateInput: (value) => {
					if (!value || !value.startsWith('sk-')) {
						return 'Please enter a valid OpenAI API key starting with "sk-"';
					}
					return null;
				}
			});

			if (apiKey) {
				await configService.setOpenAIKey(apiKey);
				vscode.window.showInformationMessage('OpenAI API key saved successfully!');
			}
		}
	);

	const configureCommitRangeCommand = vscode.commands.registerCommand(
		'shipnote-ai.configureCommitRange',
		async () => {
			try {
				const options = [
					'Last X commits',
					'From date to date',
					'From date to now',
					'Between two tags',
					'Between two SHAs'
				];

				const selection = await vscode.window.showQuickPick(options, {
					placeHolder: 'Select commit range type'
				});

				if (!selection) {
					return; // User cancelled
				}

				let generateOptions: any = {};

				switch (selection) {
					case 'Last X commits':
						const commitCount = await vscode.window.showInputBox({
							prompt: 'How many commits to include?',
							placeHolder: '10',
							validateInput: (value) => {
								const num = parseInt(value);
								if (isNaN(num) || num <= 0 || num > 1000) {
									return 'Please enter a valid number between 1 and 1000';
								}
								return null;
							}
						});
						if (commitCount) {
							generateOptions.commitCount = parseInt(commitCount);
						}
						break;

					case 'From date to date':
						const fromDate = await vscode.window.showInputBox({
							prompt: 'From date (YYYY-MM-DD)',
							placeHolder: '2024-01-01',
							validateInput: (value) => {
								if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
									return 'Please enter date in YYYY-MM-DD format';
								}
								return null;
							}
						});
						if (!fromDate) {
							return;
						}

						const toDate = await vscode.window.showInputBox({
							prompt: 'To date (YYYY-MM-DD)',
							placeHolder: '2024-12-31',
							validateInput: (value) => {
								if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
									return 'Please enter date in YYYY-MM-DD format';
								}
								return null;
							}
						});
						if (toDate) {
							generateOptions.fromDate = fromDate;
							generateOptions.toDate = toDate;
						}
						break;

					case 'From date to now':
						const fromDateNow = await vscode.window.showInputBox({
							prompt: 'From date (YYYY-MM-DD)',
							placeHolder: '2024-01-01',
							validateInput: (value) => {
								if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
									return 'Please enter date in YYYY-MM-DD format';
								}
								return null;
							}
						});
						if (fromDateNow) {
							generateOptions.fromDate = fromDateNow;
						}
						break;

					case 'Between two tags':
						const fromTag = await vscode.window.showInputBox({
							prompt: 'From tag',
							placeHolder: 'v1.0.0',
							validateInput: (value) => {
								if (!value || value.trim().length === 0) {
									return 'Please enter a valid tag name';
								}
								return null;
							}
						});
						if (!fromTag) {
							return;
						}

						const toTag = await vscode.window.showInputBox({
							prompt: 'To tag',
							placeHolder: 'v2.0.0',
							validateInput: (value) => {
								if (!value || value.trim().length === 0) {
									return 'Please enter a valid tag name';
								}
								return null;
							}
						});
						if (toTag) {
							generateOptions.fromTag = fromTag;
							generateOptions.toTag = toTag;
						}
						break;

					case 'Between two SHAs':
						const fromSHA = await vscode.window.showInputBox({
							prompt: 'From commit SHA',
							placeHolder: 'abc123def456...',
							validateInput: (value) => {
								if (!value || value.trim().length < 7) {
									return 'Please enter a valid commit SHA (at least 7 characters)';
								}
								return null;
							}
						});
						if (!fromSHA) {
							return;
						}

						const toSHA = await vscode.window.showInputBox({
							prompt: 'To commit SHA',
							placeHolder: 'def456abc123...',
							validateInput: (value) => {
								if (!value || value.trim().length < 7) {
									return 'Please enter a valid commit SHA (at least 7 characters)';
								}
								return null;
							}
						});
						if (toSHA) {
							generateOptions.fromSHA = fromSHA;
							generateOptions.toSHA = toSHA;
						}
						break;
				}

				// If we have valid options, generate the changelog
				if (Object.keys(generateOptions).length > 0) {
					// Check if OpenAI key is set
					const apiKey = await configService.getOpenAIKey();
					if (!apiKey) {
						const result = await vscode.window.showWarningMessage(
							'OpenAI API key is not set. Would you like to set it now?',
							'Set API Key',
							'Cancel'
						);
						if (result === 'Set API Key') {
							await vscode.commands.executeCommand('shipnote-ai.setOpenAIKey');
							return;
						}
						return;
					}

					// Generate changelog with custom range
					await vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: `Generating changelog for ${selection.toLowerCase()}...`,
							cancellable: false,
						},
						async (progress) => {
							progress.report({ increment: 20, message: 'Fetching commits...' });
							
							const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
							if (!workspaceFolder) {
								throw new Error('No workspace folder found');
							}

							progress.report({ increment: 40, message: 'Processing commits with AI...' });
							
							const changelog = await changelogGenerator.generateChangelog(
								workspaceFolder.uri.fsPath,
								generateOptions
							);

							progress.report({ increment: 80, message: 'Formatting changelog...' });

							// Show options for what to do with the changelog
							const action = await vscode.window.showInformationMessage(
								'Changelog generated successfully!',
								'Insert into CHANGELOG.md',
								'Copy to Clipboard',
								'Show in Editor'
							);

							switch (action) {
								case 'Insert into CHANGELOG.md':
									await insertIntoChangelog(changelog);
									break;
								case 'Copy to Clipboard':
									await vscode.env.clipboard.writeText(changelog);
									vscode.window.showInformationMessage('Changelog copied to clipboard!');
									break;
								case 'Show in Editor':
									const doc = await vscode.workspace.openTextDocument({
										content: changelog,
										language: 'markdown'
									});
									await vscode.window.showTextDocument(doc);
									break;
							}

							progress.report({ increment: 100, message: 'Complete!' });
						}
					);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				vscode.window.showErrorMessage(`Failed to configure commit range: ${errorMessage}`);
			}
		}
	);

	const openChangelogPanelCommand = vscode.commands.registerCommand(
		'shipnote-ai.openChangelogPanel',
		() => {
			changelogWebviewProvider.show();
		}
	);

	const getStyleRecommendationCommand = vscode.commands.registerCommand(
		'shipnote-ai.getStyleRecommendation',
		async () => {
			try {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const workspacePath = workspaceFolders[0].uri.fsPath;
				
				// Show progress
				await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Analyzing project for style recommendation...",
					cancellable: false
				}, async (progress) => {
					progress.report({ increment: 30, message: "Analyzing package.json and project structure..." });
					
					const recommendation = await styleRecommendationService.getStyleRecommendation(workspacePath);
					
					progress.report({ increment: 70, message: "Generating recommendation..." });
					
					// Show recommendation dialog
					const userChoice = await styleRecommendationService.showRecommendationDialog(recommendation);
					
					if (userChoice !== 'skip') {
						await styleRecommendationService.applyRecommendation(userChoice);
						vscode.window.showInformationMessage(
							`Writing style updated to: ${userChoice}. You can change this anytime in settings.`
						);
					}
				});
			} catch (error) {
				console.error('Error getting style recommendation:', error);
				vscode.window.showErrorMessage(
					`Failed to get style recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}
	);

	// Register all commands
	context.subscriptions.push(
		generateChangelogCommand,
		setOpenAIKeyCommand,
		configureCommitRangeCommand,
		openChangelogPanelCommand,
		getStyleRecommendationCommand
	);

	// Show welcome message on first activation
	const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
	if (!hasShownWelcome) {
		vscode.window.showInformationMessage(
			'Welcome to ShipNote AI Changelog Generator! Let\'s get you set up.',
			'Set API Key', 'Get Style Recommendation'
		).then((selection) => {
			if (selection === 'Set API Key') {
				vscode.commands.executeCommand('shipnote-ai.setOpenAIKey');
			} else if (selection === 'Get Style Recommendation') {
				vscode.commands.executeCommand('shipnote-ai.getStyleRecommendation');
			}
		});
		context.globalState.update('hasShownWelcome', true);
	}
}

async function insertIntoChangelog(changelog: string): Promise<void> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		throw new Error('No workspace folder found');
	}

	const changelogPath = vscode.Uri.joinPath(workspaceFolder.uri, 'CHANGELOG.md');
	
	try {
		// Try to read existing changelog
		const existingContent = await vscode.workspace.fs.readFile(changelogPath);
		const existingText = Buffer.from(existingContent).toString('utf8');
		
		// Insert new changelog at the top (after any title)
		const lines = existingText.split('\n');
		let insertIndex = 0;
		
		// Skip title if it exists
		if (lines[0]?.startsWith('# ')) {
			insertIndex = 2; // Skip title and empty line
		}
		
		lines.splice(insertIndex, 0, changelog, '');
		const newContent = lines.join('\n');
		
		await vscode.workspace.fs.writeFile(changelogPath, Buffer.from(newContent, 'utf8'));
	} catch (error) {
		// File doesn't exist, create it
		const content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${changelog}`;
		await vscode.workspace.fs.writeFile(changelogPath, Buffer.from(content, 'utf8'));
	}
	
	// Open the file
	const doc = await vscode.workspace.openTextDocument(changelogPath);
	await vscode.window.showTextDocument(doc);
	
	vscode.window.showInformationMessage('Changelog inserted into CHANGELOG.md');
}

export function deactivate() {
	console.log('ShipNote AI Changelog Generator is now deactivated');
}
