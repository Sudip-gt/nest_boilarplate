import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { User } from '../domain/entities/user.entity';
import type { UserRepository } from '../domain/ports/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany();
    return rows.map((r) => new User(r.id, r.email, r.name, r.createdAt));
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return new User(row.id, row.email, row.name, row.createdAt);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return new User(row.id, row.email, row.name, row.createdAt);
  }

  async create(data: { email: string; name: string }): Promise<User> {
    const row = await this.prisma.user.create({ data });
    return new User(row.id, row.email, row.name, row.createdAt);
  }
}
