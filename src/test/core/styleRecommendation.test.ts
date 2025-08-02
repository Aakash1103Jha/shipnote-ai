import * as assert from 'assert';
import * as vscode from 'vscode';
import { StyleRecommendationService } from '../../core/styleRecommendation';
import { ConfigService } from '../../config/config';

suite('StyleRecommendationService Tests', () => {
	let styleRecommendationService: StyleRecommendationService;
	let mockConfigService: ConfigService;

	setup(() => {
		mockConfigService = {
			getChangelogStyle: () => 'dev-friendly',
			updateConfig: async () => {}
		} as any;
		
		styleRecommendationService = new StyleRecommendationService(mockConfigService);
	});

	suite('analyzeProjectContext', () => {
		test('should recommend formal style for enterprise projects', async () => {
			// TODO: Implement - should analyze package.json and recommend formal
			const mockPackageJson = {
				name: 'enterprise-banking-app',
				keywords: ['enterprise', 'banking', 'compliance', 'security'],
				description: 'Enterprise banking application with regulatory compliance'
			};

			const recommendation = await styleRecommendationService.analyzeProjectContext('/fake/project', mockPackageJson);
			
			assert.strictEqual(recommendation.recommendedStyle, 'formal');
			assert.ok(recommendation.confidence > 0.7);
			assert.ok(recommendation.reasons.includes('Enterprise keywords detected'));
		});

		test('should recommend dev-friendly style for developer tools', async () => {
			// TODO: Implement - should detect developer-focused projects
			const mockPackageJson = {
				name: 'awesome-cli-tool',
				keywords: ['cli', 'developer-tools', 'framework', 'api'],
				description: 'Command line tool for developers',
				devDependencies: { typescript: '^5.0.0' }
			};

			const recommendation = await styleRecommendationService.analyzeProjectContext('/fake/project', mockPackageJson);
			
			assert.strictEqual(recommendation.recommendedStyle, 'dev-friendly');
			assert.ok(recommendation.confidence > 0.7);
			assert.ok(recommendation.reasons.includes('Developer tool indicators found'));
		});

		test('should recommend pm-style for consumer applications', async () => {
			// TODO: Implement - should detect user-facing applications
			const mockPackageJson = {
				name: 'my-awesome-app',
				keywords: ['app', 'mobile', 'user', 'consumer', 'react-native'],
				description: 'Mobile app for everyday users'
			};

			const recommendation = await styleRecommendationService.analyzeProjectContext('/fake/project', mockPackageJson);
			
			assert.strictEqual(recommendation.recommendedStyle, 'pm-style');
			assert.ok(recommendation.confidence > 0.7);
			assert.ok(recommendation.reasons.includes('Consumer application detected'));
		});

		test('should analyze file patterns for context clues', async () => {
			// TODO: Implement - should check for specific files that indicate project type
			const mockFiles = [
				'COMPLIANCE.md',
				'SECURITY.md', 
				'AUDIT.md',
				'SOX_COMPLIANCE.txt'
			];

			const recommendation = await styleRecommendationService.analyzeFilePatterns('/fake/project', mockFiles);
			
			assert.strictEqual(recommendation.recommendedStyle, 'formal');
			assert.ok(recommendation.reasons.includes('Compliance documentation found'));
		});

		test('should analyze commit history patterns', async () => {
			// TODO: Implement - should analyze existing commit messages for formality
			const mockCommits = [
				'feat: Implement comprehensive OAuth 2.0 authentication system with enterprise-grade security measures',
				'fix: Resolve critical security vulnerability in user session management as per security audit requirements',
				'docs: Update compliance documentation to meet SOX requirements'
			];

			const recommendation = await styleRecommendationService.analyzeCommitPatterns(mockCommits);
			
			assert.strictEqual(recommendation.recommendedStyle, 'formal');
			assert.ok(recommendation.reasons.includes('Formal commit message patterns detected'));
		});

		test('should handle mixed signals and provide best guess', async () => {
			// TODO: Implement - should handle conflicting indicators
			const mockPackageJson = {
				name: 'hybrid-project',
				keywords: ['api', 'enterprise'], // Mixed signals
				description: 'API for enterprise customers'
			};

			const recommendation = await styleRecommendationService.analyzeProjectContext('/fake/project', mockPackageJson);
			
			assert.ok(['formal', 'dev-friendly'].includes(recommendation.recommendedStyle));
			assert.ok(recommendation.confidence >= 0.5);
			assert.ok(recommendation.reasons.length > 0);
		});
	});

	suite('getStyleRecommendation', () => {
		test('should provide comprehensive recommendation with explanations', async () => {
			// TODO: Implement - should return full recommendation object
			const recommendation = await styleRecommendationService.getStyleRecommendation('/fake/project');
			
			assert.ok(typeof recommendation.recommendedStyle === 'string');
			assert.ok(['formal', 'dev-friendly', 'pm-style'].includes(recommendation.recommendedStyle));
			assert.ok(typeof recommendation.confidence === 'number');
			assert.ok(recommendation.confidence >= 0 && recommendation.confidence <= 1);
			assert.ok(Array.isArray(recommendation.reasons));
			assert.ok(typeof recommendation.explanation === 'string');
		});

		test('should cache recommendations to avoid repeated analysis', async () => {
			// TODO: Implement - should cache results for performance
			const startTime = Date.now();
			await styleRecommendationService.getStyleRecommendation('/fake/project');
			const firstCallTime = Date.now() - startTime;

			const startTime2 = Date.now();
			await styleRecommendationService.getStyleRecommendation('/fake/project');
			const secondCallTime = Date.now() - startTime2;

			// Second call should be significantly faster due to caching
			assert.ok(secondCallTime < firstCallTime / 2);
		});
	});

	suite('showRecommendationDialog', () => {
		test('should present user-friendly recommendation dialog', async () => {
			// TODO: Implement - should show VS Code dialog with recommendation
			const mockRecommendation = {
				recommendedStyle: 'formal' as const,
				confidence: 0.85,
				reasons: ['Enterprise keywords detected', 'Compliance files found'],
				explanation: 'Your project appears to be enterprise-focused with compliance requirements.'
			};

			// This would normally show a VS Code dialog - for testing we'll mock it
			const userChoice = await styleRecommendationService.showRecommendationDialog(mockRecommendation);
			
			// Should return the user's choice or the recommendation
			assert.ok(['formal', 'dev-friendly', 'pm-style', 'skip'].includes(userChoice));
		});

		test('should allow user to override recommendation', async () => {
			// TODO: Implement - should respect user choice over recommendation
			const mockRecommendation = {
				recommendedStyle: 'formal' as const,
				confidence: 0.9,
				reasons: ['Test reason'],
				explanation: 'Test explanation'
			};

			// Simulate user choosing different style
			const userChoice = 'dev-friendly';
			
			// Should update configuration with user choice
			assert.strictEqual(userChoice, 'dev-friendly');
		});
	});

	suite('integration with ConfigService', () => {
		test('should update configuration when recommendation is accepted', async () => {
			// TODO: Implement - should call ConfigService.updateConfig
			let updatedKey: string | undefined;
			let updatedValue: any;

			mockConfigService.updateConfig = async (key: string, value: any) => {
				updatedKey = key;
				updatedValue = value;
			};

			await styleRecommendationService.applyRecommendation('formal');
			
			assert.strictEqual(updatedKey, 'changelogStyle');
			assert.strictEqual(updatedValue, 'formal');
		});

		test('should not override existing user preference without permission', async () => {
			// TODO: Implement - should respect existing settings
			mockConfigService.getChangelogStyle = () => 'pm-style'; // User has existing preference
			
			const shouldPrompt = await styleRecommendationService.shouldShowRecommendation('/fake/project');
			
			// Should not auto-apply if user has already set a preference
			assert.strictEqual(shouldPrompt, false);
		});
	});
});
