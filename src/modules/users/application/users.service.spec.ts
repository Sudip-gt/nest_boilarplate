import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../domain/entities/user.entity';
import {
    USER_REPOSITORY,
    type UserRepository,
} from '../domain/ports/user.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: jest.Mocked<UserRepository>;

    beforeEach(async () => {
        userRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: USER_REPOSITORY,
                    useValue: userRepository,
                },
            ],
        }).compile();

        service = module.get(UsersService);
    });

    it('returns all users', async () => {
        const user = new User('1', 'john@example.com', 'John', new Date());
        userRepository.findAll.mockResolvedValue([user]);

        await expect(service.findAll()).resolves.toEqual([user]);
    });

    it('throws when a user is not found', async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(service.findById('missing')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('throws when email is already in use', async () => {
        const existing = new User('1', 'john@example.com', 'John', new Date());
        userRepository.findByEmail.mockResolvedValue(existing);

        await expect(
            service.create({ email: 'john@example.com', name: 'John' }),
        ).rejects.toBeInstanceOf(ConflictException);
    });
});
