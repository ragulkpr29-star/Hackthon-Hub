type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

export class Logger {
  private static log(level: LogLevel, message: string, context?: Record<string, any>) {
    const payload: LogPayload = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // Use structured JSON logging in production for observability tools
    if (process.env.NODE_ENV === "production") {
      // In a real prod environment we avoid standard console.log
      // We output stringified JSON.
      console[level](JSON.stringify(payload));
    } else {
      // Human readable for development
      console[level](`[${payload.timestamp}] ${level.toUpperCase()}: ${message}`, context ? context : "");
    }
  }

  static info(message: string, context?: Record<string, any>) {
    this.log("info", message, context);
  }

  static warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context);
  }

  static error(message: string, error?: unknown, context?: Record<string, any>) {
    const errorContext = error instanceof Error ? { errorMsg: error.message, stack: error.stack } : { error };
    this.log("error", message, { ...context, ...errorContext });
  }

  static debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", message, context);
    }
  }
}
