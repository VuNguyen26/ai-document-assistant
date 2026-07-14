import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  it('applies safe development defaults', () => {
    const result = validateEnvironment({});

    expect(result).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      STORAGE_DRIVER: 'local',
    });
  });

  it('rejects missing production variables', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
      }),
    ).toThrow('Missing required environment variables');
  });

  it('accepts a complete production configuration', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '8080',
      STORAGE_DRIVER: 'local',
      DATABASE_URL: 'postgresql://example',
      FRONTEND_URL: 'https://example.com',
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      OPENROUTER_API_KEY: 'api-key',
    });

    expect(result.PORT).toBe(8080);
  });

  it('requires credentials when R2 is enabled', () => {
    expect(() =>
      validateEnvironment({
        STORAGE_DRIVER: 'r2',
      }),
    ).toThrow('Missing required environment variables');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      validateEnvironment({
        PORT: '70000',
      }),
    ).toThrow('PORT must be an integer from 1 to 65535');
  });
});
