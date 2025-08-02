// Types
export * from './types';

// Base provider
export { BaseAIProvider } from './base-provider';

// Specific providers
export { OpenAIProvider } from './openai-provider';
export { AnthropicProvider } from './anthropic-provider';
export { GoogleProvider } from './google-provider';
export { OfflineProvider } from './offline-provider';

// Factory
export { ProviderFactory, providerFactory } from './factory';

// Convenience function to create providers
import { providerFactory } from './factory';
import { AIProviderType, AIProvider } from './types';

export function createAIProvider(type: AIProviderType): AIProvider {
	return providerFactory.createProvider(type);
}
