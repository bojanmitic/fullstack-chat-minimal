/**
 * Structured logging utility
 * Provides consistent logging across the application
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  userId?: string;
  conversationId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_INFO_LOGS === "true"
    ) {
      console.log(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };
    console.error(this.formatMessage("error", message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  /**
   * Log API usage/cost tracking events
   */
  logApiUsage(
    service: string,
    operation: string,
    cost: number,
    context?: LogContext
  ): void {
    this.info(`API Usage: ${service}.${operation}`, {
      ...context,
      cost: `$${cost.toFixed(6)}`,
    });
  }

  /**
   * Log limit check events
   */
  logLimitCheck(
    userId: string,
    allowed: boolean,
    dailyUsage?: number,
    dailyLimit?: number
  ): void {
    if (!allowed) {
      this.warn("Limit check failed", {
        userId,
        dailyUsage,
        dailyLimit,
        reason: "Limit exceeded",
      });
    } else {
      this.debug("Limit check passed", {
        userId,
        dailyUsage,
        dailyLimit,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogContext, LogLevel };
