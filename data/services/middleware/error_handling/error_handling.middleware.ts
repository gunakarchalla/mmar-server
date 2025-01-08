import { NextFunction, Request, Response } from "express";
import { BaseError } from "./standard_errors.middleware";
import * as winston from "winston";
import { LogCallback } from "winston";

export function logError(
  err: BaseError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!errorHandler.isTrustedError(err)) {
    next(err);
  }
  errorHandler.handleError(err);
  res.status(err.httpCode || 500);
  res.send(err.message);
}

export class ErrorHandler {
  public handleError(err: Error): void {
    //console.error('Error message from the centralized error-handling component',err)
    logger.error(
      "Error message from the centralized error-handling component: ",
      err
    );
  }

  public isTrustedError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }
}

export const errorHandler = new ErrorHandler();

const customLevels = {
  levels: {
    trace: 5,
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
    fatal: 0,
  },
  colors: {
    trace: "white",
    debug: "green",
    info: "green",
    warn: "yellow",
    error: "red",
    fatal: "red",
  },
};

const formatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
      }`;
  })
);

class Logger {
  private logger: winston.Logger;

  constructor() {
    const prodTransport = new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    });
    const transport = new winston.transports.Console({
      format: formatter,
    });
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV == "development" ? "trace" : "error",
      levels: customLevels.levels,
      transports: [
        process.env.NODE_ENV == "development" ? transport : prodTransport,
      ],
    });
    winston.addColors(customLevels.colors);
  }

  trace(msg: string, meta?: LogCallback) {
    this.logger.log("trace", msg, meta);
  }

  debug(msg: string, meta?: LogCallback) {
    this.logger.debug(msg, meta);
  }

  info(msg: string, meta?: LogCallback) {
    this.logger.info(msg, meta);
  }

  warn(msg: string, meta?: LogCallback) {
    this.logger.warn(msg, meta);
  }

  error(msg: string, meta?: Error) {
    this.logger.error(msg, meta);
  }

  fatal(msg: string, meta?: LogCallback) {
    this.logger.log("fatal", msg, meta);
  }
}

export const logger = new Logger();
