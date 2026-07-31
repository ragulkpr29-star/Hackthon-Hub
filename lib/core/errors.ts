export class BaseError extends Error {
  constructor(message: string, public statusCode: number = 500, public context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GithubApiError extends BaseError {
  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message, statusCode, context);
  }
}

export class GithubRateLimitError extends GithubApiError {
  constructor(resetTime?: string) {
    super("GitHub API rate limit exceeded", 429, { resetTime });
  }
}

export class GeminiApiError extends BaseError {
  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message, statusCode, context);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, context);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, context);
  }
}
