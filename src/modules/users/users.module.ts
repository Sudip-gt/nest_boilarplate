import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UsersModule {}
