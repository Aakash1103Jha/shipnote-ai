/**
 * Integration test for error sanitization in AI providers
 * Verifies that API key exposure vulnerabilities are properly handled
 */

import * as assert from 'assert';
import { GoogleProvider } from '../../integrations/providers/google-provider';
import { AnthropicProvider } from '../../integrations/providers/anthropic-provider';
import { OpenAIProvider } from '../../integrations/providers/openai-provider';
import { sanitizeErrorMessage } from '../../integrations/providers/error-sanitizer';

suite('Provider Error Sanitization Integration', () => {
	suite('GoogleProvider Error Handling', () => {
		test('should sanitize API errors from Google provider', async () => {
			const provider = new GoogleProvider();
			// Initialize with a fake API key to trigger authentication error
			await provider.initialize({ apiKey: 'fake-google-key' });
			
			try {
				// This should fail and throw a sanitized error
				await provider.processCommits([{
					hash: 'abc123',
					message: 'test commit',
					author: 'test author',
					date: new Date().toISOString(),
					diff: ''
				}], 'formal');
				assert.fail('Expected error to be thrown');
			} catch (error) {
				const errorMessage = (error as Error).message;
				// Verify the error doesn't contain the fake API key
				assert.ok(!errorMessage.includes('fake-google-key'));
				// Verify it contains sanitized placeholder
				assert.ok(errorMessage.includes('[REDACTED]') || errorMessage.includes('Google Gemini API error'));
			}
		});
	});

	suite('AnthropicProvider Error Handling', () => {
		test('should sanitize API errors from Anthropic provider', async () => {
			const provider = new AnthropicProvider();
			// Initialize with a fake API key to trigger authentication error
			await provider.initialize({ apiKey: 'sk-ant-api03-fake-key-1234567890123456789012345678901234567890' });
			
			try {
				// This should fail and throw a sanitized error
				await provider.processCommits([{
					hash: 'abc123',
					message: 'test commit',
					author: 'test author',
					date: new Date().toISOString(),
					diff: ''
				}], 'formal');
				assert.fail('Expected error to be thrown');
			} catch (error) {
				const errorMessage = (error as Error).message;
				// Verify the error doesn't contain the fake API key
				assert.ok(!errorMessage.includes('sk-ant-api03-fake-key-1234567890123456789012345678901234567890'));
				// Verify it contains sanitized placeholder
				assert.ok(errorMessage.includes('[REDACTED]') || errorMessage.includes('Anthropic API error'));
			}
		});
	});

	suite('OpenAIProvider Error Handling', () => {
		test('should sanitize console.error messages', () => {
			// Test that console.error messages are sanitized
			const originalConsoleError = console.error;
			let capturedMessage = '';
			
			// Mock console.error to capture what would be logged
			console.error = (message: string, error: string) => {
				capturedMessage = `${message} ${error}`;
			};
			
			try {
				const provider = new OpenAIProvider();
				// Simulate an error that would contain an API key
				const fakeError = new Error('OpenAI API error: 401 Invalid API key sk-1234567890abcdef1234567890abcdef1234567890ab');
				
				// This would normally be called in a catch block
				const sanitizedError = sanitizeErrorMessage(String(fakeError));
				console.error('OpenAI API error:', sanitizedError);
				
				// Verify the captured message doesn't contain the API key
				assert.ok(!capturedMessage.includes('sk-1234567890abcdef1234567890abcdef1234567890ab'));
				assert.ok(capturedMessage.includes('[REDACTED]'));
			} finally {
				console.error = originalConsoleError;
			}
		});
	});

	suite('Cross-Provider Sanitization', () => {
		test('should handle mixed error patterns', () => {
			// Test error messages that might contain multiple types of keys
			const mixedError = 'Multiple API failures: OpenAI key sk-1234567890abcdef1234567890abcdef1234567890ab, Google key AIzaSyC-abcdef123456789012345678901234567890, Anthropic key sk-ant-api03-abcdef123456789012345678901234567890abcdef';
			const sanitized = sanitizeErrorMessage(mixedError);
			
			// Verify all keys are sanitized
			assert.ok(!sanitized.includes('sk-1234567890abcdef1234567890abcdef1234567890ab'));
			assert.ok(!sanitized.includes('AIzaSyC-abcdef123456789012345678901234567890'));
			assert.ok(!sanitized.includes('sk-ant-api03-abcdef123456789012345678901234567890abcdef'));
			
			// Verify redactions are present
			const redactedCount = (sanitized.match(/\[REDACTED\]/g) || []).length;
			assert.strictEqual(redactedCount, 3);
		});

		test('should preserve non-sensitive parts of error messages', () => {
			const error = 'API request failed with status 401: Invalid API key sk-1234567890abcdef1234567890abcdef1234567890ab. Please check your credentials and try again.';
			const sanitized = sanitizeErrorMessage(error);
			
			// Should preserve error context
			assert.ok(sanitized.includes('API request failed with status 401'));
			assert.ok(sanitized.includes('Please check your credentials'));
			
			// Should sanitize the key
			assert.ok(!sanitized.includes('sk-1234567890abcdef1234567890abcdef1234567890ab'));
			assert.ok(sanitized.includes('[REDACTED]'));
		});
	});
});
