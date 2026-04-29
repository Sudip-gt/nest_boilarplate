import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ??
    (() => {
      throw new Error('DATABASE_URL is required');
    })(),
}));
