const NODE_ENV_VALUES = new Set(['development', 'test', 'production']);

const STORAGE_DRIVERS = new Set(['local', 'r2']);

const PRODUCTION_REQUIRED_KEYS = [
  'DATABASE_URL',
  'FRONTEND_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENROUTER_API_KEY',
] as const;

const R2_REQUIRED_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
] as const;

function readString(
  config: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = config[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function requireKeys(
  config: Record<string, unknown>,
  keys: readonly string[],
): void {
  const missing = keys.filter((key) => !readString(config, key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = readString(config, 'NODE_ENV') ?? 'development';

  if (!NODE_ENV_VALUES.has(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  const port = Number(readString(config, 'PORT') ?? '4000');

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }

  const storageDriver = readString(config, 'STORAGE_DRIVER') ?? 'local';

  if (!STORAGE_DRIVERS.has(storageDriver)) {
    throw new Error(`Invalid STORAGE_DRIVER: ${storageDriver}`);
  }

  if (nodeEnv === 'production') {
    requireKeys(config, PRODUCTION_REQUIRED_KEYS);
  }

  if (storageDriver === 'r2') {
    requireKeys(config, R2_REQUIRED_KEYS);
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    STORAGE_DRIVER: storageDriver,
  };
}
