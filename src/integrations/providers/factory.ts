import { AIProvider, AIProviderFactory, AIProviderType } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GoogleProvider } from './google-provider';
import { OfflineProvider } from './offline-provider';

export class ProviderFactory implements AIProviderFactory {
	createProvider(type: AIProviderType): AIProvider {
		switch (type) {
			case 'openai':
				return new OpenAIProvider();
			case 'anthropic':
				return new AnthropicProvider();
			case 'google':
				return new GoogleProvider();
			case 'offline':
				return new OfflineProvider();
			case 'azure':
				// TODO: Implement Azure OpenAI provider
				throw new Error('Azure OpenAI provider not yet implemented');
			default:
				throw new Error(`Unknown provider type: ${type}`);
		}
	}

	getSupportedProviders(): AIProviderType[] {
		return ['openai', 'anthropic', 'google', 'offline'];
	}
}

// Singleton instance
export const providerFactory = new ProviderFactory();
