/**
 * Interface for logging within the library.
 * Allows users to inject their own logging mechanism.
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * A simple implementation of the Logger interface that uses the console.
 */
export class ConsoleLogger implements Logger {
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * A logger implementation that does nothing.
 */
export class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
