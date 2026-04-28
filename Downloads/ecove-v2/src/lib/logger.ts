/**
 * Structured logger using Pino.
 * Falls back gracefully if pino is not installed.
 * Usage:
 *   import logger from '@/lib/logger'
 *   logger.info({ orderId }, 'Payment confirmed')
 *   logger.error({ err, userId }, 'Login failed')
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogFn {
  (obj: Record<string, unknown>, msg: string): void
  (msg: string): void
}

interface Logger {
  trace: LogFn; debug: LogFn; info: LogFn
  warn: LogFn;  error: LogFn; fatal: LogFn
  child: (bindings: Record<string, unknown>) => Logger
}

function makeConsoleLogger(defaultContext: Record<string, unknown> = {}): Logger {
  const log = (level: LogLevel) =>
    (objOrMsg: Record<string, unknown> | string, msg?: string) => {
      const isProduction = process.env.NODE_ENV === 'production'
      if (isProduction) {
        // JSON output for log aggregators
        const entry = {
          level,
          time: new Date().toISOString(),
          ...defaultContext,
          ...(typeof objOrMsg === 'string' ? { msg: objOrMsg } : { ...objOrMsg, msg }),
        }
        // Use appropriate console method
        if (level === 'error' || level === 'fatal') console.error(JSON.stringify(entry))
        else if (level === 'warn') console.warn(JSON.stringify(entry))
        else console.log(JSON.stringify(entry))
      } else {
        // Pretty output for dev
        const message = typeof objOrMsg === 'string' ? objOrMsg : msg || ''
        const context = typeof objOrMsg === 'object' ? objOrMsg : {}
        const prefix = `[${level.toUpperCase()}]`
        const fn = level === 'error' || level === 'fatal' ? console.error
                 : level === 'warn' ? console.warn : console.log
        fn(prefix, message, Object.keys(context).length ? context : '')
      }
    }

  const logger: Logger = {
    trace: log('trace') as LogFn,
    debug: log('debug') as LogFn,
    info:  log('info')  as LogFn,
    warn:  log('warn')  as LogFn,
    error: log('error') as LogFn,
    fatal: log('fatal') as LogFn,
    child: (bindings) => makeConsoleLogger({ ...defaultContext, ...bindings }),
  }
  return logger
}

// Try to use pino for structured logging in production, fall back to console
let logger: Logger

try {
  // Dynamic import so pino is optional
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pino = require('pino')
  logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
      : undefined,
    base: { service: 'ecove-marketplace', env: process.env.NODE_ENV },
  })
} catch {
  logger = makeConsoleLogger()
}

export default logger

// Convenience log for API route errors
export function logApiError(route: string, err: unknown, context: Record<string, unknown> = {}) {
  logger.error({
    route,
    err: err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err,
    ...context,
  }, `API error in ${route}`)
}
