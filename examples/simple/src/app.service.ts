import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() public readonly connection: Connection) {}
  getHello(): string {
    // this.connection.model('Book').
    return 'Hello World!';
  }
}
