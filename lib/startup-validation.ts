/**
 * Startup validation
 * Call this on app initialization to validate environment and configuration
 */

import { validateEnvVars } from './env-validation';

/**
 * Validates app configuration on startup
 * Should be called early in the app lifecycle
 */
export function validateStartup(): void {
  // Validate environment variables
  const envValidation = validateEnvVars();

  if (!envValidation.valid) {
    // In production, log but don't throw (graceful degradation)
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Missing required environment variables:', envValidation.missing);
      console.error('Some features may not work correctly.');
    } else {
      // In development, throw to catch issues early
      throw new Error(
        `Missing required environment variables: ${envValidation.missing.join(', ')}\n` +
        `Please check your .env.local file.`
      );
    }
  }

  // Additional startup validations can be added here
  // e.g., database connectivity, external service availability, etc.
}

