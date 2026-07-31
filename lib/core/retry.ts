import { Logger } from "./logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...defaultOptions, ...options };
  let currentDelay = config.initialDelay;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;

      const isRetryable =
        error.name === "TimeoutError" || // Network timeout
        error.code === "ECONNRESET" || // Connection reset
        (error.statusCode && config.retryableStatusCodes.includes(error.statusCode));

      if (!isRetryable || attempt > config.maxRetries) {
        Logger.error(`Operation '${context}' failed after ${attempt} attempts`, error);
        throw error;
      }

      Logger.warn(`Operation '${context}' failed. Retrying in ${currentDelay}ms (Attempt ${attempt}/${config.maxRetries})`, {
        error: error.message,
        statusCode: error.statusCode,
      });

      await delay(currentDelay);
      
      // Exponential backoff
      currentDelay = Math.min(currentDelay * config.backoffFactor, config.maxDelay);
    }
  }
};
