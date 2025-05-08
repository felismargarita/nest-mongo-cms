export class HookException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HookException';
    Object.setPrototypeOf(this, HookException.prototype);
  }
}
