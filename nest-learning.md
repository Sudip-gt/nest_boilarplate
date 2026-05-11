# NestJS Boilerplate — Learning Guide

A comprehensive reference for everything installed, configured, and applied in this project.

---

## Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [File & Folder Structure](#2-file--folder-structure)
3. [Packages & Dependencies](#3-packages--dependencies)
4. [NestJS Core Concepts Used](#4-nestjs-core-concepts-used)
5. [Module Breakdown](#5-module-breakdown)
6. [Request Lifecycle in This Project](#6-request-lifecycle-in-this-project)
7. [Database Layer — Prisma](#7-database-layer--prisma)
8. [Configuration System](#8-configuration-system)
9. [Validation & DTOs](#9-validation--dtos)
10. [Swagger / OpenAPI Documentation](#10-swagger--openapi-documentation)
11. [Error Handling](#11-error-handling)
12. [Testing Setup](#12-testing-setup)
13. [Docker Setup](#13-docker-setup)
14. [Scripts Reference](#14-scripts-reference)

---

## 1. Project Architecture Overview

This project follows **Hexagonal Architecture** (also called Ports & Adapters), organized inside NestJS modules. The goal is to keep the **domain/business logic completely decoupled from frameworks and infrastructure** (e.g., database, HTTP).

```
HTTP Request
     ↓
Controller (Presentation Layer)
     ↓
Service (Application Layer)
     ↓
Repository Port (Domain Interface)
     ↓
Repository Implementation (Infrastructure Layer — Prisma)
     ↓
PostgreSQL Database
```

Each layer has a single responsibility:

| Layer | Responsibility | Files |
|---|---|---|
| **Presentation** | Handle HTTP, validate input, shape output | `users.controller.ts`, DTOs |
| **Application** | Orchestrate business rules | `users.service.ts` |
| **Domain** | Core entities and repository interface contracts | `user.entity.ts`, `user.repository.ts` |
| **Infrastructure** | Implement repository using Prisma | `prisma-user.repository.ts` |

---

## 2. File & Folder Structure

```
nest_boilarplate/
│
├── docker-compose.yml          # PostgreSQL container definition
├── eslint.config.mjs           # ESLint flat config (v9 format)
├── nest-cli.json               # NestJS CLI configuration
├── package.json                # Dependencies and npm scripts
├── prisma.config.ts            # Prisma CLI configuration (schema path, migrations path)
├── tsconfig.json               # Base TypeScript configuration
├── tsconfig.build.json         # TypeScript config used during production build
│
├── prisma/
│   ├── schema.prisma           # Prisma data model — defines the User model and DB connection
│   └── migrations/
│       ├── migration_lock.toml              # Locks the migration provider (postgresql)
│       └── 20260428095715_init/
│           └── migration.sql               # Auto-generated SQL for the initial schema
│
├── src/
│   ├── main.ts                 # Entry point — bootstraps the app, sets up global pipes, filters, Swagger
│   ├── app.module.ts           # Root module — imports all feature modules and ConfigModule
│   ├── app.controller.ts       # Root controller — GET / returns running status and endpoint map
│   │
│   ├── common/
│   │   └── filters/
│   │       └── http-exception.filter.ts    # Global exception filters for HTTP and unhandled errors
│   │
│   ├── config/
│   │   ├── app.config.ts       # Typed config namespace for PORT and NODE_ENV
│   │   └── database.config.ts  # Typed config namespace for DATABASE_URL
│   │
│   ├── health/
│   │   ├── health.module.ts    # Imports TerminusModule for health checks
│   │   └── health.controller.ts # GET /health — checks database connectivity via Prisma ping
│   │
│   ├── infrastructure/
│   │   └── prisma/
│   │       ├── prisma.module.ts    # Global module that provides and exports PrismaService
│   │       └── prisma.service.ts   # Extends PrismaClient, connects/disconnects on module lifecycle
│   │
│   └── modules/
│       └── users/
│           ├── users.module.ts     # Wires controller, service, and repository token together
│           │
│           ├── application/
│           │   ├── users.service.ts        # Business logic: findAll, findById, create (with conflict check)
│           │   └── users.service.spec.ts   # Unit tests for UsersService using mocked repository
│           │
│           ├── domain/
│           │   ├── entities/
│           │   │   └── user.entity.ts          # Pure domain class — no framework dependencies
│           │   └── ports/
│           │       └── user.repository.ts      # Repository interface (Port) + injection token symbol
│           │
│           ├── infrastructure/
│           │   └── prisma-user.repository.ts   # Implements UserRepository using PrismaService
│           │
│           └── presentation/
│               ├── users.controller.ts         # REST controller: GET /users, GET /users/:id, POST /users
│               └── dto/
│                   ├── create-user.dto.ts      # Input DTO with class-validator and Swagger decorators
│                   └── user-response.dto.ts    # Output DTO with static fromDomain() mapper
│
└── test/
    ├── app.e2e-spec.ts         # End-to-end test for the root endpoint
    └── jest-e2e.json           # Jest config for e2e tests (uses different test file pattern)
```

---

## 3. Packages & Dependencies

### Production Dependencies

#### NestJS Core

| Package | Version | Significance |
|---|---|---|
| `@nestjs/common` | ^11.0.1 | Core building blocks: `@Module`, `@Injectable`, `@Controller`, `@Get`, `@Post`, decorators like `@Inject`, `@Body`, `@Param`, exceptions like `NotFoundException`, pipes like `ValidationPipe` |
| `@nestjs/core` | ^11.0.1 | The internal engine of NestJS — `NestFactory`, the IoC container, dependency injection system, and module bootstrapping |
| `@nestjs/platform-express` | ^11.0.1 | Adapter that connects NestJS to the Express.js HTTP server. NestJS is platform-agnostic; this adapter bridges the two |

#### Configuration

| Package | Version | Significance |
|---|---|---|
| `@nestjs/config` | ^4.0.4 | Typed configuration management. Provides `ConfigModule.forRoot()` to load `.env` files, and `ConfigService` to inject config values. Supports `registerAs()` namespacing for organized config objects |
| `joi` | ^18.1.2 | Schema-based environment variable validation. Used in `AppModule` to validate that required env vars (`DATABASE_URL`, `PORT`, `NODE_ENV`) exist and have correct types on startup |

#### Database

| Package | Version | Significance |
|---|---|---|
| `prisma` | ^7.8.0 | Prisma CLI — used to run `prisma migrate dev`, `prisma generate`, etc. Manages schema and migrations |
| `@prisma/client` | ^7.8.0 | Auto-generated type-safe database client. Provides `PrismaClient` which is extended by `PrismaService` |
| `@prisma/adapter-pg` | ^7.8.0 | Connects the Prisma client to a raw `pg` (node-postgres) driver. Passed as `adapter` to `PrismaClient` for Driver Adapters mode |
| `pg` | ^8.20.0 | The underlying PostgreSQL driver for Node.js. Required by `@prisma/adapter-pg` to communicate with the database |

#### API & Validation

| Package | Version | Significance |
|---|---|---|
| `@nestjs/swagger` | ^11.4.2 | Generates interactive OpenAPI (Swagger) documentation from decorators like `@ApiTags`, `@ApiProperty`, `@ApiOkResponse`. Accessible at `/api` |
| `swagger-ui-express` | ^5.0.1 | Serves the Swagger UI HTML interface. Peer dependency of `@nestjs/swagger` when using Express |
| `class-validator` | ^0.15.1 | Adds validation decorators (`@IsEmail`, `@IsString`, `@MinLength`) to DTO classes. Works with NestJS `ValidationPipe` to automatically validate incoming request bodies |
| `class-transformer` | ^0.5.1 | Transforms plain JSON objects into DTO class instances and back. Required by `ValidationPipe` with `transform: true` |

#### Health Checks

| Package | Version | Significance |
|---|---|---|
| `@nestjs/terminus` | ^11.1.1 | Official NestJS health check library. Provides `HealthCheckService`, `PrismaHealthIndicator`, and `@HealthCheck()` decorator for the `GET /health` endpoint |

#### Runtime Utilities

| Package | Version | Significance |
|---|---|---|
| `reflect-metadata` | ^0.2.2 | Polyfill for the Reflect metadata API. Required by TypeScript decorators (the backbone of NestJS dependency injection). Must be imported once at the app entry point |
| `rxjs` | ^7.8.1 | Reactive programming library. NestJS uses Observables internally. Some NestJS features (interceptors, guards) work with Observables |

---

### Development Dependencies

#### NestJS Tooling

| Package | Version | Significance |
|---|---|---|
| `@nestjs/cli` | ^11.0.0 | The `nest` CLI — used to build, start, and scaffold the project (`nest new`, `nest generate module`, etc.) |
| `@nestjs/schematics` | ^11.0.0 | Code generation schematics used by the CLI to scaffold modules, services, controllers, etc. |
| `@nestjs/testing` | ^11.0.1 | Provides `Test.createTestingModule()` for building isolated NestJS module contexts in unit and integration tests |

#### Testing

| Package | Version | Significance |
|---|---|---|
| `jest` | ^30.0.0 | JavaScript test runner. Configured to run `.spec.ts` files in `src/` |
| `ts-jest` | ^29.2.5 | Jest transformer that allows running TypeScript test files directly without pre-compiling |
| `supertest` | ^7.0.0 | HTTP assertion library. Used in e2e tests to make real HTTP requests to the NestJS app |
| `@types/jest` | ^30.0.0 | TypeScript type definitions for Jest globals (`describe`, `it`, `expect`, etc.) |
| `@types/supertest` | ^7.0.0 | TypeScript types for the supertest library |

#### TypeScript

| Package | Version | Significance |
|---|---|---|
| `typescript` | ^5.7.3 | The TypeScript compiler. Compiles `.ts` files to JavaScript |
| `ts-node` | ^10.9.2 | Executes TypeScript files directly without pre-compiling. Used by NestJS dev server |
| `ts-loader` | ^9.5.2 | Webpack loader for TypeScript, used internally by the NestJS build pipeline |
| `tsconfig-paths` | ^4.2.0 | Resolves TypeScript path aliases (`paths` in `tsconfig.json`) at runtime |
| `@types/node` | ^24.12.2 | TypeScript definitions for Node.js built-in modules |
| `@types/express` | ^5.0.0 | TypeScript definitions for Express.js (used in filters when accessing `Request`/`Response` objects) |
| `source-map-support` | ^0.5.21 | Maps compiled JavaScript stack traces back to original TypeScript source lines |

#### Linting & Formatting

| Package | Version | Significance |
|---|---|---|
| `eslint` | ^9.18.0 | JavaScript/TypeScript linter. Configured with `eslint.config.mjs` (flat config format) |
| `typescript-eslint` | ^8.20.0 | ESLint plugin and parser for TypeScript-specific linting rules |
| `eslint-config-prettier` | ^10.0.1 | Disables ESLint rules that conflict with Prettier formatting |
| `eslint-plugin-prettier` | ^5.2.2 | Runs Prettier as an ESLint rule so formatting errors appear as lint errors |
| `prettier` | ^3.8.3 | Opinionated code formatter for consistent code style |
| `globals` | ^17.0.0 | Provides global variable lists (browser, node, etc.) for ESLint flat config |
| `@eslint/eslintrc` | ^3.2.0 | Compatibility utilities for migrating older ESLint configs to flat config |
| `@eslint/js` | ^9.18.0 | ESLint's built-in recommended rule set for JavaScript |

#### Configuration Dev Tools

| Package | Version | Significance |
|---|---|---|
| `dotenv` | ^17.4.2 | Loads `.env` files into `process.env`. Used in `prisma.config.ts` for the Prisma CLI to access `DATABASE_URL` during migrations |

---

## 4. NestJS Core Concepts Used

### Decorators

NestJS is decorator-driven. Decorators are TypeScript metadata annotations that tell the framework how to treat a class or method.

| Decorator | Used In | Purpose |
|---|---|---|
| `@Module()` | All `*.module.ts` files | Declares a NestJS module with its `imports`, `controllers`, `providers`, and `exports` |
| `@Controller()` | `users.controller.ts`, `health.controller.ts` | Marks a class as an HTTP controller and sets the base route prefix |
| `@Injectable()` | Services, repositories | Marks a class as injectable — registers it in the NestJS IoC container |
| `@Global()` | `prisma.module.ts` | Makes a module's exports available to all other modules without needing explicit imports |
| `@Get()`, `@Post()` | Controllers | Maps HTTP GET/POST requests to handler methods |
| `@Body()` | `users.controller.ts` | Extracts and validates the request body into a DTO |
| `@Param()` | `users.controller.ts` | Extracts a URL path parameter |
| `@Inject()` | `users.service.ts` | Injects a dependency by a custom token (Symbol) instead of by class type |
| `@Catch()` | `http-exception.filter.ts` | Marks an exception filter and declares which exception types it handles |
| `@HealthCheck()` | `health.controller.ts` | Terminus decorator that triggers health check execution |

### Dependency Injection (DI)

NestJS has a built-in **Inversion of Control (IoC) container**. Instead of creating class instances manually, you declare dependencies in constructors and NestJS injects them.

**Token-based injection** is used for the repository port:

```typescript
// 1. Define a Symbol as the injection token
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// 2. In the module, bind the token to a concrete class
{
  provide: USER_REPOSITORY,
  useClass: PrismaUserRepository,
}

// 3. In the service, inject by token
constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepository: UserRepository,
) {}
```

This allows swapping `PrismaUserRepository` with any other implementation (e.g., an in-memory repo for tests) without changing `UsersService`.

### Modules

Every feature in NestJS is organized into a **Module**. A module is a class decorated with `@Module()` that groups related controllers and providers.

- **`AppModule`** — Root module. Imported by `NestFactory.create()`. Brings in all feature modules.
- **`PrismaModule`** — Marked `@Global()`, so `PrismaService` is available everywhere without re-importing.
- **`UsersModule`** — Self-contained feature module with its own controller, service, and repository binding.
- **`HealthModule`** — Imports `TerminusModule` and exposes the health endpoint.

### Lifecycle Hooks

`PrismaService` implements two NestJS lifecycle interfaces:

```typescript
implements OnModuleInit, OnModuleDestroy
```

- **`onModuleInit()`** — Runs when the module is initialized. Used to call `this.$connect()`.
- **`onModuleDestroy()`** — Runs when the application shuts down. Used to call `this.$disconnect()`.

This ensures the database connection is opened and closed cleanly with the application lifecycle.

### Global Pipes

`ValidationPipe` is registered globally in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strips unknown properties from request body
  forbidNonWhitelisted: true, // Throws 400 error if unknown properties are sent
  transform: true,           // Converts plain objects to DTO class instances
}));
```

### Global Filters

`AllExceptionsFilter` is registered globally:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

This catches every unhandled exception in the entire application and returns a consistent JSON error response.

### Exception Classes

NestJS ships with built-in HTTP exceptions:

| Exception | HTTP Status | Used In |
|---|---|---|
| `NotFoundException` | 404 | `UsersService.findById()` when user not found |
| `ConflictException` | 409 | `UsersService.create()` when email already exists |

---

## 5. Module Breakdown

### AppModule (`app.module.ts`)

The root module. Key responsibilities:
- Loads `ConfigModule.forRoot()` with `isGlobal: true` so `ConfigService` is available everywhere
- Validates environment variables using `Joi` schema on startup — app will crash if required vars are missing
- Loads typed config namespaces (`appConfig`, `databaseConfig`) via the `load` array
- Registers `PrismaModule`, `HealthModule`, `UsersModule`

### PrismaModule (`infrastructure/prisma/`)

- Marked `@Global()` — `PrismaService` is available to every module without explicit import
- `PrismaService` extends `PrismaClient` and uses `PrismaPg` (Driver Adapters) to connect via the `pg` driver
- Connection URL is injected via `ConfigService` using the typed `database.url` namespace

### UsersModule (`modules/users/`)

The primary feature module demonstrating Hexagonal Architecture:

```
UsersModule
├── providers:
│   ├── UsersService                       (application layer)
│   └── { provide: USER_REPOSITORY,        (domain port)
│           useClass: PrismaUserRepository } (infrastructure adapter)
└── controllers:
    └── UsersController                    (presentation layer)
```

### HealthModule (`health/`)

- Imports `@nestjs/terminus` (`TerminusModule`)
- `HealthController` uses `PrismaHealthIndicator.pingCheck()` to verify the database is reachable
- Accessible at `GET /health`

---

## 6. Request Lifecycle in This Project

### Example: `POST /users`

```
1. HTTP Request arrives at Express
2. NestJS routes it to UsersController.create()
3. @Body() triggers ValidationPipe:
   - Deserializes JSON → CreateUserDto instance
   - Validates @IsEmail(), @IsString(), @MinLength(2)
   - Strips any extra unknown fields (whitelist: true)
4. UsersController calls usersService.create(dto)
5. UsersService checks if email exists via userRepository.findByEmail()
   → throws ConflictException (409) if found
6. UsersService calls userRepository.create(data)
7. PrismaUserRepository executes prisma.user.create()
8. Prisma queries PostgreSQL
9. Result mapped to User domain entity
10. Mapped to UserResponseDto via UserResponseDto.fromDomain()
11. NestJS serializes DTO to JSON and sends HTTP 201 response
```

---

## 7. Database Layer — Prisma

### Schema (`prisma/schema.prisma`)

```prisma
model User {
  id        String   @id @default(uuid())   // UUID primary key, auto-generated
  email     String   @unique                 // Unique constraint
  name      String
  createdAt DateTime @default(now())         // Auto-set on creation

  @@map("users")                             // Maps to the "users" table
}
```

### Driver Adapters (`@prisma/adapter-pg`)

Instead of the default Prisma connector, this project uses the **Driver Adapters** approach. `PrismaPg` wraps a `pg` connection string and is passed directly to `PrismaClient`:

```typescript
new PrismaPg(configService.getOrThrow<string>('database.url', { infer: true }))
```

This allows using the `pg` driver directly, enabling better compatibility with environments like edge functions or connection poolers.

### Migrations

Managed by the Prisma CLI:
- `npx prisma migrate dev` — creates a new migration and applies it
- `npx prisma migrate deploy` — applies pending migrations in production
- Migration files are SQL and checked into version control under `prisma/migrations/`

### `prisma.config.ts`

Configures the Prisma CLI tool itself (not the runtime client):
- Points to `prisma/schema.prisma` for the schema
- Points to `prisma/migrations` for migration files
- Loads `DATABASE_URL` from `.env` via `dotenv/config`

---

## 8. Configuration System

### How it works

1. **`@nestjs/config`** loads `.env` into `process.env`
2. **Joi** validates required variables at startup
3. **`registerAs()`** creates typed namespaces

```typescript
// config/app.config.ts
export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
}));

// Usage anywhere
configService.getOrThrow<number>('app.port', { infer: true });
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `3000` | HTTP server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |

### Example `.env`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mydb
```

---

## 9. Validation & DTOs

### `CreateUserDto`

Input validation DTO for `POST /users`:

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()          // class-validator: must be a valid email address
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()         // class-validator: must be a string
  @MinLength(2)       // class-validator: minimum 2 characters
  name!: string;
}
```

### `UserResponseDto`

Output shaping DTO. Uses a static factory method `fromDomain()` to map from the domain `User` entity to the response shape:

```typescript
static fromDomain(user: User): UserResponseDto {
  const dto = new UserResponseDto();
  dto.id = user.id;
  dto.email = user.email;
  // ...
  return dto;
}
```

This decouples the API response shape from the internal domain model.

### `ParseUUIDPipe`

Used on the `GET /users/:id` route parameter:

```typescript
@Param('id', ParseUUIDPipe) id: string
```

Automatically validates that `:id` is a valid UUID string. Returns HTTP 400 if not.

---

## 10. Swagger / OpenAPI Documentation

Set up in `main.ts` using `DocumentBuilder` and `SwaggerModule`:

```typescript
const config = new DocumentBuilder()
  .setTitle('NestJS Hexagonal Boilerplate')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()     // Adds Authorization header input to Swagger UI
  .build();

SwaggerModule.setup('api', app, document);  // Served at GET /api
```

### Swagger Decorators Used

| Decorator | Where | Purpose |
|---|---|---|
| `@ApiTags('Users')` | Controllers | Groups endpoints under a named tag in Swagger UI |
| `@ApiProperty()` | DTOs | Documents DTO fields so Swagger can generate request/response schemas |
| `@ApiOkResponse()` | GET handlers | Documents the 200 response shape |
| `@ApiCreatedResponse()` | POST handlers | Documents the 201 response shape |
| `@ApiExcludeController()` | `AppController` | Hides the root controller from Swagger UI |

---

## 11. Error Handling

### Two Exception Filters

Both are defined in `src/common/filters/http-exception.filter.ts`:

**`HttpExceptionFilter`** — Handles known NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`, etc.):

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter { ... }
```

**`AllExceptionsFilter`** — Catch-all for any unhandled error (e.g., Prisma errors, runtime exceptions):

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter { ... }
```

Both return a consistent JSON error envelope:

```json
{
  "statusCode": 404,
  "message": "User with id abc not found",
  "timestamp": "2026-04-29T10:00:00.000Z",
  "path": "/users/abc"
}
```

Only `AllExceptionsFilter` is registered globally in `main.ts`. It handles both HTTP exceptions and unknown errors by checking `instanceof HttpException`.

---

## 12. Testing Setup

### Unit Tests (`*.spec.ts`)

- Run with `npm test`
- Located alongside source files (e.g., `users.service.spec.ts`)
- Uses `@nestjs/testing`'s `Test.createTestingModule()` to build isolated module contexts
- Repository is mocked using `jest.fn()` — the real database is never touched

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useValue: userRepository,  // inject mock instead of real implementation
    },
  ],
}).compile();
```

### E2E Tests (`test/app.e2e-spec.ts`)

- Run with `npm run test:e2e`
- Uses `supertest` to make real HTTP requests to the bootstrapped NestJS app
- Separate Jest config in `test/jest-e2e.json` with pattern `**/*.e2e-spec.ts`

### Jest Configuration (from `package.json`)

```json
{
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "coverageDirectory": "../coverage"
}
```

---

## 13. Docker Setup

`docker-compose.yml` defines a single PostgreSQL service for local development:

```yaml
services:
  db:
    image: postgres:15
    container_name: postgres_db
    ports:
      - '5433:5432'       # Host port 5433 → Container port 5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist data between restarts
```

Start the database:
```bash
docker compose up -d
```

Matching connection string:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mydb
```

---

## 14. Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `start` | `nest start` | Start the application |
| `start:dev` | `nest start --watch` | Start with hot reload (development) |
| `start:debug` | `nest start --debug --watch` | Start with debugger attached |
| `start:prod` | `node dist/main` | Run the compiled production build |
| `build` | `nest build` | Compile TypeScript to `dist/` |
| `format` | `prettier --write ...` | Auto-format all source files |
| `lint` | `eslint ... --fix` | Lint and auto-fix all source files |
| `test` | `jest` | Run all unit tests |
| `test:watch` | `jest --watch` | Run unit tests in watch mode |
| `test:cov` | `jest --coverage` | Run tests with coverage report |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | Run end-to-end tests |
