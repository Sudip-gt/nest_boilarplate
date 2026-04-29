import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
