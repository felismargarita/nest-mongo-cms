export class HookAbortException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HookAbortException';
    Object.setPrototypeOf(this, HookAbortException.prototype);
  }
}
