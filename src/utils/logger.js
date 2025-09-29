const winston = require('winston');

// Define severity levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Set log level based on environment; ensure 'http' logs are emitted in production
const level = () => (process.env.NODE_ENV === 'development' ? 'debug' : 'http');

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Format for console (with color)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Format for file (without color)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Ensure logs directory exists
const fs = require('fs');
const path = require('path');
const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define transports for logging
const transports = [
  // Console transport for all logs
  new winston.transports.Console({
    level: 'http', // ensure request logs are visible even in production
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }),
  // Error logs
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  // Combined logs
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false
});

// Also configure the global/default Winston logger so any direct usage like
// winston.info(...) by dependencies won't complain about missing transports.
winston.configure({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

// Handle uncaught exceptions and rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

/* logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message'); */
module.exports = logger;
