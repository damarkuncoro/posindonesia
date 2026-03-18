/**
 * Base class for all PostalCode related errors.
 */
export class PostalCodeError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PostalCodeError';
    Object.setPrototypeOf(this, PostalCodeError.prototype);
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends PostalCodeError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when communication with Pos Indonesia API fails.
 */
export class NetworkError extends PostalCodeError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown when HTML parsing fails.
 */
export class ParseError extends PostalCodeError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error thrown when no results are found (optional usage).
 */
export class NotFoundError extends PostalCodeError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
