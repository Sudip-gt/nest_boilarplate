export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly role: Role,
  ) { }
}
