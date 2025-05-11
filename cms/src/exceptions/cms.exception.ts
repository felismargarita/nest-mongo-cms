export class CMSException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CMSException';
    Object.setPrototypeOf(this, CMSException.prototype);
  }
}
