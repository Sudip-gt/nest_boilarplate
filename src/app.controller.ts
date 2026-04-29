import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Nest boilerplate is running',
      endpoints: {
        health: '/health',
        docs: '/api',
        users: '/users',
      },
    };
  }
}
