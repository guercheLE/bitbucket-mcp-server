/**
 * logging utility for the Bitbucket MCP server
 */

export interface LogContext {
  file?: string;
  method?: string;
  context?: string;
}

export type LogData = unknown;

export class Logger {
  private context: LogContext;
  private static globalLevel: number = 2; // INFO level (2), DEBUG level (1)

  static setGlobalLevel(level: number): void {
    Logger.globalLevel = level;
  }

  // Configurar nível baseado na configuração DEBUG
  static configureFromConfig(debugEnabled: boolean): void {
    Logger.globalLevel = debugEnabled ? 1 : 2; // 1=DEBUG, 2=INFO
  }

  static forContext(file?: string, method?: string, context?: string): Logger {
    return new Logger({
      file: file || 'unknown',
      method: method || 'unknown',
      context: context || 'unknown',
    });
  }

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = [this.context.file, this.context.method, this.context.context]
      .filter(Boolean)
      .join(':');

    let logMessage = `[${timestamp}] [${level}]`;
    if (contextStr) {
      logMessage += ` [${contextStr}]`;
    }
    logMessage += ` ${message}`;

    return logMessage;
  }

  private shouldLog(level: number): boolean {
    return level >= Logger.globalLevel;
  }

  private log(level: number, levelStr: string, message: string, data?: LogData): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelStr, message);

    // Use console.error for logging to avoid interfering with MCP protocol stdout
    if (data) {
      console.error(`${formattedMessage}`, data);
    } else {
      console.error(formattedMessage);
    }
  }

  debug(message: string, data?: LogData): void {
    this.log(1, 'DEBUG', message, data); // Nível 1
  }

  info(message: string, data?: LogData): void {
    this.log(2, 'INFO', message, data); // Nível 2
  }

  warn(message: string, data?: LogData): void {
    this.log(3, 'WARN', message, data); // Nível 3
  }

  error(message: string, data?: LogData): void {
    this.log(4, 'ERROR', message, data); // Nível 4
  }

  forMethod(method: string): Logger {
    return new Logger({
      ...this.context,
      method,
    });
  }

  forContext(context: string): Logger {
    return new Logger({
      ...this.context,
      context,
    });
  }
}
