/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  {
    name: 'SANITY_API_TOKEN',
    required: false, // Only required for write operations
    description: 'Sanity API token for write operations (view count updates, post creation)',
  },
  {
    name: 'OPENAI_API_KEY',
    required: false, // Only required for AI post generation
    description: 'OpenAI API key for AI-powered post generation',
  },
  {
    name: 'API_KEY',
    required: false, // Only required for protected API endpoints
    description: 'API key for authenticating protected endpoints (import-markdown, cron)',
  },
  {
    name: 'CRON_SECRET',
    required: false, // Only required if using cron endpoint
    description: 'Secret key for authenticating cron job requests',
  },
  {
    name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    required: false,
    description: 'Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)',
  },
  {
    name: 'NEXT_PUBLIC_ADSENSE_PUBLISHER_ID',
    required: false,
    description: 'Google AdSense Publisher ID (format: ca-pub-xxxxxxxxxx)',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    description: 'Base URL of the site (e.g., https://techbyjz.blog)',
  },
];

/**
 * Validates environment variables and returns missing required ones
 */
export function validateEnvVars(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      missing.push(envVar.name);
    } else if (!envVar.required && !value) {
      // Optional but recommended
      warnings.push(envVar.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates environment variables and throws if required ones are missing
 * Call this on app startup
 */
export function requireEnvVars(): void {
  const { valid, missing, warnings } = validateEnvVars();

  if (!valid) {
    const missingList = missing.map((name) => {
      const config = ENV_VARS.find((v) => v.name === name);
      return `  - ${name}${config?.description ? `: ${config.description}` : ''}`;
    }).join('\n');

    throw new Error(
      `Missing required environment variables:\n${missingList}\n\n` +
      `Please set these in your .env.local file or deployment environment.`
    );
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    const warningsList = warnings.map((name) => {
      const config = ENV_VARS.find((v) => v.name === name);
      return `  - ${name}${config?.description ? `: ${config.description}` : ''}`;
    }).join('\n');

    console.warn(
      `⚠️  Optional environment variables not set (features may be disabled):\n${warningsList}`
    );
  }
}

/**
 * Gets an environment variable with validation
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];

  if (!value && defaultValue === undefined) {
    const config = ENV_VARS.find((v) => v.name === name);
    if (config?.required) {
      throw new Error(
        `Required environment variable ${name} is not set. ${config.description || ''}`
      );
    }
  }

  return value || defaultValue || '';
}

