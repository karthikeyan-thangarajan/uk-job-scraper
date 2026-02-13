import winston from 'winston';
import path from 'path';
import { app } from 'electron';

const logDir = app?.getPath('userData') || '.';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
