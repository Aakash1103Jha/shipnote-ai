import * as vscode from 'vscode';
import { ChangelogGenerator } from '@/changelog';
import { ConfigService } from '@/config';

export class ChangelogWebviewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'shipnote-ai.changelogView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly changelogGenerator: ChangelogGenerator,
		private readonly configService: ConfigService
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async (data) => {
				switch (data.type) {
					case 'generateChangelog':
						await this.handleGenerateChangelog(data.options);
						break;
					case 'previewChangelog':
						await this.handlePreviewChangelog(data.options);
						break;
					case 'getConfig':
						await this.handleGetConfig();
						break;
					case 'updateConfig':
						await this.handleUpdateConfig(data.key, data.value);
						break;
				}
			},
			undefined,
		);
	}

	public show() {
		if (this._view) {
			this._view.show?.(true);
		}
	}

	private async handleGenerateChangelog(options: any) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				this.sendMessage('error', 'No workspace folder found');
				return;
			}

			this.sendMessage('loading', 'Generating changelog...');

			const changelog = await this.changelogGenerator.generateChangelog(
				workspaceFolder.uri.fsPath,
				options
			);

			this.sendMessage('changelogGenerated', changelog);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.sendMessage('error', errorMessage);
		}
	}

	private async handlePreviewChangelog(options: any) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				this.sendMessage('error', 'No workspace folder found');
				return;
			}

			this.sendMessage('loading', 'Generating preview...');

			const changelog = await this.changelogGenerator.previewChangelog(
				workspaceFolder.uri.fsPath,
				options
			);

			this.sendMessage('previewGenerated', changelog);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.sendMessage('error', errorMessage);
		}
	}

	private async handleGetConfig() {
		const config = {
			defaultCommitCount: this.configService.getDefaultCommitCount(),
			changelogStyle: this.configService.getChangelogStyle(),
			outputFileName: this.configService.getOutputFileName(),
			includeCommitTypes: this.configService.getIncludeCommitTypes(),
			skipFormattingCommits: this.configService.getSkipFormattingCommits(),
			groupByAuthor: this.configService.getGroupByAuthor(),
		};

		this.sendMessage('configData', config);
	}

	private async handleUpdateConfig(key: string, value: any) {
		try {
			await this.configService.updateConfig(key, value);
			this.sendMessage('configUpdated', { key, value });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.sendMessage('error', `Failed to update config: ${errorMessage}`);
		}
	}

	private sendMessage(type: string, data: any) {
		if (this._view) {
			this._view.webview.postMessage({ type, data });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>ShipNote AI Changelog</title>
			</head>
			<body>
				<div class="container">
					<h2>🚀 AI Changelog Generator</h2>
					
					<!-- Configuration Section -->
					<div class="section">
						<h3>⚙️ Configuration</h3>
						
						<div class="form-group">
							<label for="commitCount">Number of commits:</label>
							<input type="number" id="commitCount" value="10" min="1" max="100">
						</div>

						<div class="form-group">
							<label for="changelogStyle">Changelog style:</label>
							<select id="changelogStyle">
								<option value="dev-friendly">Developer Friendly</option>
								<option value="formal">Formal</option>
								<option value="pm-style">PM Style</option>
							</select>
						</div>

						<div class="form-group">
							<label>
								<input type="checkbox" id="skipFormatting" checked>
								Skip formatting-only commits
							</label>
						</div>

						<div class="form-group">
							<label>
								<input type="checkbox" id="groupByAuthor">
								Group by author
							</label>
						</div>
					</div>

					<!-- Commit Range Section -->
					<div class="section">
						<h3>📅 Commit Range</h3>
						
						<div class="form-group">
							<label for="rangeType">Range type:</label>
							<select id="rangeType">
								<option value="count">Last X commits</option>
								<option value="date">Date range</option>
								<option value="tags">Between tags</option>
								<option value="shas">Between SHAs</option>
							</select>
						</div>

						<div id="dateRange" class="range-config" style="display: none;">
							<div class="form-group">
								<label for="fromDate">From date:</label>
								<input type="date" id="fromDate">
							</div>
							<div class="form-group">
								<label for="toDate">To date (optional):</label>
								<input type="date" id="toDate">
							</div>
						</div>

						<div id="tagRange" class="range-config" style="display: none;">
							<div class="form-group">
								<label for="fromTag">From tag:</label>
								<input type="text" id="fromTag" placeholder="v1.0.0">
							</div>
							<div class="form-group">
								<label for="toTag">To tag (optional):</label>
								<input type="text" id="toTag" placeholder="v2.0.0">
							</div>
						</div>

						<div id="shaRange" class="range-config" style="display: none;">
							<div class="form-group">
								<label for="fromSHA">From SHA:</label>
								<input type="text" id="fromSHA" placeholder="abc123...">
							</div>
							<div class="form-group">
								<label for="toSHA">To SHA (optional):</label>
								<input type="text" id="toSHA" placeholder="def456...">
							</div>
						</div>
					</div>

					<!-- Actions Section -->
					<div class="section">
						<h3>🎯 Actions</h3>
						
						<div class="button-group">
							<button id="previewBtn" class="button secondary">Preview</button>
							<button id="generateBtn" class="button primary">Generate</button>
						</div>
					</div>

					<!-- Results Section -->
					<div class="section">
						<h3>📄 Results</h3>
						<div id="loading" class="loading" style="display: none;">
							<div class="spinner"></div>
							<span>Generating changelog...</span>
						</div>
						<div id="error" class="error" style="display: none;"></div>
						<div id="preview" class="preview" style="display: none;">
							<h4>Preview:</h4>
							<pre id="previewContent"></pre>
							<div class="button-group">
								<button id="copyBtn" class="button secondary">Copy to Clipboard</button>
								<button id="insertBtn" class="button primary">Insert into CHANGELOG.md</button>
							</div>
						</div>
					</div>
				</div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
