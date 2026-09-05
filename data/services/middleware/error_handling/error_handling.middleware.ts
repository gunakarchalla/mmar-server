import { NextFunction, Request, Response } from "express";
import { BaseError, HttpStatusCode } from "./standard_errors.middleware";
import { record_security_event } from "../../security_audit.service";
import { environment } from "../../environment";
import * as winston from "winston";

/**
 * @description - What a client is told when the server hit a problem it does not
 * describe deliberately. The details of such a failure — the failing SQL, the
 * table names, the file paths in the stack — are useful to an attacker and to
 * nobody else, so they go to the log and not to the response.
 */
const OPAQUE_MESSAGE = "Internal server error";

/**
 * @description - The last middleware of the chain: it turns any error raised
 * anywhere in the server into a response, and it always produces exactly one.
 *
 * Errors come in two kinds. A BaseError was raised on purpose to describe an
 * outcome to the caller, so its status and message are sent as written. Anything
 * else is an unexpected failure: it is logged in full and answered with an
 * opaque 500, because its message routinely carries the raw database error.
 * @param {unknown} err - The error raised upstream.
 * @param {Request} req - The request being answered.
 * @param {Response} res - The response.
 * @param {NextFunction} next - Delegates to Express once the response has started.
 */
export function logError(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const operational = err instanceof BaseError;
  const status = operational ? err.httpCode : HttpStatusCode.INTERNAL_SERVER;

  // Every refused request funnels through here, whichever layer raised it, so
  // this is the one place where a denial can be audited exhaustively.
  if (status === HttpStatusCode.FORBIDDEN && err instanceof BaseError) {
    record_security_event({
      event: "access_denied",
      outcome: "failure",
      req: req,
      uuid_user: req.user?.uuid,
      username: req.user?.username,
      reason: err.name,
      detail: { message: err.message },
    });
  }

  errorHandler.handleError(err, req);

  // Something already began writing the response — a handler that threw after
  // res.send(), for instance. Express's own handler is the only one that can
  // close a half written response, so hand it over rather than writing twice.
  if (res.headersSent) return next(err);

  res.status(status).json({
    error: operational ? err.message : OPAQUE_MESSAGE,
  });
}

export class ErrorHandler {
  /**
   * @description - Record an error with everything needed to diagnose it. This is
   * the only place the full detail exists: the response deliberately carries none
   * of it.
   * @param {unknown} err - The error to record.
   * @param {Request} req - The request it happened on, when there is one.
   */
  public handleError(err: unknown, req?: Request): void {
    const where = req ? `${req.method} ${req.originalUrl}` : "outside a request";
    if (err instanceof Error) {
      logger.error(`Unhandled error on ${where}: ${err.message}`, err);
    } else {
      logger.error(`Unhandled non-error thrown on ${where}: ${String(err)}`);
    }
  }

  /**
   * @description - Whether the error describes an outcome the server raised on
   * purpose. An untrusted error means the process reached a state it does not
   * model, which is what distinguishes "answer the client" from "shut down".
   * @param {unknown} error - The error to classify.
   * @returns {boolean} - True if the error is operational.
   */
  public isTrustedError(error: unknown): boolean {
    return error instanceof BaseError && error.isOperational;
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
    // A container's log is collected from its stdout, so the console transport is
    // kept in every mode. The file transport is additional rather than an
    // alternative: dropping it in production used to mean errors were written
    // where nothing collects them.
    const transports: winston.transport[] = [
      new winston.transports.Console({ format: formatter }),
    ];
    if (!environment.is_development) {
      transports.push(
        new winston.transports.File({ filename: "logs/error.log", level: "error" })
      );
    }

    this.logger = winston.createLogger({
      level: environment.is_development ? "trace" : "info",
      levels: customLevels.levels,
      transports: transports,
    });
    winston.addColors(customLevels.colors);
  }

  trace(msg: string, meta?: unknown) {
    this.logger.log("trace", msg, meta);
  }

  debug(msg: string, meta?: unknown) {
    this.logger.debug(msg, meta);
  }

  info(msg: string, meta?: unknown) {
    this.logger.info(msg, meta);
  }

  warn(msg: string, meta?: unknown) {
    this.logger.warn(msg, meta);
  }

  error(msg: string, meta?: Error) {
    this.logger.error(msg, meta);
  }

  fatal(msg: string, meta?: unknown) {
    this.logger.log("fatal", msg, meta);
  }
}

export const logger = new Logger();
