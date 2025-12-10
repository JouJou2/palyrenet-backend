import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LOG] [${logContext}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    const logContext = context || this.context || 'Application';
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${logContext}] ${message}`);
    if (trace) {
      console.error(`[${timestamp}] [TRACE] ${trace}`);
    }
  }

  warn(message: any, context?: string) {
    const logContext = context || this.context || 'Application';
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${logContext}] ${message}`);
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const logContext = context || this.context || 'Application';
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] [${logContext}] ${message}`);
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const logContext = context || this.context || 'Application';
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [VERBOSE] [${logContext}] ${message}`);
    }
  }
}
