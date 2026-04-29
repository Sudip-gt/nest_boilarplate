import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3000;

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? DEFAULT_PORT),
}));
