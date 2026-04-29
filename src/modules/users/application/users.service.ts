import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import type { UserRepository } from '../domain/ports/user.repository';
import { USER_REPOSITORY } from '../domain/ports/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async create(data: { email: string; name: string }): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(`Email ${data.email} is already in use`);
    }
    return this.userRepository.create(data);
  }
}
