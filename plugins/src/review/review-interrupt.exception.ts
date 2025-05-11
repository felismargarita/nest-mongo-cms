import { HookException } from 'nest-mongo-cms';

export class ReviewInteruptException extends HookException {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewInteruptException';
    Object.setPrototypeOf(this, ReviewInteruptException.prototype);
  }
}