import * as assert from 'assert';
import { ProviderFactory, providerFactory } from '../../../integrations/providers/factory';
import { OpenAIProvider } from '../../../integrations/providers/openai-provider';
import { AnthropicProvider } from '../../../integrations/providers/anthropic-provider';
import { GoogleProvider } from '../../../integrations/providers/google-provider';
import { OfflineProvider } from '../../../integrations/providers/offline-provider';

suite('ProviderFactory Test Suite', () => {
	let factory: ProviderFactory;

	setup(() => {
		factory = new ProviderFactory();
	});

	suite('Provider Creation', () => {
		test('should create OpenAI provider', () => {
			const provider = factory.createProvider('openai');
			assert.ok(provider instanceof OpenAIProvider);
			assert.strictEqual(provider.name, 'OpenAI');
		});

		test('should create Anthropic provider', () => {
			const provider = factory.createProvider('anthropic');
			assert.ok(provider instanceof AnthropicProvider);
			assert.strictEqual(provider.name, 'Anthropic Claude');
		});

		test('should create Google provider', () => {
			const provider = factory.createProvider('google');
			assert.ok(provider instanceof GoogleProvider);
			assert.strictEqual(provider.name, 'Google Gemini');
		});

		test('should create Offline provider', () => {
			const provider = factory.createProvider('offline');
			assert.ok(provider instanceof OfflineProvider);
			assert.strictEqual(provider.name, 'Offline');
		});

		test('should throw error for Azure provider (not implemented)', () => {
			assert.throws(() => {
				factory.createProvider('azure');
			}, /Azure OpenAI provider not yet implemented/);
		});

		test('should throw error for unknown provider type', () => {
			assert.throws(() => {
				factory.createProvider('unknown' as any);
			}, /Unknown provider type: unknown/);
		});
	});

	suite('Supported Providers', () => {
		test('should return list of supported providers', () => {
			const supportedProviders = factory.getSupportedProviders();
			
			assert.deepStrictEqual(supportedProviders, ['openai', 'anthropic', 'google', 'offline']);
		});

		test('should not include Azure in supported providers (not implemented)', () => {
			const supportedProviders = factory.getSupportedProviders();
			
			assert.ok(!supportedProviders.includes('azure' as any));
		});
	});

	suite('Singleton Factory', () => {
		test('should provide singleton instance', () => {
			const provider1 = providerFactory.createProvider('openai');
			const provider2 = providerFactory.createProvider('openai');

			// Should create different instances of providers (not singleton providers)
			assert.notStrictEqual(provider1, provider2);
			
			// But both should be OpenAI providers
			assert.ok(provider1 instanceof OpenAIProvider);
			assert.ok(provider2 instanceof OpenAIProvider);
		});
	});

	suite('Provider Interface Compliance', () => {
		test('all providers should implement required interface methods', () => {
			const providerTypes = factory.getSupportedProviders();

			for (const type of providerTypes) {
				const provider = factory.createProvider(type);

				// Check required properties
				assert.ok(typeof provider.name === 'string');
				assert.ok(Array.isArray(provider.availableModels));
				assert.ok(typeof provider.defaultModel === 'string');

				// Check required methods
				assert.ok(typeof provider.initialize === 'function');
				assert.ok(typeof provider.isConfigured === 'function');
				assert.ok(typeof provider.processCommits === 'function');
				assert.ok(typeof provider.generateSummary === 'function');
				assert.ok(typeof provider.categorizeCommit === 'function');
				assert.ok(typeof provider.enhanceDescription === 'function');
			}
		});

		test('all providers should have non-empty available models', () => {
			const providerTypes = factory.getSupportedProviders();

			for (const type of providerTypes) {
				const provider = factory.createProvider(type);
				
				assert.ok(provider.availableModels.length > 0, `${provider.name} should have available models`);
				assert.ok(provider.availableModels.includes(provider.defaultModel), 
					`${provider.name} default model should be in available models`);
			}
		});
	});
});
