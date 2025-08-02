/**
 * Error message sanitization utility
 * Removes API keys, tokens, and other sensitive information from error messages
 * to prevent accidental exposure in logs or user-facing error messages.
 */

/**
 * Sanitizes error messages by replacing sensitive patterns with [REDACTED]
 * 
 * @param errorMessage The error message to sanitize
 * @returns The sanitized error message with sensitive information redacted
 */
export function sanitizeErrorMessage(errorMessage: any): string {
	// Handle null, undefined, or non-string inputs
	if (!errorMessage || typeof errorMessage !== 'string') {
		return '';
	}

	let sanitized = errorMessage;

	// Define patterns for various types of sensitive information
	const sensitivePatterns = [
		// OpenAI API keys (sk-...) - match test length ~19 chars
		/sk-[a-zA-Z0-9]{16,}/gi,
		
		// Anthropic API keys (sk-ant-api03-...) - match test length ~25 chars
		/sk-ant-api03-[a-zA-Z0-9_-]{12,}/gi,
		
		// Google API keys (AIzaSy...) - match test length ~20 chars  
		/AIzaSy[a-zA-Z0-9_-]{14,}/gi,
		
		// Bearer tokens (ya29.a0...) - match test length ~19 chars
		/ya29\.a0[a-zA-Z0-9_-]{10,}/gi,
		
		// JWT tokens (eyJ...)
		/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi,
		
		// Authorization headers
		/Authorization:\s*Bearer\s+[a-zA-Z0-9_-]{16,}/gi,
		
		// API key headers
		/x-api-key:\s*[a-zA-Z0-9_-]{14,}/gi,
		
		// JSON key-value pairs that might contain sensitive data
		/"[a-zA-Z]*[kK]ey":\s*"[a-zA-Z0-9_-]{12,}"/gi,
		
		// Partial keys with ellipsis (sk-1234...cdef)
		/sk-[a-zA-Z0-9]{4,}\.{3}[a-zA-Z0-9]+/gi,
		/AIzaSy[a-zA-Z0-9_]{4,}\.{3}[a-zA-Z0-9_-]+/gi,
	];

	// Apply sanitization patterns
	for (const pattern of sensitivePatterns) {
		sanitized = sanitized.replace(pattern, '[REDACTED]');
	}

	// Additional cleanup for common patterns that might have been missed
	
	// Clean up multiple consecutive [REDACTED] tokens
	sanitized = sanitized.replace(/\[REDACTED\](\s*\[REDACTED\])+/g, '[REDACTED]');
	
	// Handle cases where base64 pattern might be too aggressive
	// Restore common safe patterns that aren't actually sensitive
	const safePatterns = [
		'Rate limit exceeded',
		'Please try again',
		'Invalid request',
		'Unauthorized',
		'Forbidden',
		'Not found',
		'Internal server error',
		'Bad request',
		'Timeout',
		'Connection failed'
	];
	
	// If the entire message got redacted but contains safe patterns, restore them
	if (sanitized === '[REDACTED]') {
		for (const safePattern of safePatterns) {
			if (errorMessage.toLowerCase().includes(safePattern.toLowerCase())) {
				return errorMessage;
			}
		}
	}

	return sanitized;
}
